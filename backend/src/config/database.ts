import { Sequelize, Options } from 'sequelize';
import config from './database.json';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = (config as any)[env] as Options;

// Optimize connection pool settings
const optimizedConfig: Options = {
  ...dbConfig,
  pool: {
    max: env === 'production' ? 100 : 20,  // Increased from default (10)
    min: env === 'production' ? 10 : 5,    // Increased from default (2)
    acquire: 30000,
    idle: 10000,
    evict: 10000
  },
  benchmark: true,  // Log query execution time
  logging: env === 'development' ? (sql: string, timing?: number) => {
    if (timing && timing > 50) {
      logger.warn(`Slow query (${timing}ms): ${sql.substring(0, 200)}...`);
    }
  } : false,
  dialectOptions: {
    ...(dbConfig.dialectOptions || {}),
    statement_timeout: 10000,                   // 10 second timeout
    idle_in_transaction_session_timeout: 20000, // 20 second idle timeout
    application_name: 'roi_systems_api',
  },
};

let sequelize: Sequelize;

if (optimizedConfig.use_env_variable) {
  const databaseUrl = process.env[optimizedConfig.use_env_variable as string];
  if (!databaseUrl) {
    throw new Error(`Environment variable ${optimizedConfig.use_env_variable} is not defined`);
  }
  sequelize = new Sequelize(databaseUrl, optimizedConfig);
} else {
  sequelize = new Sequelize(
    optimizedConfig.database!,
    optimizedConfig.username!,
    optimizedConfig.password,
    optimizedConfig
  );
}

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

export default sequelize;
