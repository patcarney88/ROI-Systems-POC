/**
 * Database Initialization Script
 * Team Bravo: Database Setup
 */

import sequelize, { connectDB, disconnectDB } from '../config/database';
import { createLogger } from '../utils/logger';
import '../models'; // Import all models

const logger = createLogger('init-database');

async function initDatabase() {
  try {
    logger.info('🚀 Starting database initialization...');

    // Step 1: Connect to database
    logger.info('📡 Connecting to database...');
    await connectDB();
    logger.info('✅ Database connection established');

    // Step 2: Sync models (create tables if they don't exist)
    logger.info('📊 Synchronizing database models...');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('✅ Database models synchronized');

    // Step 3: Verify tables
    logger.info('🔍 Verifying tables...');
    const tables = await sequelize.getQueryInterface().showAllTables();
    logger.info(`✅ Found ${tables.length} tables:`, tables);

    logger.info('🎉 Database initialization complete!');
    
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      logger.info('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default initDatabase;
