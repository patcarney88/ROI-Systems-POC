/**
 * Notification Service
 * Handles property intelligence alerts and notifications
 * Integrates with email marketing system for alert delivery
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { queueEmail } from '../queues/email.queue';
import { format } from 'date-fns';

const logger = createLogger('notification-service');
const db = new PrismaClient();

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  valueChangeThreshold: number; // Percentage
  maintenanceReminders: boolean;
  marketUpdates: boolean;
  refinanceOpportunities: boolean;
}

export class NotificationService {
  /**
   * Process and send property alert notifications
   */
  async processAlertNotifications(): Promise<void> {
    try {
      // Get unnotified alerts
      const alerts = await db.propertyAlert.findMany({
        where: {
          status: 'ACTIVE',
          notificationSent: false,
          subscriberId: { not: null }
        },
        include: {
          property: true,
          subscriber: true
        },
        take: 100
      });

      logger.info(`Processing ${alerts.length} alert notifications`);

      for (const alert of alerts) {
        try {
          await this.sendAlertNotification(alert);

          // Mark as notified
          await db.propertyAlert.update({
            where: { id: alert.id },
            data: {
              notificationSent: true,
              notificationDate: new Date()
            }
          });
        } catch (error) {
          logger.error(`Failed to send alert ${alert.id}:`, error);
        }
      }

      logger.info(`Completed alert notification processing`);
    } catch (error: any) {
      logger.error('Failed to process alert notifications:', error);
      throw error;
    }
  }

  /**
   * Send individual alert notification
   */
  private async sendAlertNotification(alert: any): Promise<void> {
    if (!alert.subscriber) return;

    const emailContent = this.generateAlertEmail(alert);

    // Queue email via email marketing system
    await queueEmail({
      queueItemId: `alert-${alert.id}`,
      campaignId: 'property-alerts',
      subscriberId: alert.subscriberId!,
      to: alert.subscriber.email,
      subject: emailContent.subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
      fromName: 'ROI Systems Property Intelligence',
      fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@roisystems.com',
      utmParams: {
        source: 'property-intelligence',
        medium: 'alert',
        campaign: alert.type.toLowerCase(),
        content: alert.severity.toLowerCase()
      },
      organizationId: alert.property.organizationId,
      metadata: {
        alertId: alert.id,
        alertType: alert.type,
        propertyId: alert.propertyId
      }
    }, { priority: alert.severity === 'CRITICAL' ? 1 : 5 });

    logger.info(`Queued alert notification: ${alert.id} to ${alert.subscriber.email}`);
  }

  /**
   * Generate alert email content
   */
  private generateAlertEmail(alert: any): { subject: string; html: string; text: string } {
    const property = alert.property;
    const subscriber = alert.subscriber;

    let subject = '';
    let html = '';
    let text = '';

    switch (alert.type) {
      case 'VALUE_INCREASE':
      case 'VALUE_DECREASE':
        subject = `🏡 Your Property Value Has ${alert.type === 'VALUE_INCREASE' ? 'Increased' : 'Decreased'}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${alert.type === 'VALUE_INCREASE' ? '#28a745' : '#dc3545'};">
              ${alert.title}
            </h2>
            <p>Hi ${subscriber.firstName},</p>
            <p>${alert.message}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Property Details</h3>
              <p><strong>Address:</strong> ${property.address}</p>
              <p><strong>Previous Value:</strong> $${Number(alert.thresholdValue).toLocaleString()}</p>
              <p><strong>Current Value:</strong> $${Number(alert.triggerValue).toLocaleString()}</p>
              <p><strong>Change:</strong> ${alert.changePercent > 0 ? '+' : ''}${alert.changePercent?.toFixed(1)}%</p>
            </div>
            <p>
              <a href="${process.env.FRONTEND_URL}/properties/${property.id}/dashboard"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Full Report
              </a>
            </p>
            <p style="color: #6c757d; font-size: 12px;">
              This is an automated notification from ROI Systems Property Intelligence.
            </p>
          </div>
        `;
        text = `${alert.title}\n\n${alert.message}\n\nProperty: ${property.address}\nPrevious Value: $${Number(alert.thresholdValue).toLocaleString()}\nCurrent Value: $${Number(alert.triggerValue).toLocaleString()}\nChange: ${alert.changePercent?.toFixed(1)}%\n\nView full report: ${process.env.FRONTEND_URL}/properties/${property.id}/dashboard`;
        break;

      case 'REFINANCE_OPPORTUNITY':
        subject = '💰 Refinance Opportunity Could Save You Money';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">${alert.title}</h2>
            <p>Hi ${subscriber.firstName},</p>
            <p>${alert.message}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Potential Savings</h3>
              <p><strong>Monthly Savings:</strong> $${Number(alert.triggerValue).toLocaleString()}</p>
              <p><strong>Lifetime Savings:</strong> $${Number(alert.metadata?.lifetimeSavings || 0).toLocaleString()}</p>
            </div>
            <p>
              <a href="${process.env.FRONTEND_URL}/properties/${property.id}/refinance"
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Refinance Analysis
              </a>
            </p>
          </div>
        `;
        text = `${alert.title}\n\n${alert.message}\n\nView refinance analysis: ${process.env.FRONTEND_URL}/properties/${property.id}/refinance`;
        break;

      case 'MAINTENANCE_DUE':
        subject = '🔧 Home Maintenance Due Soon';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff6b6b;">${alert.title}</h2>
            <p>Hi ${subscriber.firstName},</p>
            <p>${alert.message}</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/properties/${property.id}/maintenance"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Maintenance Schedule
              </a>
            </p>
          </div>
        `;
        text = `${alert.title}\n\n${alert.message}\n\nView maintenance schedule: ${process.env.FRONTEND_URL}/properties/${property.id}/maintenance`;
        break;

      case 'NEIGHBORHOOD_ACTIVITY':
        subject = '🏘️ High Activity in Your Neighborhood';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">${alert.title}</h2>
            <p>Hi ${subscriber.firstName},</p>
            <p>${alert.message}</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/neighborhoods/${property.zipCode}"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Neighborhood Report
              </a>
            </p>
          </div>
        `;
        text = `${alert.title}\n\n${alert.message}\n\nView neighborhood report: ${process.env.FRONTEND_URL}/neighborhoods/${property.zipCode}`;
        break;

      default:
        subject = alert.title;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${alert.title}</h2>
            <p>Hi ${subscriber.firstName},</p>
            <p>${alert.message}</p>
            <p>
              <a href="${process.env.FRONTEND_URL}/properties/${property.id}/dashboard"
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Dashboard
              </a>
            </p>
          </div>
        `;
        text = `${alert.title}\n\n${alert.message}\n\nView dashboard: ${process.env.FRONTEND_URL}/properties/${property.id}/dashboard`;
    }

    return { subject, html, text };
  }

  /**
   * Send weekly property digest
   */
  async sendWeeklyDigest(subscriberId: string): Promise<void> {
    try {
      const subscriber = await db.emailSubscriber.findUnique({
        where: { id: subscriberId },
        include: {
          properties: {
            where: { trackingEnabled: true },
            include: {
              valuations: {
                orderBy: { valuationDate: 'desc' },
                take: 2
              },
              alerts: {
                where: {
                  status: 'ACTIVE',
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  }
                }
              }
            }
          }
        }
      });

      if (!subscriber || subscriber.properties.length === 0) {
        return;
      }

      const digestHtml = this.generateWeeklyDigest(subscriber);

      await queueEmail({
        queueItemId: `digest-${subscriberId}-${Date.now()}`,
        campaignId: 'weekly-digest',
        subscriberId,
        to: subscriber.email,
        subject: `📊 Your Weekly Property Intelligence Digest`,
        htmlContent: digestHtml,
        fromName: 'ROI Systems Property Intelligence',
        fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@roisystems.com',
        utmParams: {
          source: 'property-intelligence',
          medium: 'email',
          campaign: 'weekly-digest'
        },
        organizationId: subscriber.properties[0].organizationId,
        metadata: {
          digestType: 'weekly',
          propertyCount: subscriber.properties.length
        }
      });

      logger.info(`Sent weekly digest to ${subscriber.email}`);
    } catch (error: any) {
      logger.error(`Failed to send weekly digest to ${subscriberId}:`, error);
      throw error;
    }
  }

  /**
   * Generate weekly digest HTML
   */
  private generateWeeklyDigest(subscriber: any): string {
    const properties = subscriber.properties;

    let propertiesHtml = '';

    for (const property of properties) {
      const currentValue = property.valuations[0]
        ? Number(property.valuations[0].estimatedValue)
        : Number(property.currentValue || 0);

      const previousValue = property.valuations[1]
        ? Number(property.valuations[1].estimatedValue)
        : currentValue;

      const valueChange = currentValue - previousValue;
      const valueChangePercent = previousValue > 0 ? (valueChange / previousValue) * 100 : 0;

      propertiesHtml += `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.address}</h3>
          <p><strong>Current Value:</strong> $${currentValue.toLocaleString()}</p>
          ${valueChange !== 0 ? `
            <p style="color: ${valueChange > 0 ? '#28a745' : '#dc3545'};">
              <strong>Weekly Change:</strong> ${valueChange > 0 ? '+' : ''}$${Math.abs(valueChange).toLocaleString()}
              (${valueChangePercent > 0 ? '+' : ''}${valueChangePercent.toFixed(2)}%)
            </p>
          ` : ''}
          ${property.alerts.length > 0 ? `
            <div style="margin-top: 15px;">
              <strong>New Alerts:</strong>
              <ul style="margin: 5px 0;">
                ${property.alerts.map((a: any) => `<li>${a.title}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <p style="margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL}/properties/${property.id}/dashboard"
               style="color: #007bff; text-decoration: none;">
              View Full Report →
            </a>
          </p>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">📊 Your Weekly Property Intelligence Digest</h1>
        <p>Hi ${subscriber.firstName},</p>
        <p>Here's your weekly summary of property updates:</p>
        ${propertiesHtml}
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <h3 style="margin-top: 0;">💡 Tip of the Week</h3>
          <p>Did you know? Regular home maintenance can increase your property value by 1-3% annually.</p>
        </div>
        <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
          You're receiving this email because you have property tracking enabled with ROI Systems.
          <br>
          <a href="${process.env.FRONTEND_URL}/preferences">Manage your notification preferences</a>
        </p>
      </div>
    `;
  }

  /**
   * Get notification preferences for subscriber
   */
  async getNotificationPreferences(subscriberId: string): Promise<NotificationPreferences> {
    const subscriber = await db.emailSubscriber.findUnique({
      where: { id: subscriberId }
    });

    // Default preferences (in production, store in PreferenceCenter table)
    return {
      emailEnabled: true,
      smsEnabled: false,
      valueChangeThreshold: 5, // 5% change triggers notification
      maintenanceReminders: true,
      marketUpdates: true,
      refinanceOpportunities: true
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    subscriberId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    // In production, update PreferenceCenter table
    logger.info(`Updated notification preferences for subscriber ${subscriberId}`);
  }

  /**
   * Send batch weekly digests (called by cron)
   */
  async sendWeeklyDigests(): Promise<void> {
    try {
      const subscribers = await db.emailSubscriber.findMany({
        where: {
          unsubscribed: false,
          properties: {
            some: {
              trackingEnabled: true
            }
          }
        }
      });

      logger.info(`Sending weekly digests to ${subscribers.length} subscribers`);

      for (const subscriber of subscribers) {
        try {
          await this.sendWeeklyDigest(subscriber.id);
        } catch (error) {
          logger.error(`Failed to send digest to ${subscriber.id}:`, error);
        }
      }

      logger.info(`Completed weekly digest distribution`);
    } catch (error: any) {
      logger.error('Failed to send weekly digests:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
