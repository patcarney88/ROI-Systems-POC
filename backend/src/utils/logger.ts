import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, context }) => {
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} ${level} ${contextStr}: ${stack || message}`;
});

// Create logger instance
export const createLogger = (context?: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    defaultMeta: { context },
    transports: [
      // Console transport with colors for development
      new winston.transports.Console({
        format: combine(
          colorize(),
          logFormat
        )
      }),
      // File transport for errors
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // File transport for all logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ]
  });
};

export default createLogger();
