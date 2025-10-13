import { createClient } from 'redis';
import { logger } from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Redis Client Connected'));

    await redisClient.connect();
    logger.info('✅ Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    // Don't throw - allow app to continue without Redis cache
    redisClient = null;
  }
}

export function getRedisClient() {
  return redisClient;
}
