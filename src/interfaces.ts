import * as colors from '@nestjs/common/utils/cli-colors.util';
import { ConsoleLoggerOptions } from '@nestjs/common';

export const colorsExtended = {
  gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
  redBright: (text: string) => `\x1b[91m${text}\x1b[0m`,
  greenBright: (text: string) => `\x1b[92m${text}\x1b[0m`,
  yellowBright: (text: string) => `\x1b[93m${text}\x1b[0m`,
  blueBright: (text: string) => `\x1b[94m${text}\x1b[0m`,
  magentaBright: (text: string) => `\x1b[95m${text}\x1b[0m`,
  cyanBright: (text: string) => `\x1b[96m${text}\x1b[0m`,
  whiteBright: (text: string) => `\x1b[97m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text: string) => `\x1b[35m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  white: (text: string) => `\x1b[37m${text}\x1b[0m`,
};

export const clc = { ...colors.clc, ...colorsExtended };

export interface LevelFormat {
  levelColor: ((text: string) => string) | undefined;
  messageColor: ((text: string) => string) | undefined;
}

export interface LoggerLevelFormats {
  LOG: LevelFormat;
  ERROR: LevelFormat;
  WARN: LevelFormat;
  INFO: LevelFormat;
  DEBUG: LevelFormat;
  VERBOSE: LevelFormat;
}

export type LoggerOptions = {
  id?: string;
  debug?: boolean;
  jsonFormat?: boolean;
  prettyPrintJson?: boolean;
  levelFormats?: LoggerLevelFormats;
  redactKeys?: Set<string>;
  isGlobal?: boolean;
  context?: string;
} & ConsoleLoggerOptions;

export type LoggerModuleOptions = {
  isGlobal?: boolean;
  context?: string;
  options?: LoggerOptions;
};
