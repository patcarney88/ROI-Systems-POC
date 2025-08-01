/**
 * Database Connection Management
 * Designed by: Database Admin + Security Specialist
 * 
 * Enterprise PostgreSQL connection with security hardening
 */

import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'roi_dev',
  password: process.env.DB_PASSWORD || 'dev_password_123',
  
  // Connection pool settings
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  
  // Security settings
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // TODO: Configure proper SSL in production
  } : false,
  
  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
  
  // Application name for monitoring
  application_name: 'roi-auth-service',
};

/**
 * Initialize database connection pool
 */
export async function initializeDatabase(): Promise<void> {
  try {
    pool = new Pool(poolConfig);
    
    // Test connection
    const client = await pool.connect();
    
    // Set security parameters
    await client.query('SET search_path TO public');
    await client.query('SET statement_timeout = $1', [poolConfig.query_timeout]);
    
    // Get database version for logging
    const result = await client.query('SELECT version()');
    logger.info(`Connected to PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);
    
    client.release();
    
    // Setup connection event handlers
    pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });
    
    pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle database client:', err);
    });
    
    // Setup graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Closing database connection pool...');
      pool.end(() => {
        logger.info('Database connection pool closed');
      });
    });
    
    logger.info('Database connection pool initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize database connection:', error);
    throw error;
  }
}

/**
 * Get database connection from pool
 */
export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query with error handling and logging
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow query detected (${duration}ms):`, {
        query: text.substring(0, 100),
        duration
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text.substring(0, 100),
      params: params ? '[REDACTED]' : undefined,
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute a transaction with proper error handling
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get connection pool statistics
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}