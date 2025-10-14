import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { createServer } from 'http';
import { initializeWebSocket } from './websocket/alert-websocket';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = createLogger('server');

// Create Express app
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Initialize WebSocket server
const wsServer = initializeWebSocket(httpServer);
logger.info('WebSocket server initialized');

// Initialize Push Notification Scheduler
import pushNotificationScheduler from './services/push-notification-scheduler.service';
pushNotificationScheduler.start();
logger.info('Push notification scheduler initialized');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5051',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

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
        alerts: `/api/${API_VERSION}/alerts`,
        alertRouting: `/api/${API_VERSION}/alerts/routing`,
        notifications: `/api/${API_VERSION}/notifications`,
        integrations: `/api/${API_VERSION}/integrations/softpro`,
        webhooks: '/api/webhooks',
        tracking: '/api/track'
      }
    }
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import clientRoutes from './routes/client.routes';
import campaignRoutes from './routes/campaign.routes';
import webhookRoutes from './routes/webhook.routes';
import alertScoringRoutes from './routes/alert-scoring.routes';
import alertRoutingRoutes from './routes/alert-routing.routes';
import pushNotificationRoutes from './routes/push-notification.routes';
import softproIntegrationRoutes from './routes/softpro-integration.routes';

// Import error handler
import { errorHandler } from './middleware/error.middleware';

// Mount routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/documents`, documentRoutes);
app.use(`/api/${API_VERSION}/clients`, clientRoutes);
app.use(`/api/${API_VERSION}/campaigns`, campaignRoutes);
app.use(`/api/${API_VERSION}/alerts`, alertScoringRoutes);
app.use(`/api/${API_VERSION}/alerts`, alertRoutingRoutes);
app.use(`/api/${API_VERSION}/notifications`, pushNotificationRoutes);
app.use(`/api/${API_VERSION}/integrations/softpro`, softproIntegrationRoutes);

// Webhook routes (no versioning for webhook compatibility)
app.use('/api/webhooks', webhookRoutes);
app.use('/api/track', webhookRoutes);

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

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 ROI Systems API Server started`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Server listening on port ${PORT}`);
  logger.info(`📡 API endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
  logger.info(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  pushNotificationScheduler.stop();
  await wsServer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  pushNotificationScheduler.stop();
  await wsServer.shutdown();
  process.exit(0);
});

export default app;
