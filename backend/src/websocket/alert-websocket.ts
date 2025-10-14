/**
 * Alert WebSocket Server
 * Real-time notification system for AI-powered business alerts
 * Provides instant updates when alerts are created, assigned, or converted
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createLogger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('alert-websocket');
const db = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userRole?: string;
}

interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
}

export class AlertWebSocketServer {
  private io: Server;
  private connectedClients: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Alert WebSocket Server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract token from handshake auth
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.organizationId = decoded.organizationId;
        socket.userRole = decoded.role;

        logger.info(`WebSocket authenticated: User ${decoded.userId}`);
        next();
      } catch (error: any) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);

      // Subscribe to alerts
      socket.on('subscribe:alerts', () => this.handleSubscribeAlerts(socket));

      // Subscribe to statistics
      socket.on('subscribe:stats', () => this.handleSubscribeStats(socket));

      // Unsubscribe
      socket.on('unsubscribe:alerts', () => this.handleUnsubscribeAlerts(socket));
      socket.on('unsubscribe:stats', () => this.handleUnsubscribeStats(socket));

      // Ping/Pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Disconnection
      socket.on('disconnect', () => this.handleDisconnection(socket));
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, organizationId, userRole } = socket;

    logger.info(`WebSocket connected: Socket ${socket.id}, User ${userId}, Role ${userRole}`);

    // Track connected client
    const userSockets = this.connectedClients.get(userId!) || [];
    userSockets.push(socket.id);
    this.connectedClients.set(userId!, userSockets);

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      organizationId,
      timestamp: new Date().toISOString()
    });

    // Auto-subscribe to user's alerts
    this.handleSubscribeAlerts(socket);
  }

  /**
   * Subscribe to alerts
   */
  private handleSubscribeAlerts(socket: AuthenticatedSocket): void {
    const { userId, organizationId, userRole } = socket;

    // Join user-specific room
    socket.join(`alerts:user:${userId}`);

    // Join organization room if admin
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      socket.join(`alerts:organization:${organizationId}`);
    }

    logger.info(`Socket ${socket.id} subscribed to alerts`);

    socket.emit('subscribed:alerts', {
      userId,
      rooms: Array.from(socket.rooms)
    });
  }

  /**
   * Subscribe to statistics
   */
  private handleSubscribeStats(socket: AuthenticatedSocket): void {
    const { organizationId } = socket;

    socket.join(`stats:organization:${organizationId}`);

    logger.info(`Socket ${socket.id} subscribed to stats`);

    socket.emit('subscribed:stats', {
      organizationId
    });
  }

  /**
   * Unsubscribe from alerts
   */
  private handleUnsubscribeAlerts(socket: AuthenticatedSocket): void {
    const { userId, organizationId } = socket;

    socket.leave(`alerts:user:${userId}`);
    socket.leave(`alerts:organization:${organizationId}`);

    logger.info(`Socket ${socket.id} unsubscribed from alerts`);
  }

  /**
   * Unsubscribe from statistics
   */
  private handleUnsubscribeStats(socket: AuthenticatedSocket): void {
    const { organizationId } = socket;

    socket.leave(`stats:organization:${organizationId}`);

    logger.info(`Socket ${socket.id} unsubscribed from stats`);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const { userId } = socket;

    logger.info(`WebSocket disconnected: Socket ${socket.id}, User ${userId}`);

    // Remove from connected clients
    const userSockets = this.connectedClients.get(userId!) || [];
    const updatedSockets = userSockets.filter(id => id !== socket.id);

    if (updatedSockets.length > 0) {
      this.connectedClients.set(userId!, updatedSockets);
    } else {
      this.connectedClients.delete(userId!);
    }
  }

  /**
   * Emit new alert to assigned agent
   */
  async emitNewAlert(alertId: string): Promise<void> {
    try {
      // Fetch alert details
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              organizationId: true
            }
          },
          mlModel: {
            select: {
              version: true,
              accuracy: true
            }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for WebSocket emission`);
        return;
      }

      // Prepare alert payload
      const alertPayload = {
        id: alert.id,
        alertType: alert.alertType,
        confidence: alert.confidence,
        priority: alert.priority,
        status: alert.status,
        scoredAt: alert.scoredAt,
        user: alert.user,
        modelVersion: alert.mlModel.version,
        signalCount: alert.signalCount
      };

      // Emit to user's room
      this.io.to(`alerts:user:${alert.userId}`).emit('alert:new', alertPayload);

      // Emit to organization admins
      this.io.to(`alerts:organization:${alert.user.organizationId}`).emit('alert:new', alertPayload);

      logger.info(`Emitted new alert ${alertId} to user ${alert.userId}`);
    } catch (error) {
      logger.error(`Failed to emit new alert ${alertId}:`, error);
    }
  }

  /**
   * Emit alert status update
   */
  async emitAlertUpdate(alertId: string, updates: any): Promise<void> {
    try {
      // Fetch alert to get userId and organizationId
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        select: {
          userId: true,
          user: {
            select: {
              organizationId: true
            }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for update emission`);
        return;
      }

      const updatePayload = {
        alertId,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Emit to user's room
      this.io.to(`alerts:user:${alert.userId}`).emit('alert:updated', updatePayload);

      // Emit to organization admins
      this.io.to(`alerts:organization:${alert.user.organizationId}`).emit('alert:updated', updatePayload);

      logger.info(`Emitted alert update for ${alertId}`);
    } catch (error) {
      logger.error(`Failed to emit alert update for ${alertId}:`, error);
    }
  }

  /**
   * Emit alert assignment notification
   */
  async emitAlertAssigned(alertId: string, agentId: string): Promise<void> {
    try {
      // Fetch alert details
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for assignment emission`);
        return;
      }

      const assignmentPayload = {
        alertId,
        agentId,
        alertType: alert.alertType,
        confidence: alert.confidence,
        priority: alert.priority,
        user: alert.user,
        assignedAt: new Date().toISOString()
      };

      // Emit to assigned agent
      this.io.to(`alerts:user:${agentId}`).emit('alert:assigned', assignmentPayload);

      logger.info(`Emitted alert assignment ${alertId} to agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to emit alert assignment ${alertId}:`, error);
    }
  }

  /**
   * Emit alert conversion notification
   */
  async emitAlertConverted(alertId: string, outcomeData: any): Promise<void> {
    try {
      // Fetch alert to get organizationId
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        select: {
          userId: true,
          alertType: true,
          confidence: true,
          user: {
            select: {
              organizationId: true,
              name: true
            }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for conversion emission`);
        return;
      }

      const conversionPayload = {
        alertId,
        alertType: alert.alertType,
        confidence: alert.confidence,
        userName: alert.user.name,
        ...outcomeData,
        convertedAt: new Date().toISOString()
      };

      // Emit to organization (for statistics update)
      this.io.to(`stats:organization:${alert.user.organizationId}`).emit('alert:converted', conversionPayload);

      logger.info(`Emitted alert conversion for ${alertId}`);
    } catch (error) {
      logger.error(`Failed to emit alert conversion ${alertId}:`, error);
    }
  }

  /**
   * Emit statistics update
   */
  emitStatsUpdate(organizationId: string, stats: any): void {
    this.io.to(`stats:organization:${organizationId}`).emit('stats:updated', {
      ...stats,
      updatedAt: new Date().toISOString()
    });

    logger.info(`Emitted stats update for organization ${organizationId}`);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected sockets for a user
   */
  getUserSockets(userId: string): string[] {
    return this.connectedClients.get(userId) || [];
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedClients.has(userId);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
    logger.info(`Broadcasted ${event} to all clients`);
  }

  /**
   * Get Socket.io instance
   */
  getIO(): Server {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket server...');

    // Notify all clients
    this.broadcast('server:shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    });

    // Close all connections
    await new Promise<void>((resolve) => {
      this.io.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}

// Export singleton instance (will be initialized in index.ts)
let alertWebSocketServer: AlertWebSocketServer | null = null;

export function initializeWebSocket(httpServer: HttpServer): AlertWebSocketServer {
  if (!alertWebSocketServer) {
    alertWebSocketServer = new AlertWebSocketServer(httpServer);
  }
  return alertWebSocketServer;
}

export function getWebSocketServer(): AlertWebSocketServer | null {
  return alertWebSocketServer;
}
