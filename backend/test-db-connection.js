#!/usr/bin/env node

/**
 * Simple database connection test script
 * Run with: node test-db-connection.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function testConnection() {
  console.log('\n=== Database Connection Test ===\n');

  // Log environment configuration
  console.log('Environment Configuration:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  DB_HOST:', process.env.DB_HOST || 'not set');
  console.log('  DB_PORT:', process.env.DB_PORT || 'not set');
  console.log('  DB_NAME:', process.env.DB_NAME || 'not set');
  console.log('  DB_USER:', process.env.DB_USER || 'not set');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***set***' : 'not set');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '***set***' : 'not set');
  console.log('\n');

  // Try to connect using environment variables
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'roi_systems';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';

  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: parseInt(dbPort),
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    console.log(`Attempting to connect to PostgreSQL at ${dbHost}:${dbPort}...`);
    await sequelize.authenticate();
    console.log('\n✅ Database connection successful!\n');

    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('PostgreSQL Version:', results[0].version);

    // Check if database exists
    const [databases] = await sequelize.query(
      `SELECT datname FROM pg_database WHERE datname = '${dbName}'`
    );

    if (databases.length > 0) {
      console.log(`✅ Database '${dbName}' exists`);
    } else {
      console.log(`⚠️  Database '${dbName}' does not exist`);
      console.log('\nTo create the database, run:');
      console.log(`  psql -U ${dbUser} -c "CREATE DATABASE ${dbName};"`);
    }

    // List tables
    const [tables] = await sequelize.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tables.length > 0) {
      console.log('\nExisting tables:');
      tables.forEach(table => console.log(`  - ${table.tablename}`));
    } else {
      console.log('\n⚠️  No tables found in the database');
      console.log('Run migrations to create tables:');
      console.log('  npm run db:migrate');
    }

  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Ensure PostgreSQL is running:');
      console.error('   - macOS: brew services start postgresql');
      console.error('   - Linux: sudo systemctl start postgresql');
      console.error('2. Check PostgreSQL status:');
      console.error('   - pg_isready');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Check your database credentials in .env file');
      console.error('2. Ensure the user exists in PostgreSQL');
      console.error('3. Update password if needed:');
      console.error(`   psql -U postgres -c "ALTER USER ${dbUser} WITH PASSWORD 'new_password';"`);
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Create the database:');
      console.error(`   psql -U postgres -c "CREATE DATABASE ${dbName};"`);
      console.error('2. Or run: npm run db:create');
    }

    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testConnection().catch(console.error);