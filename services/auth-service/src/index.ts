/**
 * ROI Systems Authentication Service
 * Enterprise-grade JWT & MFA authentication with Zero Trust architecture
 * 
 * Designed by: Security Specialist + Backend Specialist + Solution Architect
 * Hive Mind Consensus: Maximum security with optimal performance
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase } from './database/connection';
import { initializeRedis } from './cache/redis';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { securityHeaders } from './middleware/security';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { mfaRoutes } from './routes/mfa';
import { sessionRoutes } from './routes/session';
import { logger } from './utils/logger';
import { validateEnvironment } from './utils/validation';

// Load environment variables
dotenv.config();

// Validate required environment variables
validateEnvironment();

const app = express();
const port = process.env.PORT || 3001;

/**
 * Security Middleware Stack
 * Zero Trust implementation with defense in depth
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Security headers
app.use(securityHeaders);

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

/**
 * Health Check Endpoint
 * Required for container orchestration and monitoring
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Metrics Endpoint
 * Prometheus-compatible metrics for monitoring
 */
app.get('/metrics', (req, res) => {
  // TODO: Implement Prometheus metrics
  res.status(200).send('# Auth service metrics\n');
});

/**
 * API Routes
 * RESTful endpoints with comprehensive security
 */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/session', sessionRoutes);

/**
 * 404 Handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

/**
 * Global Error Handler
 * Security-conscious error handling
 */
app.use(errorHandler);

/**
 * Graceful Shutdown Handler
 * Ensures proper cleanup of resources
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

/**
 * Unhandled Promise Rejection Handler
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Uncaught Exception Handler
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Service Initialization
 * Hive Mind Pattern: Coordinated startup sequence
 */
async function initializeService(): Promise<void> {
  try {
    logger.info('🚀 Initializing ROI Systems Authentication Service...');
    
    // Initialize database connection
    await initializeDatabase();
    logger.info('✅ Database connection established');
    
    // Initialize Redis cache
    await initializeRedis();
    logger.info('✅ Redis cache connection established');
    
    // Start HTTP server
    const server = createServer(app);
    
    server.listen(port, () => {
      logger.info(`🔒 Authentication Service running on port ${port}`);
      logger.info(`📊 Health check: http://localhost:${port}/health`);
      logger.info(`📈 Metrics: http://localhost:${port}/metrics`);
      logger.info('🧠 SuperClaude Hive Mind: Authentication Service Online');
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to initialize authentication service:', error);
    process.exit(1);
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  initializeService();
}

export { app, initializeService };