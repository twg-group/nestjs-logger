import { Logger } from './logger';

describe('Logger', () => {
  let logger: Logger;
  const mockConsole = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2023-01-01'));
    global.console = mockConsole as any;
    logger = new Logger('TestContext');
    process.env.SERVICE_NAME = 'test-service';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Core functionality', () => {
    it('should create instance with context', () => {
      expect(logger).toBeInstanceOf(Logger);
      expect(logger['context']).toBe('TestContext');
    });

    it('should inherit context from parent class', () => {
      const parentLogger = new Logger(undefined, undefined, {
        constructor: { name: 'ParentClass' },
      });
      expect(parentLogger['context']).toBe('ParentClass');
    });
  });

  describe('Configuration methods', () => {
    it('should set context', () => {
      logger.setContext('NewContext');
      expect(logger['context']).toBe('NewContext');
    });

    it('should set options', () => {
      logger.setOptions({ debug: true });
      expect(logger['options'].debug).toBe(true);
    });

    it('should manage json format', () => {
      logger.enableJsonFormat();
      expect(logger['options'].jsonFormat).toBe(true);
      logger.disableJsonFormat();
      expect(logger['options'].jsonFormat).toBe(false);
    });

    it('should manage pretty print', () => {
      logger.enablePrettyPrint();
      expect(logger['options'].prettyPrintJson).toBe(true);
      logger.disablePrettyPrint();
      expect(logger['options'].prettyPrintJson).toBe(false);
    });

    it('should manage context params', () => {
      logger.setCtxParams(['param1', 'param2']);
      expect(logger['ctxParams']).toEqual(['param1', 'param2']);
    });

    it('should manage timestamp', () => {
      logger.resetTimestamp();
      expect(logger['timestamp']).toBe(0);
    });

    it('should manage additional fields', () => {
      logger.addField('key', 'value');
      expect(logger['additionalFields'].key).toBe('value');
      logger.removeField('key');
      expect(logger['additionalFields'].key).toBeUndefined();
    });

    it('should manage redact keys', () => {
      logger.addRedactKey('newKey');
      expect(logger['options'].redactKeys?.has('newKey')).toBe(true);
      logger.removeRedactKey('newKey');
      expect(logger['options'].redactKeys?.has('newKey')).toBe(false);
    });
  });

  describe('Logging methods', () => {
    it('should log simple message', () => {
      logger.log('Test');
      expect(mockConsole.log).toHaveBeenCalled();
    });

    it('should log error with stack', () => {
      const error = new Error('Test');
      error.stack = 'stack trace';
      logger.error(error);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should log warning', () => {
      logger.warn('Warning');
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should log info', () => {
      logger.info('Info');
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should log debug only when enabled', () => {
      logger.setOptions({ debug: false });
      logger.debug('Debug');
      expect(mockConsole.debug).not.toHaveBeenCalled();

      logger.setOptions({ debug: true });
      logger.debug('Debug');
      expect(mockConsole.debug).toHaveBeenCalled();
    });

    it('should log verbose', () => {
      logger.verbose('Verbose');
      expect(mockConsole.log).toHaveBeenCalled();
    });
  });

  describe('JSON formatting', () => {
    beforeEach(() => {
      logger.enableJsonFormat();
    });

    it('should format simple message', () => {
      logger.log('Test');
      const output = JSON.parse(mockConsole.log.mock.calls[0][0]);
      expect(output).toEqual({
        timestamp: '2023-01-01T00:00:00.000Z',
        service: 'test-service',
        level: 'LOG',
        context: 'TestContext',
        data: { message: 'Test' },
      });
    });

    it('should pretty print when enabled', () => {
      logger.enablePrettyPrint();
      logger.log('Test');
      const output = mockConsole.log.mock.calls[0][0];
      expect(output.includes('\n')).toBe(true);
    });

    it('should include additional fields', () => {
      logger.addField('version', '1.0.0');
      logger.log('Test');
      const output = JSON.parse(mockConsole.log.mock.calls[0][0]);
      expect(output.version).toBe('1.0.0');
    });

    it('should format error', () => {
      const error = new Error('Test');
      logger.error(error);
      const output = JSON.parse(mockConsole.error.mock.calls[0][0]);
      expect(output.data.error).toEqual({
        name: 'Error',
        message: 'Test',
        stack: expect.any(Array),
      });
    });

    it('should include timestamp diff when timestamp option is enabled', () => {
      logger.setOptions({ timestamp: true });
      logger.log('Test');
      const output = JSON.parse(mockConsole.log.mock.calls[0][0]);
      expect(output.timestampDiff).toBe(0);
    });
  });

  describe('Redaction', () => {
    it('should redact sensitive data at all nesting levels', () => {
      logger.enableJsonFormat();
      logger.addRedactKey('auth'); // Добавляем ключ для редиакта
      const sensitiveData = {
        password: 'secret',
        token: '123',
        nested: {
          auth: 'key',
          other: 'value',
          deep: {
            auth: 'deep-key',
          },
        },
        array: [{ auth: 'array-key' }],
      };
      logger.log(sensitiveData);
      const output = JSON.parse(mockConsole.log.mock.calls[0][0]);
      expect(output.data).toEqual({
        password: '[REDACTED]',
        token: '[REDACTED]',
        nested: {
          auth: '[REDACTED]',
          other: 'value',
          deep: {
            auth: '[REDACTED]',
          },
        },
        array: [{ auth: '[REDACTED]' }],
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle circular references', () => {
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;
      logger.log(circularObj);
      expect(mockConsole.log).toHaveBeenCalled();
    });

    it('should handle null/undefined', () => {
      logger.log(null);
      logger.error(undefined);
      expect(mockConsole.log).toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('should handle empty objects', () => {
      logger.log({});
      expect(mockConsole.log).toHaveBeenCalled();
    });

    it('should handle special types', () => {
      logger.log(BigInt(123));
      logger.log(Symbol('test'));
      expect(mockConsole.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('Full integration', () => {
    it('should work with all features combined with redaction', () => {
      logger
        .setContext('IntTest')
        .enableJsonFormat()
        .enablePrettyPrint()
        .addField('version', '1.0')
        .addRedactKey('secret')
        .setCtxParams(['env:test'])
        .setOptions({ timestamp: true });

      const error = new Error('Integration error');
      const sensitiveData = { public: 'info', secret: 'data' };
      logger.error(error, 'tag1', sensitiveData);

      const output = JSON.parse(mockConsole.error.mock.calls[0][0]);
      expect(output).toMatchObject({
        version: '1.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        service: 'test-service',
        level: 'ERROR',
        context: 'IntTest',
        timestampDiff: 0,
        data: {
          error: {
            name: 'Error',
            message: 'Integration error',
            stack: expect.any(Array),
          },
        },
        tags: ['env:test', 'tag1', { public: 'info', secret: '[REDACTED]' }],
      });
    });
  });
});
