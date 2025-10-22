import { Sequelize, Options } from 'sequelize';
import config from './database.json';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = (config as any)[env];

// Check if we should use environment variable for database URL
const useEnvVariable = dbConfig.use_env_variable;

// Build Sequelize configuration
let sequelize: Sequelize;
let optimizedConfig: Options;

if (useEnvVariable && process.env[useEnvVariable]) {
  // Use DATABASE_URL from environment
  const databaseUrl = process.env[useEnvVariable];
  if (!databaseUrl) {
    throw new Error(`Environment variable ${useEnvVariable} is not defined`);
  }

  optimizedConfig = {
    dialect: dbConfig.dialect || 'postgres',
    pool: {
      max: env === 'production' ? 100 : 20,
      min: env === 'production' ? 10 : 5,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },
    benchmark: true,
    logging: env === 'development' ? (sql: string, timing?: number) => {
      if (timing && timing > 50) {
        logger.warn(`Slow query (${timing}ms): ${sql.substring(0, 200)}...`);
      }
    } : false,
    dialectOptions: {
      ...(dbConfig.dialectOptions || {}),
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 20000,
      application_name: 'roi_systems_api',
    },
    define: dbConfig.define || {}
  };

  sequelize = new Sequelize(databaseUrl, optimizedConfig);
} else {
  // Use individual database configuration from env or config file
  const dbHost = process.env.DB_HOST || dbConfig.host;
  const dbPort = process.env.DB_PORT || dbConfig.port;
  const dbName = process.env.DB_NAME || dbConfig.database;
  const dbUser = process.env.DB_USER || dbConfig.username;
  const dbPassword = process.env.DB_PASSWORD || dbConfig.password;

  optimizedConfig = {
    ...dbConfig,
    host: dbHost,
    port: dbPort,
    database: dbName,
    username: dbUser,
    password: dbPassword,
    pool: {
      max: env === 'production' ? 100 : 20,
      min: env === 'production' ? 10 : 5,
      acquire: 30000,
      idle: 10000,
      evict: 10000
    },
    benchmark: true,
    logging: env === 'development' ? (sql: string, timing?: number) => {
      if (timing && timing > 50) {
        logger.warn(`Slow query (${timing}ms): ${sql.substring(0, 200)}...`);
      }
    } : false,
    dialectOptions: {
      ...(dbConfig.dialectOptions || {}),
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 20000,
      application_name: 'roi_systems_api',
    }
  };

  sequelize = new Sequelize(
    optimizedConfig.database!,
    optimizedConfig.username!,
    optimizedConfig.password,
    optimizedConfig
  );
}

export { sequelize, optimizedConfig, env };
export default sequelize;
