// Re-export database connection functions
export { connectDB, disconnectDB, getDatabaseStats } from './db-connection';

// Re-export sequelize instance for backward compatibility
export { default } from './sequelize';
export { sequelize, optimizedConfig, env } from './sequelize';