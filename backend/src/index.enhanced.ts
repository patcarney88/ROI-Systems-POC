/**
 * Enhanced Server Configuration
 *
 * Features:
 * - Comprehensive authentication with JWT and sessions
 * - Multi-factor authentication (TOTP, SMS, Backup codes)
 * - OAuth integration (Google, Microsoft, Facebook)
 * - CSRF protection
 * - Rate limiting
 * - Audit logging
 * - Redis session management
 * - Graceful shutdown
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { redis } from './services/session.service';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('server');

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5051'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// ============================================================================
// BODY PARSING & COOKIES
// ============================================================================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for CSRF tokens
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

// ============================================================================
// REQUEST LOGGING
// ============================================================================

// Request logging with Morgan
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: (req) => req.path === '/health', // Skip health check logs
}));

// ============================================================================
// PASSPORT INITIALIZATION
// ============================================================================

// Initialize Passport for OAuth
app.use(passport.initialize());

// Configure OAuth strategies
import { configurePassport } from './routes/oauth.routes';
configurePassport();

logger.info('Passport OAuth strategies configured');

// ============================================================================
// RATE LIMITING
// ============================================================================

import { globalRateLimiter } from './middleware/rate-limit.middleware';

// Apply global rate limiting
app.use(globalRateLimiter);

logger.info('Global rate limiting enabled');

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Check Redis connection
    const redisStatus = await redis.ping();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Health check failed',
      },
    });
  }
});

// ============================================================================
// API VERSION ENDPOINT
// ============================================================================

app.get(`/api/${API_VERSION}`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'ROI Systems API',
      version: API_VERSION,
      description: 'Real Estate Document Management Platform with Enhanced Authentication',
      endpoints: {
        health: '/health',
        auth: `/api/${API_VERSION}/auth`,
        mfa: `/api/${API_VERSION}/mfa`,
        oauth: `/api/${API_VERSION}/oauth`,
        documents: `/api/${API_VERSION}/documents`,
        clients: `/api/${API_VERSION}/clients`,
        campaigns: `/api/${API_VERSION}/campaigns`,
        alerts: `/api/${API_VERSION}/alerts`,
      },
      features: [
        'JWT Authentication',
        'Multi-Factor Authentication (TOTP, SMS)',
        'OAuth (Google, Microsoft, Facebook)',
        'CSRF Protection',
        'Rate Limiting',
        'Audit Logging',
        'Session Management',
      ],
    },
  });
});

// ============================================================================
// ROUTES
// ============================================================================

// Import enhanced routes
import authRoutesEnhanced from './routes/auth.routes.enhanced';
import mfaRoutes from './routes/mfa.routes';
import oauthRoutes from './routes/oauth.routes';

// Import existing routes
import documentRoutes from './routes/document.routes';
import clientRoutes from './routes/client.routes';
import campaignRoutes from './routes/campaign.routes';

// Mount enhanced authentication routes
app.use(`/api/${API_VERSION}/auth`, authRoutesEnhanced);
app.use(`/api/${API_VERSION}/mfa`, mfaRoutes);
app.use(`/api/${API_VERSION}/oauth`, oauthRoutes);

// Mount existing routes
app.use(`/api/${API_VERSION}/documents`, documentRoutes);
app.use(`/api/${API_VERSION}/clients`, clientRoutes);
app.use(`/api/${API_VERSION}/campaigns`, campaignRoutes);

logger.info('All routes mounted successfully');

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.path,
    },
  });
});

// Global error handling middleware
import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('🚀 ROI Systems API Server Started');
  logger.info('='.repeat(60));
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Server: http://localhost:${PORT}`);
  logger.info(`📡 API: http://localhost:${PORT}/api/${API_VERSION}`);
  logger.info(`❤️  Health: http://localhost:${PORT}/health`);
  logger.info('='.repeat(60));
  logger.info('🔐 Security Features:');
  logger.info('  ✓ JWT Authentication');
  logger.info('  ✓ Multi-Factor Authentication (TOTP, SMS)');
  logger.info('  ✓ OAuth (Google, Microsoft, Facebook)');
  logger.info('  ✓ CSRF Protection');
  logger.info('  ✓ Rate Limiting (Redis-based)');
  logger.info('  ✓ Audit Logging');
  logger.info('  ✓ Session Management');
  logger.info('='.repeat(60));
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} signal received: starting graceful shutdown`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    // Close Prisma connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$disconnect();
    logger.info('Database connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ============================================================================
// PERIODIC CLEANUP TASKS
// ============================================================================

import cron from 'node-cron';
import { cleanupExpired } from './services/session.service';
import { cleanupRateLimits } from './middleware/rate-limit.middleware';
import { cleanupOldAuditLogs } from './middleware/audit.middleware';

// Run cleanup tasks every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running periodic cleanup tasks');

  try {
    // Clean up expired sessions
    await cleanupExpired();

    // Clean up rate limit keys
    await cleanupRateLimits();

    logger.info('Cleanup tasks completed');
  } catch (error) {
    logger.error('Cleanup task error:', error);
  }
});

// Clean up old audit logs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Running audit log cleanup');

  try {
    const deleted = await cleanupOldAuditLogs(90); // Keep 90 days
    logger.info(`Deleted ${deleted} old audit logs`);
  } catch (error) {
    logger.error('Audit log cleanup error:', error);
  }
});

export default app;
