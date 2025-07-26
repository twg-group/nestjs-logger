import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { Logger } from './logger';
import { LoggerModuleOptions } from './interfaces';

export const LOGGER_MODULE_OPTIONS = 'LOGGER_MODULE_OPTIONS';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: LOGGER_MODULE_OPTIONS,
      useValue: options,
    };
    const loggerProvider: Provider = {
      provide: Logger,
      useClass: Logger,
    };
    return {
      module: LoggerModule,
      providers: [optionsProvider, loggerProvider],
      exports: [Logger],
    };
  }
}
