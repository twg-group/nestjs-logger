# Logger Module for NestJS

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Global Usage](#global-usage)
  - [Builder Pattern Configuration](#builder-pattern-configuration)
  - [Usage in Services](#usage-in-services)
- [Usage Examples](#usage-examples)
  - [Basic Logging](#basic-logging)
  - [Different Log Levels](#different-log-levels)
  - [Error Handling](#error-handling)
- [Configuration](#configuration)
  - [Logger Options](#logger-options)
  - [Global Configuration](#global-configuration)
- [Output Examples](#output-examples)
  - [Text Format (Default)](#text-format-default)
  - [JSON Format (Production - Compact)](#json-format-production---compact)
  - [JSON Format (Development - Pretty Printed)](#json-format-development---pretty-printed)
  - [Error Logging](#error-logging)
- [Timestamp Feature](#timestamp-feature)
- [Usage in Different Parts of Application](#usage-in-different-parts-of-application)
  - [In Controllers](#in-controllers)
  - [In Guards and Interceptors](#in-guards-and-interceptors)
  - [Creating Separate Instances](#creating-separate-instances)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)
- [License](#license)

Extended logger for NestJS with additional features:
- Colored console formatting
- JSON logging format
- Sensitive data redaction
- Additional fields and context
- Flexible logging levels

## Installation

```bash
npm install @twg-group/nestjs-logger
```

## Quick Start

### Global Usage

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@twg-group/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      loggerOptions: {
        id: 'MyService',
        jsonFormat: false,
        prettyPrintJson: false,
        redactKeys: ['password', 'token', 'secret'],
        logLevels: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal', 'info']
      }
    }),
    // other modules
  ],
})
export class AppModule {}
```

### Builder Pattern Configuration

```typescript
// Advanced configuration using method chaining
const logger = new Logger('UserService')
  .setLogLevels(['log', 'error', 'warn', 'fatal', 'info'])
  .setRedactKeys(['password', 'token', 'apiKey'])
  .addField('version', '1.0.0')
  .addField('environment', process.env.NODE_ENV)
  .setCtxParams(['service:users']);

// Configure based on environment
if (process.env.NODE_ENV === 'production') {
  // Production: Enable JSON format, disable pretty printing for performance
  logger.enableJsonFormat().disablePrettyPrint();
}

logger.info('Logger configured successfully');
```

### Usage in Services

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { Logger } from '@twg-group/nestjs-logger';

@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {
    // Context is automatically set to 'UserService'
  }

  async createUser(userData: any) {
    this.logger.log('Creating user', `email:${userData.email}`);
    
    try {
      // user creation logic
      const user = await this.createUserInDatabase(userData);
      this.logger.info('User created successfully', `userId:${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error);
      throw error;
    }
  }
}
```

## Usage Examples

### Basic Logging

```typescript
// Simple message
logger.log('User logged in');

// Message with parameters as strings
logger.log('Processing request', 'userId:123', 'requestId:abc');

// Object logging (pass as message, not parameter)
logger.log({ user: { id: 1, name: 'John' }, action: 'login' });
```

### Different Log Levels

```typescript
logger.log('Regular message');
logger.info('Informational message');
logger.warn('Warning');
logger.error('Error');
logger.debug('Debug information');
logger.verbose('Verbose information');
logger.fatal('Critical error');
```

### Error Handling

```typescript
try {
  throw new Error('Something went wrong');
} catch (error) {
  logger.error('Operation failed', error);
}

// With custom errors
const customError = new Error('Custom error');
(customError as any).cause = new Error('Root cause');
logger.error('Database connection failed', customError);
```

## Configuration

### Logger Options

```typescript
const loggerOptions = {
  id: 'MyService',           // Service identifier (defaults to process.env.SERVICE_NAME or 'Nest')
  jsonFormat: false,         // Log format: JSON or text (default: false)
  prettyPrintJson: false,    // Pretty JSON formatting (default: false)
  redactKeys: ['password', 'token', 'secret'], // Keys to redact
  logLevels: ['log', 'error', 'warn', 'debug', 'verbose', 'fatal', 'info'] // Active levels
};
```

### Global Configuration

```typescript
// main.ts or app.module.ts
LoggerModule.forRoot({
  loggerOptions: {
    id: process.env.SERVICE_NAME || 'MyApp',
    jsonFormat: process.env.NODE_ENV === 'production',
    redactKeys: ['password', 'token', 'apiKey', 'secret'],
    logLevels: ['log', 'error', 'warn', 'fatal', 'info'] // exclude debug and verbose in production
  }
})
```

## Output Examples

### Text Format (Default)

```
[Nest] 2025-07-26T22:20:43.510Z  INFO [ExampleService][test] Message without timestamp
[Nest] 2025-07-26T22:20:43.512Z   LOG [ExampleService] { message: 'message1', test: 123, jest: 1233 }
[Nest] 2025-07-26T22:20:43.513Z DEBUG [ExampleService] Debug message
[Nest] 2025-07-26T22:20:43.513Z  INFO [AppController][Constructor] Message with additional context +0ms
[Nest] 2025-07-26T22:20:43.514Z   LOG [AppController][Constructor][email:test@example.com] Create user request received +1ms
[Nest] 2025-07-26T22:20:43.527Z  INFO [App] Service started on: 3033 port.
[Nest] 2025-07-26T22:20:44.514Z  INFO [AppController][Constructor] Message after 1000ms +1000ms
```

### JSON Format (Production - Compact)

```json
{"timestamp":"2025-07-26T22:20:43.510Z","service":"MyService","level":"INFO","context":"ExampleService","data":{"message":"Message without timestamp"},"tags":["test"]}
```

### JSON Format (Development - Pretty Printed)

```json
{
  "timestamp": "2025-07-26T22:20:43.510Z",
  "service": "MyService",
  "level": "INFO",
  "context": "ExampleService",
  "data": {
    "message": "Message without timestamp"
  },
  "tags": ["test"]
}
```

### Error Logging

```json
{
  "timestamp": "2025-07-26T22:20:43.514Z",
  "service": "MyService",
  "level": "ERROR",
  "context": "UserService",
  "data": {
    "error": {
      "name": "Error",
      "message": "Database connection failed",
      "stack": [
        "Error: Database connection failed",
        "    at UserService.createUser (/src/user.service.ts:15:11)",
        "    at processTicksAndRejections (node:internal/process/task_queues:96:5)"
      ]
    }
  }
}
```

## Timestamp Feature

The logger automatically adds timestamp differences when enabled:

```typescript
// Enable timestamp tracking
logger.resetTimestamp(); // Reset timestamp counter

// First log will show +0ms
logger.info('Service started');

// Subsequent logs show time difference
setTimeout(() => {
  logger.info('Message after delay'); // Shows +1000ms or similar
}, 1000);
```

## Usage in Different Parts of Application

### In Controllers

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly logger: Logger) {
    this.logger.setContext('UserController');
  }

  @Post()
  async createUser(@Body() userData: CreateUserDto) {
    this.logger.log('Create user request received', `email:${userData.email}`);
    return this.userService.createUser(userData);
  }
}
```

### In Guards and Interceptors

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly logger: Logger) {
    this.logger.setContext('AuthGuard');
  }

  canActivate(context: ExecutionContext): boolean {
    this.logger.debug('Checking authentication');
    // authentication logic
    return true;
  }
}
```

### Creating Separate Instances

```typescript
// For specific usage
const customLogger = new Logger('CustomContext', {
  jsonFormat: true,
  prettyPrintJson: false,
  redactKeys: ['sensitive'],
  logLevels: ['error', 'warn']
});

customLogger.error('Custom error message');
```

## Environment Variables

```bash
SERVICE_NAME=MyAwesomeService  # used as logger id by default
```

## Best Practices

1. **Use Context**: Always set meaningful context for the logger
2. **Redact Sensitive Data**: Configure `redactKeys` for security
3. **Proper Levels**: Use appropriate levels for different message types
4. **Structured Data**: Pass objects as message content, not as parameters
5. **Parameters as Strings**: Pass additional context as string parameters (e.g., 'userId:123')
6. **Avoid Object Parameters**: Don't pass objects as parameters - they will display as [object Object]
7. **Builder Pattern**: Use method chaining for complex logger configuration
8. **Production Settings**: Use compact JSON format in production for better performance and logging system compatibility
9. **Development Settings**: Enable pretty printing in development for better readability
10. **Global Configuration**: Configure logger at application level for consistency

## License

MIT
