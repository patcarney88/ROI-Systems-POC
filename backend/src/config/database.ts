/**
 * Database Configuration using Prisma ORM
 * PostgreSQL connection with connection pooling
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

// PrismaClient singleton instance
let prisma: PrismaClient;

/**
 * Get Prisma Client instance (singleton pattern)
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    // Connection lifecycle logging
    prisma.$connect()
      .then(() => {
        logger.info('✅ Database connected successfully');
      })
      .catch((error) => {
        logger.error('❌ Database connection failed:', error);
        process.exit(1);
      });
  }

  return prisma;
};

/**
 * Graceful database disconnection
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
};

// Export singleton instance
export const db = getPrismaClient();
