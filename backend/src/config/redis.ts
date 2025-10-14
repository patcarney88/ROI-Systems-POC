/**
 * Redis Configuration
 * Used for Bull Queue, session storage, and caching
 */

import Redis from 'ioredis';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when Redis is in readonly mode
      return true;
    }
    return false;
  },
};

/**
 * Create Redis client instance
 */
export const createRedisClient = (): Redis => {
  const client = new Redis(redisConfig);

  client.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  client.on('ready', () => {
    logger.info('✅ Redis ready to accept commands');
  });

  client.on('error', (error) => {
    logger.error('❌ Redis connection error:', error);
  });

  client.on('close', () => {
    logger.warn('⚠️  Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('🔄 Redis reconnecting...');
  });

  return client;
};

/**
 * Default Redis client for general use
 */
export const redis = createRedisClient();

/**
 * Separate Redis client for Bull Queue subscriber
 * Bull requires a separate connection for blocking operations
 */
export const redisSubscriber = createRedisClient();

/**
 * Test Redis connection
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    logger.info('✅ Redis ping successful');
    return true;
  } catch (error) {
    logger.error('❌ Redis ping failed:', error);
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closeRedisConnections = async (): Promise<void> => {
  try {
    await redis.quit();
    await redisSubscriber.quit();
    logger.info('✅ Redis connections closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing Redis connections:', error);
  }
};

// Test connection on startup
testRedisConnection();
