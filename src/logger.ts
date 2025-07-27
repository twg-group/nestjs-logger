import {
  ConsoleLogger,
  ConsoleLoggerOptions,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import * as process from 'process';
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

const defaultOptions: LoggerOptions = {
  id: process.env.SERVICE_NAME || 'Nest',
  jsonFormat: false,
  prettyPrintJson: false,
  levelFormats,
  redactKeys: [],
  logLevels: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal', 'info'],
};

/**
 * Extended NestJS logger with additional features:
 * - Colored console formatting
 * - JSON logging format
 * - Sensitive data redaction
 * - Additional fields and context
 * - Flexible logging levels
 */
@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends ConsoleLogger {
  private config: LoggerOptions;
  private timestamp: number;
  private ctxParams: string[] = [];
  private additionalFields: Record<string, unknown> = {};
  private redactKeys: Set<string> = new Set();
  private logLevels: Set<LogLevel> = new Set();

  /**
   * Creates a logger instance
   * @param context - Logger context (usually service/class name)
   * @param options - Logger configuration options
   * @param parentClass - Parent class for automatic context detection
   * @param moduleOptions - Logger module options
   */
  constructor(
    context?: string,
    options: LoggerOptions = {},
    @Inject(INQUIRER) private readonly parentClass?: object,
    @Inject(LOGGER_MODULE_OPTIONS)
    private readonly moduleOptions?: LoggerModuleOptions,
  ) {
    const currentContext = context || parentClass?.constructor?.name;
    const mergedOptions = {
      ...defaultOptions,
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

  /**
   * Generates log prefix with service ID and timestamp
   * @returns Prefix string for log entry
   */
  private prefix(): string {
    return (
      clc.green(`[${this.config.id}]`) +
      clc.gray(` ${new Date().toISOString()}`)
    );
  }

  /**
   * Sets the logger context
   * @param context - New context
   * @returns Current logger instance for chaining
   */
  setContext(context: string): this {
    super.setContext(context);
    return this;
  }

  /**
   * Sets logger configuration options
   * @param options - New configuration options
   * @returns Current logger instance for chaining
   */
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

  /**
   * Sets active logging levels
   * @param levels - Array of logging levels
   * @returns Current logger instance for chaining
   */
  setLogLevels(levels: LogLevel[]): this {
    this.logLevels = new Set(levels);
    return this;
  }

  /**
   * Adds a logging level to active levels
   * @param level - Logging level to add
   * @returns Current logger instance for chaining
   */
  addLogLevel(level: LogLevel): this {
    this.logLevels.add(level);
    return this;
  }

  /**
   * Removes a logging level from active levels
   * @param level - Logging level to remove
   * @returns Current logger instance for chaining
   */
  removeLogLevel(level: LogLevel): this {
    this.logLevels.delete(level);
    return this;
  }

  /**
   * Returns array of active logging levels
   * @returns Array of active logging levels
   */
  getLogLevels(): LogLevel[] {
    return Array.from(this.logLevels);
  }

  /**
   * Sets context parameters
   * @param context - Array of context parameters
   * @returns Current logger instance for chaining
   */
  setCtxParams(context: string[]): this {
    this.ctxParams = context;
    return this;
  }

  /**
   * Resets timestamp counter
   * @returns Current logger instance for chaining
   */
  resetTimestamp(): this {
    this.timestamp = 0;
    return this;
  }

  /**
   * Enables JSON format logging
   * @returns Current logger instance for chaining
   */
  enableJsonFormat(): this {
    this.config.jsonFormat = true;
    return this;
  }

  /**
   * Disables JSON format logging
   * @returns Current logger instance for chaining
   */
  disableJsonFormat(): this {
    this.config.jsonFormat = false;
    return this;
  }

  /**
   * Enables pretty print for JSON logging
   * @returns Current logger instance for chaining
   */
  enablePrettyPrint(): this {
    this.config.prettyPrintJson = true;
    return this;
  }

  /**
   * Disables pretty print for JSON logging
   * @returns Current logger instance for chaining
   */
  disablePrettyPrint(): this {
    this.config.prettyPrintJson = false;
    return this;
  }

  /**
   * Adds a custom field to all log entries
   * @param key - Field key
   * @param value - Field value
   * @returns Current logger instance for chaining
   */
  addField(key: string, value: unknown): this {
    this.additionalFields[key] = value;
    return this;
  }

  /**
   * Removes a custom field from log entries
   * @param key - Field key to remove
   * @returns Current logger instance for chaining
   */
  removeField(key: string): this {
    delete this.additionalFields[key];
    return this;
  }

  /**
   * Sets keys that should be redacted from log output
   * @param keys - Array of keys to redact
   * @returns Current logger instance for chaining
   */
  setRedactKeys(keys: string[]): this {
    this.redactKeys = new Set(keys);
    return this;
  }

  /**
   * Adds a key to redact from log output
   * @param key - Key to redact
   * @returns Current logger instance for chaining
   */
  addRedactKey(key: string): this {
    this.redactKeys.add(key);
    return this;
  }

  /**
   * Removes a key from redaction list
   * @param key - Key to remove from redaction
   * @returns Current logger instance for chaining
   */
  removeRedactKey(key: string): this {
    this.redactKeys.delete(key);
    return this;
  }

  /**
   * Returns array of redacted keys
   * @returns Array of redacted keys
   */
  getRedactKeys(): string[] {
    return Array.from(this.redactKeys);
  }

  /**
   * Logs a message with LOG level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  log(message: any, ...optionalParams: any[]) {
    this.logLevels.has('log') &&
      this.logMessage('LOG', message, optionalParams);
  }

  /**
   * Logs a message with ERROR level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  error(message: any, ...optionalParams: any[]) {
    this.logLevels.has('error') &&
      this.logMessage('ERROR', message, optionalParams, console.error);
  }

  /**
   * Logs a message with FATAL level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  fatal(message: any, ...optionalParams: any[]) {
    this.logLevels.has('fatal') &&
      this.logMessage('FATAL', message, optionalParams, console.error);
  }

  /**
   * Logs a message with WARN level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  warn(message: any, ...optionalParams: any[]) {
    this.logLevels.has('warn') &&
      this.logMessage('WARN', message, optionalParams, console.warn);
  }

  /**
   * Logs a message with INFO level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  info(message: any, ...optionalParams: any[]): void {
    this.logLevels.has('info') &&
      this.logMessage('INFO', message, optionalParams, console.info);
  }

  /**
   * Logs a message with DEBUG level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  debug(message: any, ...optionalParams: any[]) {
    this.logLevels.has('debug') &&
      this.logMessage('DEBUG', message, optionalParams, console.debug);
  }

  /**
   * Logs a message with VERBOSE level
   * @param message - Message to log
   * @param optionalParams - Optional parameters
   */
  verbose(message: any, ...optionalParams: any[]) {
    this.logLevels.has('verbose') &&
      this.logMessage('VERBOSE', message, optionalParams);
  }

  /**
   * Core method for processing and outputting log messages
   * @param level - Log level
   * @param message - Message to log
   * @param params - Additional parameters
   * @param consoleMethod - Console method to use for output
   */
  private logMessage(
    level: keyof typeof this.config.levelFormats,
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
    if (this.config.jsonFormat) {
      return consoleMethod(this.formatToJson(level, message, processedParams));
    }
    const { levelColor, messageColor } = this.config.levelFormats[level];
    const [prefix, levelText] = this.pre(level, levelColor);
    consoleMethod(
      prefix,
      levelText,
      ...this.wrapMessage(message, processedParams, messageColor),
    );
  }

  /**
   * Creates prefix and level text for console output
   * @param level - Log level
   * @param colorFn - Color function for level text
   * @returns Tuple of [prefix, levelText]
   */
  private pre(
    level: string,
    colorFn: (text: string) => string = clc.gray,
  ): [string, string] {
    return [this.prefix(), colorFn(`${clc.bold(level.padStart(5))}`)];
  }

  /**
   * Formats log entry as JSON string
   * @param level - Log level
   * @param message - Log message
   * @param params - Additional parameters
   * @returns Formatted JSON string
   */
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
    if (this.config?.timestamp) {
      logEntry.timestampDiff = this.getTimestampDiff();
    }
    return this.config.prettyPrintJson
      ? JSON.stringify(logEntry, null, 2)
      : JSON.stringify(logEntry);
  }

  /**
   * Formats message for logging
   * @param message - Message to format
   * @returns Formatted message object
   */
  private format(message: any): Record<string, unknown> {
    if (message instanceof Error) {
      return this.formatError(message);
    }
    if (typeof message === 'object' && message !== null) {
      return this.redactSensitiveData(message);
    }
    return { message: String(message) };
  }

  /**
   * Formats error object for logging
   * @param error - Error to format
   * @returns Formatted error object
   */
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

  /**
   * Redacts sensitive data from objects
   * @param obj - Object to process
   * @returns Object with sensitive data redacted
   */
  private redactSensitiveData(obj: any): any {
    if (obj == null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveData(item));
    }
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const shouldRedact = Array.from(this.config.redactKeys).some(
        (redactKey) => key.toLowerCase() === redactKey.toLowerCase(),
      );
      result[key] = shouldRedact
        ? '[REDACTED]'
        : this.redactSensitiveData(value);
    }
    return result;
  }

  /**
   * Creates context string with parameters
   * @param params - Parameters to include
   * @returns Formatted context string
   */
  private ctxWithParams(params: any[]): string {
    const ctx = [this.context, ...this.ctxParams, ...params];
    return clc.yellow(
      ctx
        .filter(Boolean)
        .map((ctx) => `[${ctx}]`)
        .join(''),
    );
  }

  /**
   * Calculates timestamp difference
   * @returns Time difference in milliseconds
   */
  private getTimestampDiff(): number {
    const now = Date.now();
    const diff = this.timestamp > 0 ? now - this.timestamp : 0;
    this.timestamp = now;
    return diff;
  }

  /**
   * Wraps parameters with context and timestamp
   * @param params - Parameters to wrap
   * @returns Wrapped parameters string
   */
  private wrapParams(params: any[]): string {
    if (this.config?.timestamp) {
      params.push(`+${this.getTimestampDiff()}ms`);
    }
    return this.ctxWithParams(params);
  }

  /**
   * Wraps message with formatting and context
   * @param message - Message to wrap
   * @param params - Additional parameters
   * @param colorFn - Color function for message
   * @returns Array of formatted message parts
   */
  private wrapMessage(
    message: any,
    params: any[] = [],
    colorFn: (text: string) => string = (text) => text,
  ): string[] {
    if (typeof message === 'string') {
      const coloredMessage = colorFn(message);
      return [
        this.ctxWithParams(params),
        this.config?.timestamp
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
      this.config.prettyPrintJson
        ? util.inspect(message, prettyOptions)
        : util.inspect(message, false, null, true),
    ];
  }
}
