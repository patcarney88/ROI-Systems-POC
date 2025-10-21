import sequelize, { optimizedConfig, env } from './sequelize';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

// Test connection with retry logic
export const connectDB = async (retries = 5, delay = 5000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info(`Database connection established successfully (${env})`);
      logger.info(`Connection pool: max=${optimizedConfig.pool?.max}, min=${optimizedConfig.pool?.min}`);

      // Log connection pool statistics in development
      if (env === 'development') {
        setInterval(() => {
          const pool = (sequelize.connectionManager as any).pool;
          if (pool) {
            logger.debug(`Pool stats: size=${pool.size}, available=${pool.available}, pending=${pool.pending}`);
          }
        }, 60000); // Every minute
      }
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${i + 1}/${retries} failed:`, error);
      if (i < retries - 1) {
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logger.error('All connection attempts failed');
        throw error;
      }
    }
  }
};

// Graceful shutdown
export const disconnectDB = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

/**
 * Get database connection statistics
 */
export function getDatabaseStats() {
  const pool = (sequelize.connectionManager as any).pool;
  return {
    size: pool?.size || 0,
    available: pool?.available || 0,
    pending: pool?.pending || 0,
    max: optimizedConfig.pool?.max || 0,
    min: optimizedConfig.pool?.min || 0
  };
}