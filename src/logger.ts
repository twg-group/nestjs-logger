import {
  ConsoleLogger,
  ConsoleLoggerOptions,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import * as util from 'node:util';
import {
  clc,
  LoggerLevelFormats,
  LoggerModuleOptions,
  LoggerOptions,
  LogLevel,
} from './interfaces';
import { LOGGER_MODULE_OPTIONS } from './logger.module';

const levelFormats: LoggerLevelFormats = {
  LOG: {
    levelColor: clc.greenBright,
    messageColor: undefined,
  },
  ERROR: {
    levelColor: clc.redBright,
    messageColor: clc.redBright,
  },
  FATAL: {
    levelColor: clc.redOrange,
    messageColor: clc.brightRedOrange,
  },
  WARN: {
    levelColor: clc.yellowBright,
    messageColor: clc.yellowBright,
  },
  INFO: {
    levelColor: clc.cyanBright,
    messageColor: clc.cyanBright,
  },
  DEBUG: {
    levelColor: clc.magentaBright,
    messageColor: clc.magentaBright,
  },
  VERBOSE: {
    levelColor: clc.blueBright,
    messageColor: clc.blueBright,
  },
};

export const defaultLoggerOptions: LoggerOptions = {
  id: 'Nest',
  jsonFormat: false,
  prettyPrintJson: false,
  levelFormats,
  redactKeys: [],
  logLevels: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal', 'info'],
};

@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends ConsoleLogger {
  private config: LoggerOptions;
  private timestamp = 0;
  private ctxParams: string[] = [];
  private additionalFields: Record<string, unknown> = {};
  private redactKeys: Set<string> = new Set();
  private logLevels: Set<LogLevel> = new Set();

  constructor(
    context?: string,
    options: LoggerOptions = {},
    @Inject(INQUIRER) private readonly parentClass?: object,
    @Inject(LOGGER_MODULE_OPTIONS)
    private readonly moduleOptions?: LoggerModuleOptions,
  ) {
    const currentContext = context || parentClass?.constructor?.name;
    const mergedOptions = {
      ...defaultLoggerOptions,
      ...(moduleOptions?.loggerOptions || {}),
      ...options,
    };
    const consoleOptions: ConsoleLoggerOptions = {
      ...mergedOptions,
      ...{ logLevels: [] },
    };
    super(currentContext, consoleOptions);

    this.setOptions(mergedOptions);
  }

  private prefix(): string {
    const out: string[] = [];
    if (this.config.id) {
      out.push(clc.green(`[${this.config.id}]`));
    }
    out.push(clc.gray(`${new Date().toISOString()}`));
    return out.join(' ');
  }

  setContext(context: string): this {
    super.setContext(context);
    return this;
  }

  setOptions(options: LoggerOptions): this {
    this.config = { ...this.config, ...options };
    if (options.redactKeys?.length > 0) {
      this.setRedactKeys(options.redactKeys);
    }
    if (options.logLevels?.length > 0) {
      this.setLogLevels(options.logLevels);
    }
    return this;
  }

  setLogLevels(levels: LogLevel[]): this {
    this.logLevels = new Set(levels);
    return this;
  }

  addLogLevel(level: LogLevel): this {
    this.logLevels.add(level);
    return this;
  }

  removeLogLevel(level: LogLevel): this {
    this.logLevels.delete(level);
    return this;
  }

  getLogLevels(): LogLevel[] {
    return Array.from(this.logLevels);
  }

  setCtxParams(context: string[]): this {
    this.ctxParams = context;
    return this;
  }

  resetTimestamp(): this {
    this.timestamp = 0;
    return this;
  }

  enableJsonFormat(): this {
    this.config.jsonFormat = true;
    return this;
  }

  disableJsonFormat(): this {
    this.config.jsonFormat = false;
    return this;
  }

  enablePrettyPrint(): this {
    this.config.prettyPrintJson = true;
    return this;
  }

  disablePrettyPrint(): this {
    this.config.prettyPrintJson = false;
    return this;
  }

  addField(obj: Record<string, unknown>): this {
    for (const key of Object.keys(obj)) {
      this.additionalFields[key] = obj[key];
    }
    return this;
  }

  removeField(key: string): this {
    delete this.additionalFields[key];
    return this;
  }

  setRedactKeys(keys: string[]): this {
    this.redactKeys = new Set(keys);
    return this;
  }

  addRedactKey(key: string): this {
    this.redactKeys.add(key);
    return this;
  }

  removeRedactKey(key: string): this {
    this.redactKeys.delete(key);
    return this;
  }

  getRedactKeys(): string[] {
    return Array.from(this.redactKeys);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('log')) {
      this.logMessage('LOG', message, optionalParams);
    }
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('error')) {
      this.logMessage('ERROR', message, optionalParams, console.error);
    }
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('fatal')) {
      this.logMessage('FATAL', message, optionalParams, console.error);
    }
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('warn')) {
      this.logMessage('WARN', message, optionalParams, console.warn);
    }
  }

  info(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('info')) {
      this.logMessage('INFO', message, optionalParams, console.info);
    }
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('debug')) {
      this.logMessage('DEBUG', message, optionalParams, console.debug);
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    if (this.logLevels.has('verbose')) {
      this.logMessage('VERBOSE', message, optionalParams);
    }
  }

  private logMessage(
    level: keyof typeof this.config.levelFormats,
    message: unknown,
    params: unknown[] = [],
    consoleMethod: (...args: unknown[]) => void = console.log,
  ): void {
    const processedParams = params.map((param) => {
      if (typeof param === 'object' && param !== null) {
        return this.redactSensitiveData(param as Record<string, unknown>);
      }
      return param;
    });
    if (this.config.jsonFormat) {
      consoleMethod(this.formatToJson(level, message, processedParams));
      return;
    }
    const { levelColor, messageColor } = this.config.levelFormats[level];
    const [prefix, levelText] = this.pre(level, levelColor);
    consoleMethod(
      prefix,
      levelText,
      ...this.wrapMessage(message, processedParams, messageColor),
    );
  }

  private pre(
    level: string,
    colorFn: (text: string) => string = clc.gray,
  ): [string, string] {
    return [this.prefix(), colorFn(`${clc.bold(level.padStart(5))}`)];
  }

  private formatToJson(
    level: string,
    message: unknown,
    params: unknown[] = [],
  ): string {
    const logEntry: Record<string, unknown> = {
      ...this.additionalFields,
      timestamp: new Date().toISOString(),
      service: this.config.id,
      level,
      context: this.context,
      data: this.format(message),
    };
    if (this.config.id) {
      logEntry.service = this.config.id;
    }
    if (this.ctxParams.length > 0 || params.length > 0) {
      logEntry.tags = [
        ...this.ctxParams,
        ...params.map((p) => this.safeToString(p)),
      ];
    }
    if (this.config?.timestamp) {
      logEntry.timestampDiff = this.getTimestampDiff();
    }
    return this.config.prettyPrintJson
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry);
  }

  private format(message: unknown): Record<string, unknown> {
    if (message instanceof Error) {
      return this.formatError(message);
    }
    if (typeof message === 'object' && message !== null) {
      return this.redactSensitiveData(message as Record<string, unknown>);
    }
    return { message: this.safeToString(message) };
  }

  private safeToString(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return (value as string | number | boolean | symbol | bigint).toString();
  }

  private formatError(error: Error): Record<string, unknown> {
    const formattedError: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n'),
    };
    if ('cause' in error) {
      formattedError.cause = (error as { cause?: unknown }).cause;
    }
    return { error: formattedError };
  }

  private redactSensitiveData<T extends Record<string, unknown>>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      const processedArray = obj.map((item: unknown) => {
        if (item !== null && typeof item === 'object') {
          return this.redactSensitiveData(item as Record<string, unknown>);
        }
        return item;
      });
      return processedArray as unknown as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const shouldRedact = Array.from(this.redactKeys).some(
        (k) => key.toLowerCase() === k.toLowerCase(),
      );
      if (shouldRedact) {
        result[key] = '[REDACTED]';
      } else if (value !== null && typeof value === 'object') {
        result[key] = this.redactSensitiveData(
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  private ctxWithParams(params: unknown[]): string {
    const ctx = [this.context, ...this.ctxParams, ...params];
    return clc.yellow(
      ctx
        .filter((item): item is string | number | boolean => {
          const type = typeof item;
          return type === 'string' || type === 'number' || type === 'boolean';
        })
        .map((ctxItem) => `[${this.safeToString(ctxItem)}]`)
        .join(''),
    );
  }

  private getTimestampDiff(): number {
    const now = Date.now();
    const diff = this.timestamp > 0 ? now - this.timestamp : 0;
    this.timestamp = now;
    return diff;
  }

  private wrapParams(params: unknown[]): string {
    const newParams = [...params];
    if (this.config?.timestamp) {
      newParams.push(`+${this.getTimestampDiff()}ms`);
    }
    return this.ctxWithParams(newParams);
  }

  private wrapMessage(
    message: unknown,
    params: unknown[] = [],
    colorFn: (text: string) => string = (text) => text,
  ): [string, string] {
    if (typeof message === 'string') {
      const coloredMessage = colorFn(message);
      return [
        this.ctxWithParams(params),
        this.config?.timestamp
          ? coloredMessage + clc.yellow(` +${this.getTimestampDiff()}ms`)
          : coloredMessage,
      ];
    }
    const prettyOptions: util.InspectOptions = {
      depth: null,
      colors: true,
      compact: false,
      breakLength: 80,
      sorted: false,
      showHidden: false,
      getters: false,
    };
    return [
      this.wrapParams(params),
      this.config.prettyPrintJson
        ? util.inspect(message, prettyOptions)
        : util.inspect(message, false, null, true),
    ];
  }
}
