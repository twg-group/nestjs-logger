import { Module, DynamicModule, Provider } from '@nestjs/common';
import { Logger } from './logger';
import { LoggerModuleOptions } from './interfaces';

@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    const loggerProvider: Provider = {
      provide: Logger,
      useValue: new Logger(options.context, options.loggerOptions),
    };
    const module: DynamicModule = {
      module: LoggerModule,
      providers: [loggerProvider],
      exports: [loggerProvider],
    };
    if (options.isGlobal) {
      module.global = true;
    }
    return module;
  }
}
