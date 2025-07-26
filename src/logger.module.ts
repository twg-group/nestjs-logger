import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Logger } from './logger';
import { LoggerOptions } from './interfaces';

@Module({})
export class LoggerModule {
  static forRoot(
    options: LoggerOptions = {},
    isGlobal = true,
    context?: string,
  ): DynamicModule {
    const loggerProvider: Provider = {
      provide: Logger,
      useValue: new Logger(context, options),
    };
    const module: DynamicModule = {
      module: LoggerModule,
      providers: [loggerProvider],
      exports: [loggerProvider],
    };
    if (isGlobal) {
      module.global = true;
    }
    return module;
  }
}
