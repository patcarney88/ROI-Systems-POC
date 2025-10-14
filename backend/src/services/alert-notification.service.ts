/**
 * Alert Notification Service
 * Manages alert notifications across multiple channels
 * Integrates with WebSocket server for real-time updates
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { getWebSocketServer } from '../websocket/alert-websocket';
import { queueEmail } from '../queues/email.queue';
import pushNotificationService from './push-notification.service';

const logger = createLogger('alert-notification');
const db = new PrismaClient();

export interface NotificationChannels {
  websocket?: boolean;
  email?: boolean;
  sms?: boolean;
  inApp?: boolean;
  webhook?: boolean;
  pushNotification?: boolean;
}

export interface AlertNotificationData {
  alertId: string;
  userId: string;
  alertType: string;
  confidence: number;
  priority: string;
  channels?: NotificationChannels;
  metadata?: Record<string, any>;
}

export class AlertNotificationService {
  /**
   * Send notification for new alert
   */
  async notifyNewAlert(data: AlertNotificationData): Promise<void> {
    try {
      const {
        alertId,
        userId,
        alertType,
        confidence,
        priority,
        channels = { websocket: true, email: true, inApp: true },
        metadata = {}
      } = data;

      logger.info(`Sending new alert notification for ${alertId} to user ${userId}`);

      // WebSocket notification (real-time)
      if (channels.websocket !== false) {
        await this.sendWebSocketNotification(alertId);
      }

      // Email notification (for high-priority alerts)
      if (channels.email && (priority === 'CRITICAL' || priority === 'HIGH')) {
        await this.sendEmailNotification(alertId, userId);
      }

      // In-app notification
      if (channels.inApp !== false) {
        await this.createInAppNotification(alertId, userId, alertType, confidence, priority);
      }

      // SMS notification (for critical alerts only)
      if (channels.sms && priority === 'CRITICAL') {
        await this.sendSMSNotification(alertId, userId);
      }

      // Webhook notification (if configured)
      if (channels.webhook) {
        await this.sendWebhookNotification(alertId, userId, metadata);
      }

      // Push notification (for high-priority alerts)
      if (channels.pushNotification !== false && (priority === 'CRITICAL' || priority === 'HIGH')) {
        await this.sendPushNotification(alertId, userId, alertType, confidence, priority);
      }

      logger.info(`Notifications sent for alert ${alertId}`);
    } catch (error: any) {
      logger.error(`Failed to send alert notification for ${data.alertId}:`, error);
      throw error;
    }
  }

  /**
   * Send WebSocket notification
   */
  private async sendWebSocketNotification(alertId: string): Promise<void> {
    try {
      const wsServer = getWebSocketServer();

      if (!wsServer) {
        logger.warn('WebSocket server not initialized');
        return;
      }

      await wsServer.emitNewAlert(alertId);
    } catch (error) {
      logger.error(`Failed to send WebSocket notification for ${alertId}:`, error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alertId: string, userId: string): Promise<void> {
    try {
      // Fetch alert and user details
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
        logger.error(`Alert ${alertId} not found for email notification`);
        return;
      }

      // Get assigned agent (if any)
      const assignment = await db.alertAssignment.findFirst({
        where: { alertScoreId: alertId, status: 'ACTIVE' },
        include: {
          agent: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      const recipientEmail = assignment?.agent.email || alert.user.email;
      const recipientName = assignment?.agent.name || alert.user.name;

      // Format alert type for display
      const alertTypeDisplay = alert.alertType.replace(/_/g, ' ').toLowerCase();

      // Create email content
      const subject = `🎯 ${alert.priority} Priority Alert: ${alertTypeDisplay}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Business Alert</h2>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Alert Type:</strong> ${alertTypeDisplay}</p>
            <p><strong>Confidence:</strong> ${(alert.confidence * 100).toFixed(1)}%</p>
            <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(alert.priority)};">${alert.priority}</span></p>
            <p><strong>User:</strong> ${alert.user.name} (${alert.user.email})</p>
          </div>

          <div style="margin: 20px 0;">
            <p>This alert was generated by our AI system based on recent user activity and signals.</p>
            <p><strong>Number of signals detected:</strong> ${alert.signalCount}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/alerts/${alertId}"
               style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Alert Details
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated notification from the ROI Systems Alert System.
          </p>
        </div>
      `;

      // Queue email for delivery
      await queueEmail({
        to: recipientEmail,
        subject,
        htmlContent,
        utmParams: {
          source: 'alert-system',
          medium: 'email',
          campaign: 'new-alert'
        }
      });

      logger.info(`Email notification queued for alert ${alertId} to ${recipientEmail}`);
    } catch (error) {
      logger.error(`Failed to send email notification for ${alertId}:`, error);
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    alertId: string,
    userId: string,
    alertType: string,
    confidence: number,
    priority: string
  ): Promise<void> {
    try {
      // Note: Assuming InAppNotification model exists or will be created
      // For now, we'll log this as a placeholder

      logger.info(`In-app notification created for alert ${alertId}`);

      // TODO: Implement in-app notification storage
      // await db.inAppNotification.create({
      //   data: {
      //     userId,
      //     type: 'NEW_ALERT',
      //     title: `New ${alertType.replace(/_/g, ' ')} Alert`,
      //     message: `Confidence: ${(confidence * 100).toFixed(1)}%`,
      //     priority,
      //     metadata: { alertId },
      //     read: false
      //   }
      // });
    } catch (error) {
      logger.error(`Failed to create in-app notification for ${alertId}:`, error);
    }
  }

  /**
   * Send SMS notification (placeholder)
   */
  private async sendSMSNotification(alertId: string, userId: string): Promise<void> {
    try {
      // TODO: Implement Twilio SMS integration
      logger.info(`SMS notification would be sent for alert ${alertId} to user ${userId}`);

      // Example Twilio integration:
      // const twilioClient = new Twilio(accountSid, authToken);
      // await twilioClient.messages.create({
      //   to: userPhone,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   body: `Critical alert: New ${alertType} opportunity detected. Login to view details.`
      // });
    } catch (error) {
      logger.error(`Failed to send SMS notification for ${alertId}:`, error);
    }
  }

  /**
   * Send webhook notification (placeholder)
   */
  private async sendWebhookNotification(
    alertId: string,
    userId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // TODO: Implement webhook delivery to CRM systems (Salesforce, HubSpot, etc.)
      logger.info(`Webhook notification would be sent for alert ${alertId} to user ${userId}`);

      // Example webhook integration:
      // const webhookUrl = await getWebhookUrl(userId);
      // if (webhookUrl) {
      //   await axios.post(webhookUrl, {
      //     event: 'alert.created',
      //     alertId,
      //     userId,
      //     ...metadata
      //   });
      // }
    } catch (error) {
      logger.error(`Failed to send webhook notification for ${alertId}:`, error);
    }
  }

  /**
   * Send push notification for alert
   */
  private async sendPushNotification(
    alertId: string,
    userId: string,
    alertType: string,
    confidence: number,
    priority: string
  ): Promise<void> {
    try {
      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for push notification`);
        return;
      }

      // Format alert type for display
      const alertTypeDisplay = alertType.replace(/_/g, ' ').toLowerCase();
      const userName = `${alert.user.firstName} ${alert.user.lastName}`.trim();

      // Create push notification payload
      await pushNotificationService.sendNotification({
        userId,
        type: 'BUSINESS_ALERT',
        priority: priority as any,
        channel: 'business_alerts',
        payload: {
          title: `${priority} Priority Alert`,
          body: `New ${alertTypeDisplay} opportunity for ${userName} (${(confidence * 100).toFixed(0)}% confidence)`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: {
            alertId,
            alertType,
            confidence,
            priority,
            userId: alert.user.id,
            url: `${process.env.FRONTEND_URL}/alerts/${alertId}`
          },
          actions: [
            {
              action: 'view',
              title: 'View Alert',
              icon: '/icons/view.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/icons/dismiss.png'
            }
          ],
          requireInteraction: priority === 'CRITICAL',
          vibrate: priority === 'CRITICAL' ? [200, 100, 200] : [200],
        },
        ttl: 86400, // 24 hours
        tags: ['business-alert', alertType.toLowerCase()],
      });

      logger.info(`Push notification queued for alert ${alertId} to user ${userId}`);
    } catch (error) {
      logger.error(`Failed to send push notification for ${alertId}:`, error);
    }
  }

  /**
   * Notify alert status update
   */
  async notifyAlertUpdate(alertId: string, updates: any): Promise<void> {
    try {
      const wsServer = getWebSocketServer();

      if (wsServer) {
        await wsServer.emitAlertUpdate(alertId, updates);
      }

      logger.info(`Alert update notification sent for ${alertId}`);
    } catch (error) {
      logger.error(`Failed to send alert update notification for ${alertId}:`, error);
    }
  }

  /**
   * Notify alert assignment
   */
  async notifyAlertAssignment(alertId: string, agentId: string): Promise<void> {
    try {
      const wsServer = getWebSocketServer();

      if (wsServer) {
        await wsServer.emitAlertAssigned(alertId, agentId);
      }

      // Send email notification to assigned agent
      await this.sendAssignmentEmail(alertId, agentId);

      logger.info(`Alert assignment notification sent for ${alertId} to agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to send alert assignment notification:`, error);
    }
  }

  /**
   * Send assignment email to agent
   */
  private async sendAssignmentEmail(alertId: string, agentId: string): Promise<void> {
    try {
      const agent = await db.user.findUnique({
        where: { id: agentId },
        select: { email: true, name: true }
      });

      if (!agent) {
        logger.error(`Agent ${agentId} not found for assignment email`);
        return;
      }

      const alert = await db.alertScore.findUnique({
        where: { id: alertId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      if (!alert) {
        logger.error(`Alert ${alertId} not found for assignment email`);
        return;
      }

      const subject = `🎯 New Alert Assigned: ${alert.alertType.replace(/_/g, ' ')}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Alert Assigned to You</h2>

          <p>Hi ${agent.name},</p>

          <p>A new ${alert.priority} priority alert has been assigned to you.</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Alert Type:</strong> ${alert.alertType.replace(/_/g, ' ')}</p>
            <p><strong>Confidence:</strong> ${(alert.confidence * 100).toFixed(1)}%</p>
            <p><strong>Client:</strong> ${alert.user.name}</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/alerts/${alertId}"
               style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Alert & Take Action
            </a>
          </div>
        </div>
      `;

      await queueEmail({
        to: agent.email,
        subject,
        htmlContent,
        utmParams: {
          source: 'alert-system',
          medium: 'email',
          campaign: 'alert-assignment'
        }
      });

      logger.info(`Assignment email queued for agent ${agentId}`);
    } catch (error) {
      logger.error(`Failed to send assignment email:`, error);
    }
  }

  /**
   * Notify alert conversion
   */
  async notifyAlertConversion(alertId: string, outcomeData: any): Promise<void> {
    try {
      const wsServer = getWebSocketServer();

      if (wsServer) {
        await wsServer.emitAlertConverted(alertId, outcomeData);
      }

      logger.info(`Alert conversion notification sent for ${alertId}`);
    } catch (error) {
      logger.error(`Failed to send alert conversion notification:`, error);
    }
  }

  /**
   * Notify statistics update
   */
  async notifyStatsUpdate(organizationId: string, stats: any): Promise<void> {
    try {
      const wsServer = getWebSocketServer();

      if (wsServer) {
        wsServer.emitStatsUpdate(organizationId, stats);
      }

      logger.info(`Stats update notification sent for organization ${organizationId}`);
    } catch (error) {
      logger.error(`Failed to send stats update notification:`, error);
    }
  }

  /**
   * Get priority color for email display
   */
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      CRITICAL: '#f44336',
      HIGH: '#ff9800',
      MEDIUM: '#2196f3',
      LOW: '#9e9e9e'
    };

    return colors[priority] || '#9e9e9e';
  }
}

// Export singleton instance
export const alertNotificationService = new AlertNotificationService();
