import { createLogger } from '../utils/logger';

const logger = createLogger('env-validation');

interface RequiredEnvVars {
  // Server Configuration
  PORT: string;
  NODE_ENV: string;
  API_VERSION: string;

  // Database Configuration
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;

  // Security
  JWT_SECRET: string;
  JWT_EXPIRES_IN?: string;

  // CORS Configuration
  CORS_ORIGINS: string;

  // Optional Services
  REDIS_URL?: string;
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  S3_BUCKET_NAME?: string;
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM_EMAIL?: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;

  // Logging
  LOG_LEVEL?: string;
}

/**
 * Validates required environment variables on application startup
 * Throws descriptive errors if critical variables are missing
 */
export function validateEnv(): void {
  logger.info('Starting environment variable validation...');

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical server configuration
  if (!process.env.PORT) {
    process.env.PORT = '3000';
    warnings.push('PORT not set, defaulting to 3000');
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  if (!process.env.API_VERSION) {
    process.env.API_VERSION = 'v1';
    warnings.push('API_VERSION not set, defaulting to v1');
  }

  // Check database configuration
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasDbConfig = !!(
    process.env.DB_HOST &&
    process.env.DB_PORT &&
    process.env.DB_NAME &&
    process.env.DB_USER
  );

  if (!hasDbUrl && !hasDbConfig) {
    errors.push(
      'Database configuration missing: Either provide DATABASE_URL or individual DB_* variables (DB_HOST, DB_PORT, DB_NAME, DB_USER)'
    );
  }

  // Validate database connection string format if provided
  if (hasDbUrl && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      if (!['postgres:', 'postgresql:', 'mysql:', 'mysql2:'].includes(url.protocol)) {
        errors.push(`Invalid DATABASE_URL protocol: ${url.protocol}. Must be postgres:, postgresql:, mysql:, or mysql2:`);
      }
    } catch (error) {
      errors.push(`Invalid DATABASE_URL format: ${process.env.DATABASE_URL}`);
    }
  }

  // Check security configuration
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required for authentication');
  } else if (process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for security');
  }

  if (!process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '24h';
    warnings.push('JWT_EXPIRES_IN not set, defaulting to 24h');
  }

  // Check CORS configuration
  if (!process.env.CORS_ORIGINS) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('CORS_ORIGINS is required in production');
    } else {
      process.env.CORS_ORIGINS = 'http://localhost:5051,http://localhost:3000';
      warnings.push('CORS_ORIGINS not set, defaulting to localhost origins');
    }
  }

  // Check optional but recommended services
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.REDIS_URL) {
      warnings.push('REDIS_URL not set - Redis caching disabled (recommended for production)');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      warnings.push('AWS credentials not set - S3 file storage disabled (recommended for production)');
    }

    if (!process.env.SENDGRID_API_KEY) {
      warnings.push('SENDGRID_API_KEY not set - Email notifications disabled (recommended for production)');
    }
  }

  // Set default rate limiting values if not provided
  if (!process.env.RATE_LIMIT_WINDOW_MS) {
    process.env.RATE_LIMIT_WINDOW_MS = '900000'; // 15 minutes
    warnings.push('RATE_LIMIT_WINDOW_MS not set, defaulting to 15 minutes');
  }

  if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
    process.env.RATE_LIMIT_MAX_REQUESTS = '100';
    warnings.push('RATE_LIMIT_MAX_REQUESTS not set, defaulting to 100');
  }

  // Set default log level
  if (!process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment validation warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }

  // Throw error if critical variables are missing
  if (errors.length > 0) {
    logger.error('Environment validation failed! Missing or invalid required variables:');
    errors.forEach(error => logger.error(`  - ${error}`));

    throw new Error(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set correctly.\n' +
      'Refer to .env.example for the complete list of required variables.'
    );
  }

  // Log successful validation
  logger.info('Environment validation completed successfully');
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Database: ${hasDbUrl ? 'DATABASE_URL' : 'DB_* configuration'}`);
  logger.info(`API Version: ${process.env.API_VERSION}`);
  logger.info(`CORS Origins: ${process.env.CORS_ORIGINS}`);

  // Log optional services status
  const services = {
    'Redis Cache': !!process.env.REDIS_URL,
    'AWS S3': !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    'SendGrid Email': !!process.env.SENDGRID_API_KEY,
  };

  logger.info('Optional services status:');
  Object.entries(services).forEach(([service, enabled]) => {
    logger.info(`  - ${service}: ${enabled ? 'Enabled' : 'Disabled'}`);
  });
}

/**
 * Get validated environment variables with proper typing
 */
export function getEnv(): RequiredEnvVars {
  return {
    // Server Configuration
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV!,
    API_VERSION: process.env.API_VERSION!,

    // Database Configuration
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,

    // Security
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

    // CORS Configuration
    CORS_ORIGINS: process.env.CORS_ORIGINS!,

    // Optional Services
    REDIS_URL: process.env.REDIS_URL,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL,
  };
}