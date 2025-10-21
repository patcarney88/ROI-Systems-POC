import { Router, Request, Response } from 'express';
import sequelize from '../config/sequelize';
import { getDatabaseStats } from '../config/db-connection';
import { createLogger } from '../utils/logger';
import os from 'os';

const logger = createLogger('health');
const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
      pool?: {
        size: number;
        available: number;
        pending: number;
        max: number;
        min: number;
      };
      error?: string;
    };
    redis?: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    cpu: {
      loadAverage: number[];
      cores: number;
    };
  };
}

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.API_VERSION || 'v1',
      services: {
        database: {
          status: 'disconnected'
        },
        memory: {
          used: '0 MB',
          total: '0 MB',
          percentage: 0
        },
        cpu: {
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        }
      }
    };

    // Check database connection
    try {
      const startTime = Date.now();
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;

      health.services.database = {
        status: 'connected',
        responseTime,
        pool: getDatabaseStats()
      };
    } catch (dbError: any) {
      logger.error('Database health check failed:', dbError);
      health.status = 'degraded';
      health.services.database = {
        status: 'error',
        error: dbError.message
      };
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = (usedMemory / totalMemory) * 100;

    health.services.memory = {
      used: `${Math.round(usedMemory / 1024 / 1024)} MB`,
      total: `${Math.round(totalMemory / 1024 / 1024)} MB`,
      percentage: Math.round(memoryPercentage * 100) / 100
    };

    // Determine overall health status
    if (health.services.database.status === 'error') {
      health.status = 'unhealthy';
      res.status(503);
    } else if (health.services.database.status === 'disconnected') {
      health.status = 'degraded';
      res.status(200);
    } else {
      res.status(200);
    }

    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    logger.error('Health check endpoint error:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: error.message
      }
    });
  }
});

/**
 * Detailed health check endpoint with deeper service checks
 * GET /health/detailed
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const checks = {
      database: false,
      redis: false,
      diskSpace: false,
      memory: false,
      externalServices: false
    };

    const details: any = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        API_VERSION: process.env.API_VERSION,
        PORT: process.env.PORT
      },
      system: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
        memory: {
          total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
          free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
          used: `${Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)} MB`,
          percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        }
      },
      process: {
        memory: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          external: `${Math.round(process.memoryUsage().external / 1024 / 1024)} MB`
        },
        versions: process.versions
      },
      services: {}
    };

    // Database check with query test
    try {
      const startTime = Date.now();
      await sequelize.authenticate();

      // Run a simple query to test actual database operations
      const [results] = await sequelize.query('SELECT 1 as test');
      const responseTime = Date.now() - startTime;

      checks.database = true;
      details.services.database = {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        pool: getDatabaseStats(),
        testQuery: results ? 'passed' : 'failed'
      };
    } catch (dbError: any) {
      logger.error('Detailed database health check failed:', dbError);
      details.services.database = {
        status: 'error',
        error: dbError.message,
        errorCode: dbError.code || 'UNKNOWN'
      };
    }

    // Check Redis if configured
    if (process.env.REDIS_URL) {
      try {
        // Add Redis check here if Redis client is available
        details.services.redis = {
          status: 'not_implemented',
          configured: true
        };
      } catch (redisError: any) {
        details.services.redis = {
          status: 'error',
          error: redisError.message
        };
      }
    } else {
      details.services.redis = {
        status: 'not_configured'
      };
    }

    // Check external services (AWS S3, SendGrid, etc.)
    details.services.external = {
      aws: {
        configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        region: process.env.AWS_REGION || 'not_set'
      },
      sendgrid: {
        configured: !!process.env.SENDGRID_API_KEY
      }
    };

    // Calculate overall health score
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const healthScore = Math.round((passedChecks / totalChecks) * 100);

    details.healthScore = {
      score: healthScore,
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'unhealthy',
      checks: {
        total: totalChecks,
        passed: passedChecks,
        failed: totalChecks - passedChecks
      }
    };

    // Set response status based on health
    const statusCode = healthScore >= 50 ? 200 : 503;

    res.status(statusCode).json({
      success: statusCode === 200,
      data: details
    });
  } catch (error: any) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'DETAILED_HEALTH_CHECK_FAILED',
        message: 'Detailed health check failed',
        details: error.message
      }
    });
  }
});

/**
 * Liveness probe for Kubernetes/container orchestration
 * GET /health/live
 */
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - is the process running?
  res.status(200).json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Readiness probe for Kubernetes/container orchestration
 * GET /health/ready
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check if the application is ready to serve requests
    await sequelize.authenticate();

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
});

export default router;