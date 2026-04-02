// lib/logger.js
// Structured logging with Winston — server-side only

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = format;

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'visa-intelligence' },
  transports: [
    new transports.Console({
      format: isProd
        ? combine(timestamp(), json())
        : combine(colorize(), simple()),
    }),
  ],
});

export default logger;
