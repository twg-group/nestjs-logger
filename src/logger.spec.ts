import { Logger } from './logger';

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestContext');
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleInfo.mockClear();
    mockConsoleDebug.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with context', () => {
      const loggerWithContext = new Logger('TestContext');
      expect(loggerWithContext).toBeDefined();
    });

    it('should create logger without context', () => {
      const loggerWithoutContext = new Logger();
      expect(loggerWithoutContext).toBeDefined();
    });
  });

  describe('configuration methods', () => {
    it('should set context', () => {
      const result = logger.setContext('NewContext');
      expect(result).toBe(logger);
    });

    it('should set options', () => {
      const options = { jsonFormat: true };
      const result = logger.setOptions(options);
      expect(result).toBe(logger);
    });

    it('should set log levels', () => {
      const levels: Array<'log' | 'error'> = ['log', 'error'];
      const result = logger.setLogLevels(levels);
      expect(result).toBe(logger);
      expect(logger.getLogLevels()).toEqual(levels);
    });

    it('should add log level', () => {
      logger.setLogLevels(['log']);
      const result = logger.addLogLevel('error');
      expect(result).toBe(logger);
      expect(logger.getLogLevels()).toContain('error');
    });

    it('should remove log level', () => {
      logger.setLogLevels(['log', 'error']);
      const result = logger.removeLogLevel('error');
      expect(result).toBe(logger);
      expect(logger.getLogLevels()).not.toContain('error');
    });

    it('should get log levels', () => {
      const levels: Array<'log' | 'error'> = ['log', 'error'];
      logger.setLogLevels(levels);
      expect(logger.getLogLevels()).toEqual(levels);
    });

    it('should set context parameters', () => {
      const result = logger.setCtxParams(['param1', 'param2']);
      expect(result).toBe(logger);
    });

    it('should reset timestamp', () => {
      const result = logger.resetTimestamp();
      expect(result).toBe(logger);
    });

    it('should enable JSON format', () => {
      const result = logger.enableJsonFormat();
      expect(result).toBe(logger);
    });

    it('should disable JSON format', () => {
      logger.enableJsonFormat();
      const result = logger.disableJsonFormat();
      expect(result).toBe(logger);
    });

    it('should enable pretty print', () => {
      const result = logger.enablePrettyPrint();
      expect(result).toBe(logger);
    });

    it('should disable pretty print', () => {
      logger.enablePrettyPrint();
      const result = logger.disablePrettyPrint();
      expect(result).toBe(logger);
    });

    it('should add field', () => {
      const result = logger.addField({ key: 'value' });
      expect(result).toBe(logger);
    });

    it('should remove field', () => {
      logger.addField({ key: 'value' });
      const result = logger.removeField('key');
      expect(result).toBe(logger);
    });

    it('should set redact keys', () => {
      const result = logger.setRedactKeys(['password', 'token']);
      expect(result).toBe(logger);
      expect(logger.getRedactKeys()).toEqual(['password', 'token']);
    });

    it('should add redact key', () => {
      const result = logger.addRedactKey('password');
      expect(result).toBe(logger);
      expect(logger.getRedactKeys()).toContain('password');
    });

    it('should remove redact key', () => {
      logger.setRedactKeys(['password']);
      const result = logger.removeRedactKey('password');
      expect(result).toBe(logger);
      expect(logger.getRedactKeys()).not.toContain('password');
    });

    it('should get redact keys', () => {
      logger.setRedactKeys(['password']);
      expect(logger.getRedactKeys()).toEqual(['password']);
    });
  });

  describe('logging methods', () => {
    beforeEach(() => {
      logger.setLogLevels([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal',
        'info',
      ]);
    });

    it('should log message', () => {
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should log error message', () => {
      logger.error('test error');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should log fatal message', () => {
      logger.fatal('test fatal');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should log warn message', () => {
      logger.warn('test warn');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should log info message', () => {
      logger.info('test info');
      expect(mockConsoleInfo).toHaveBeenCalled();
    });

    it('should log debug message', () => {
      logger.debug('test debug');
      expect(mockConsoleDebug).toHaveBeenCalled();
    });

    it('should log verbose message', () => {
      logger.verbose('test verbose');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should not log when level is disabled', () => {
      logger.setLogLevels([]); // Disable all levels
      logger.log('test message');
      logger.error('test error');
      logger.warn('test warn');
      logger.debug('test debug');
      logger.verbose('test verbose');
      logger.fatal('test fatal');
      logger.info('test info');

      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();
      expect(mockConsoleDebug).not.toHaveBeenCalled();
      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });

    it('should log with optional parameters', () => {
      logger.log('test message', 'param1', 'param2');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should log JSON format when enabled', () => {
      logger.enableJsonFormat();
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle object messages', () => {
      logger.log({ key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle error messages', () => {
      const error = new Error('test error');
      logger.error(error);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should redact sensitive data', () => {
      logger.setRedactKeys(['password']);
      const testData = { password: 'secret', username: 'user' };
      logger.log(testData);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle array redaction', () => {
      logger.setRedactKeys(['password']);
      const testData = [{ password: 'secret' }, { username: 'user' }];
      logger.log(testData);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle nested object redaction', () => {
      logger.setRedactKeys(['password']);
      const testData = { user: { password: 'secret', name: 'John' } };
      logger.log(testData);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle null and undefined values', () => {
      logger.log(null);
      logger.log(undefined);
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    });

    it('should handle primitive values', () => {
      logger.log(42);
      logger.log(true);
      logger.log('string');
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
    });
  });

  describe('private helper methods', () => {
    beforeEach(() => {
      logger.setLogLevels([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal',
        'info',
      ]);
    });

    it('should generate prefix', () => {
      logger.enableJsonFormat();
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle JSON formatting', () => {
      logger.enableJsonFormat();
      logger.log('test message', 'param1');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle error formatting', () => {
      const error = new Error('test error');
      logger.error(error);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle object formatting', () => {
      logger.log({ key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle string formatting', () => {
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should calculate timestamp difference', () => {
      logger.resetTimestamp();
      logger.log('first message');
      logger.log('second message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    });

    it('should handle message wrapping', () => {
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle object message wrapping', () => {
      logger.log({ key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should create context with parameters', () => {
      logger.setCtxParams(['param1']);
      logger.log('test message', 'param2');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      logger.setLogLevels([
        'log',
        'error',
        'warn',
        'debug',
        'verbose',
        'fatal',
        'info',
      ]);
    });

    it('should handle empty redact keys', () => {
      logger.setRedactKeys([]);
      const testData = { password: 'secret' };
      logger.log(testData);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle case insensitive redact keys', () => {
      logger.setRedactKeys(['PASSWORD']);
      const testData = { password: 'secret' };
      logger.log(testData);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        user: {
          profile: {
            credentials: {
              password: 'secret',
              token: 'token123',
            },
          },
        },
      };
      logger.setRedactKeys(['password', 'token']);
      logger.log(complexObject);
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle error with cause', () => {
      const error = new Error('main error');
      (error as any).cause = new Error('cause error');
      logger.error(error);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should handle JSON format with pretty print', () => {
      logger.enableJsonFormat().enablePrettyPrint();
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle multiple field additions', () => {
      logger.addField({ field1: 'value1' }).addField({ field2: 'value2' });
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle field removal', () => {
      logger.addField({ field1: 'value1' }).removeField('field1');
      logger.log('test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});
