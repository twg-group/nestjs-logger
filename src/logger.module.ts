import { Module, DynamicModule, Provider, Global } from '@nestjs/common';
import { Logger } from './logger';
import { LoggerModuleOptions } from './interfaces';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    const loggerProvider: Provider = {
      provide: Logger,
      useValue: new Logger(options.context, options.loggerOptions),
    };
    return {
      module: LoggerModule,
      providers: [loggerProvider],
      exports: [loggerProvider],
    };
  }
}
