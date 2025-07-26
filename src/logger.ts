import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import * as process from 'process';
import * as util from 'node:util';
import { clc, LoggerLevelFormats, LoggerOptions } from './interfaces';

const levelFormats: LoggerLevelFormats = {
  LOG: {
    levelColor: clc.greenBright,
    messageColor: undefined,
  },
  ERROR: {
    levelColor: clc.redBright,
    messageColor: clc.redBright,
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

const defaultOptions: LoggerOptions = {
  id: process.env.SERVICE_NAME || 'Nats',
  debug: false,
  jsonFormat: false,
  prettyPrintJson: false,
  levelFormats,
  redactKeys: new Set(['password', 'token', 'authorization']),
};

@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends ConsoleLogger {
  protected options: LoggerOptions;
  private timestamp: number;
  private ctxParams: string[] = [];
  private additionalFields: Record<string, unknown> = {};

  constructor(
    context?: string,
    options: LoggerOptions = {},
    @Inject(INQUIRER) private readonly parentClass?: object,
  ) {
    super(context || parentClass?.constructor?.name, options);
    this.options = { ...defaultOptions, ...options };
  }

  private prefix(): string {
    return (
      clc.green(`[${this.options.id}]`) +
      clc.gray(` ${new Date().toISOString()}`)
    );
  }

  setContext(context: string): this {
    super.setContext(context);
    return this;
  }

  setOptions(options: LoggerOptions): this {
    this.options = { ...this.options, ...options };
    return this;
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
    this.options.jsonFormat = true;
    return this;
  }

  disableJsonFormat(): this {
    this.options.jsonFormat = false;
    return this;
  }

  enablePrettyPrint(): this {
    this.options.prettyPrintJson = true;
    return this;
  }

  disablePrettyPrint(): this {
    this.options.prettyPrintJson = false;
    return this;
  }

  addField(key: string, value: unknown): this {
    this.additionalFields[key] = value;
    return this;
  }

  removeField(key: string): this {
    delete this.additionalFields[key];
    return this;
  }

  addRedactKey(key: string): this {
    this.options?.redactKeys?.add(key);
    return this;
  }

  removeRedactKey(key: string): this {
    this.options?.redactKeys?.delete(key);
    return this;
  }

  /* Core logging methods */
  log(message: any, ...optionalParams: any[]) {
    this.logMessage('LOG', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.logMessage('ERROR', message, optionalParams, console.error);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logMessage('WARN', message, optionalParams, console.warn);
  }

  info(message: any, ...optionalParams: any[]): void {
    this.logMessage('INFO', message, optionalParams, console.info);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (!this.options.debug) return;
    this.logMessage('DEBUG', message, optionalParams, console.debug);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logMessage('VERBOSE', message, optionalParams);
  }

  /* Private helper methods */
  private logMessage(
    level: keyof typeof this.options.levelFormats,
    message: any,
    params: any[] = [],
    consoleMethod: (...args: any[]) => void = console.log,
  ): void {
    const processedParams = params.map((param) => {
      if (typeof param === 'object' && param !== null) {
        return this.redactSensitiveData(param);
      }
      return param;
    });
    if (this.options.jsonFormat) {
      return consoleMethod(this.formatToJson(level, message, processedParams));
    }
    const { levelColor, messageColor } = this.options.levelFormats[level];
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
    message: any,
    params: any[] = [],
  ): string {
    const logEntry: Record<string, unknown> = {
      ...this.additionalFields,
      timestamp: new Date().toISOString(),
      service: process?.env?.SERVICE_NAME || 'Nest',
      level,
      context: this.context,
      data: this.format(message),
    };
    if (this.ctxParams.length > 0 || params.length > 0) {
      logEntry.tags = [...this.ctxParams, ...params];
    }
    if (this.options?.timestamp) {
      logEntry.timestampDiff = this.getTimestampDiff();
    }
    return this.options.prettyPrintJson
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry);
  }

  private format(message: any): Record<string, unknown> {
    if (message instanceof Error) {
      return this.formatError(message);
    }
    if (typeof message === 'object' && message !== null) {
      return this.redactSensitiveData(message);
    }
    return { message: String(message) };
  }

  private formatError(error: Error): Record<string, unknown> {
    return {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n'),
        ...((error as any).cause ? { cause: (error as any).cause } : {}),
      },
    };
  }

  private redactSensitiveData(obj: any): any {
    if (obj == null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveData(item));
    }
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const shouldRedact = Array.from(this.options.redactKeys).some(
        (redactKey) => key.toLowerCase() === redactKey.toLowerCase(),
      );
      result[key] = shouldRedact
        ? '[REDACTED]'
        : this.redactSensitiveData(value);
    }
    return result;
  }

  private ctxWithParams(params: any[]): string {
    const ctx = [this.context, ...this.ctxParams, ...params];
    return clc.yellow(
      ctx
        .filter(Boolean)
        .map((ctx) => `[${ctx}]`)
        .join(''),
    );
  }

  private getTimestampDiff(): number {
    const now = Date.now();
    const diff = this.timestamp > 0 ? now - this.timestamp : 0;
    this.timestamp = now;
    return diff;
  }

  private wrapParams(params: any[]): string {
    if (this.options?.timestamp) {
      params.push(`+${this.getTimestampDiff()}ms`);
    }
    return this.ctxWithParams(params);
  }

  private wrapMessage(
    message: any,
    params: any[] = [],
    colorFn: (text: string) => string = (text) => text,
  ): string[] {
    if (typeof message === 'string') {
      const coloredMessage = colorFn(message);
      return [
        this.ctxWithParams(params),
        this.options?.timestamp
          ? coloredMessage + clc.yellow(` +${this.getTimestampDiff()}ms`)
          : coloredMessage,
      ];
    }
    const prettyOptions = {
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
      this.options.prettyPrintJson
        ? util.inspect(message, prettyOptions)
        : util.inspect(message, false, null, true),
    ];
  }
}
