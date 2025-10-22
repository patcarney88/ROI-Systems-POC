import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { validateEnv } from './config/validate-env';
import { Server } from 'http';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('server');

// Validate environment variables before proceeding
try {
  validateEnv();
} catch (error) {
  logger.error('Environment validation failed:', error);
  process.exit(1);
}

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Server instance for graceful shutdown
let server: Server;

// SECURITY: Enhanced Helmet configuration for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// SECURITY: Enhanced CORS configuration with strict origin validation
// OWASP Reference: A05:2021 - Security Misconfiguration
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5051', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Origin not allowed', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Removed PATCH and OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 600, // Cache preflight for 10 minutes
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// SECURITY: Import and apply rate limiters
import { globalLimiter } from './middleware/rateLimiter';

// Apply global rate limiting to all API routes
app.use('/api/', globalLimiter);

// Import health routes
import healthRoutes from './routes/health.routes';

// Mount health check routes
app.use('/health', healthRoutes);

// API version endpoint
app.get(`/api/${API_VERSION}`, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'ROI Systems API',
      version: API_VERSION,
      description: 'Real Estate Document Management Platform',
      endpoints: {
        health: '/health',
        auth: `/api/${API_VERSION}/auth`,
        documents: `/api/${API_VERSION}/documents`,
        clients: `/api/${API_VERSION}/clients`,
        campaigns: `/api/${API_VERSION}/campaigns`,
        alerts: `/api/${API_VERSION}/alerts`
      }
    }
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import clientRoutes from './routes/client.routes';
import campaignRoutes from './routes/campaign.routes';

// Import error handler
import { errorHandler } from './middleware/error.middleware';

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/documents`, documentRoutes);
app.use(`/api/${API_VERSION}/clients`, clientRoutes);
app.use(`/api/${API_VERSION}/campaigns`, campaignRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.path
    }
  });
});

// Global error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database with retry logic
    logger.info('Initializing database connection...');
    const { connectDB } = await import('./config/db-connection');
    await connectDB(5, 5000);
    logger.info('Database connection established successfully');

    // Initialize models AFTER database connection
    logger.info('Initializing database models...');
    const { initializeModels, initializeAssociations } = await import('./models');
    initializeModels();
    logger.info('Database models initialized successfully');

    // Initialize model associations
    logger.info('Setting up model associations...');
    initializeAssociations();
    logger.info('Model associations configured successfully');

    // Sync database models if in development
    if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
      logger.info('Syncing database models...');
      const { default: sequelize } = await import('./config/sequelize');
      await sequelize.sync({ alter: false });
      logger.info('Database models synced successfully');
    }

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info('============================================');
      logger.info('🚀 ROI Systems API Server started');
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 Server listening on port ${PORT}`);
      logger.info(`📡 API endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Detailed health: http://localhost:${PORT}/health/detailed`);
      logger.info('============================================');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: starting graceful shutdown`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection
        const { disconnectDB } = await import('./config/db-connection');
        await disconnectDB();
        logger.info('Database connection closed');

        // Close any other connections (Redis, etc.)
        // Add additional cleanup here if needed

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  // Ignore Redis connection errors since Redis is optional
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  if (errorMessage.includes('ECONNREFUSED') && errorMessage.includes('6379')) {
    logger.warn('Redis connection failed (optional service, continuing without Redis)', { reason: errorMessage });
    return;
  }

  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

export default app;
