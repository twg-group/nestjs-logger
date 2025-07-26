# NestJS Logger

Enhanced logger for NestJS applications with JSON formatting, redaction and more.

## Installation

```bash
npm install @twg-group/nestjs-logger
```

## Usage

### Basic Usage

```typescript
import { Logger } from '@twg-group/nestjs-logger';

const logger = new Logger('MyContext');
logger.log('Hello world!');
```

### JSON Format

```typescript
const logger = new Logger('MyContext', { jsonFormat: true });
logger.log('Hello world!');
```

### Customization

```typescript
import { Logger, clc } from '@twg-group/nestjs-logger';

const logger = new Logger('MyContext', {
  levelFormats: {
    INFO: {
      levelColor: clc.blue,
      messageColor: clc.whiteBright
    }
  },
  redactKeys: new Set(['secret', 'apiKey'])
});

logger.addField('version', '1.0.0');
logger.info('Application started');
```

## Features

- JSON formatting
- Sensitive data redaction
- Customizable colors
- Additional fields
- Context parameters
- Timestamp diffs
- Pretty printing
