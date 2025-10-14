/**
 * Email Service
 * SendGrid integration for email campaigns
 * Team Delta: Email & Notifications
 */

import sgMail from '@sendgrid/mail';
import { createLogger } from '../utils/logger';

const logger = createLogger('email-service');

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@roi-systems.com';
const FROM_NAME = process.env.FROM_NAME || 'ROI Systems';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info('SendGrid initialized successfully');
} else {
  logger.warn('SendGrid API key not configured - email sending will be simulated');
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a single email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, text, templateId, dynamicTemplateData, attachments } = options;
    
    // Validate required fields
    if (!to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!subject && !templateId) {
      throw new Error('Either subject or templateId is required');
    }
    
    // If no API key, simulate sending
    if (!SENDGRID_API_KEY) {
      logger.info('Simulating email send (no API key configured)', { to, subject });
      return {
        success: true,
        messageId: `simulated-${Date.now()}`
      };
    }
    
    // Prepare email message
    const message: any = {
      to: Array.isArray(to) ? to : [to],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      html,
      text,
      attachments
    };
    
    // Use template if provided
    if (templateId) {
      message.templateId = templateId;
      message.dynamicTemplateData = dynamicTemplateData || {};
    }
    
    // Send email
    const [response] = await sgMail.send(message);
    
    logger.info('Email sent successfully', {
      to,
      subject,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id']
    });
    
    return {
      success: true,
      messageId: response.headers['x-message-id'] as string
    };
  } catch (error: any) {
    logger.error('Failed to send email:', error);
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Send bulk emails (campaign)
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  try {
    // Send emails in batches to avoid rate limits
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const promises = batch.map(recipient =>
        sendEmail({ to: recipient, subject, html, text })
      );
      
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          const error = result.status === 'rejected'
            ? result.reason
            : result.value.error;
          results.errors.push(`${batch[index]}: ${error}`);
        }
      });
      
      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info('Bulk email campaign completed', {
      total: recipients.length,
      sent: results.sent,
      failed: results.failed
    });
    
    return results;
  } catch (error) {
    logger.error('Bulk email campaign failed:', error);
    throw error;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  lastName: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #7c3aed;">Welcome to ROI Systems!</h1>
      <p>Hi ${firstName} ${lastName},</p>
      <p>Thank you for joining ROI Systems. We're excited to help you manage your real estate documents and clients more efficiently.</p>
      <p>Get started by:</p>
      <ul>
        <li>Uploading your first document</li>
        <li>Adding your clients</li>
        <li>Creating your first campaign</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The ROI Systems Team</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: 'Welcome to ROI Systems!',
    html,
    text: `Hi ${firstName} ${lastName}, Welcome to ROI Systems! Thank you for joining us.`
  });
}

/**
 * Send document expiration alert
 */
export async function sendExpirationAlert(
  to: string,
  documentTitle: string,
  expiryDate: Date
): Promise<EmailResult> {
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #f59e0b;">Document Expiration Alert</h1>
      <p>Your document "${documentTitle}" will expire in ${daysUntilExpiry} days.</p>
      <p><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
      <p>Please take action to renew or update this document.</p>
      <p>Best regards,<br>The ROI Systems Team</p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: `Document Expiration Alert: ${documentTitle}`,
    html,
    text: `Your document "${documentTitle}" will expire in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}.`
  });
}

/**
 * Send campaign email
 */
export async function sendCampaignEmail(
  to: string,
  campaignName: string,
  subject: string,
  message: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #7c3aed; color: white; padding: 20px; text-align: center;">
        <h1>${campaignName}</h1>
      </div>
      <div style="padding: 20px;">
        ${message}
      </div>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>You received this email because you are a valued client of ROI Systems.</p>
        <p><a href="#" style="color: #7c3aed;">Unsubscribe</a></p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject,
    html,
    text: message.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
  });
}

/**
 * Track email opens (webhook handler)
 */
export function handleEmailEvent(event: any): void {
  const { email, event: eventType, timestamp } = event;
  
  logger.info('Email event received', {
    email,
    eventType,
    timestamp
  });
  
  // TODO: Update campaign statistics in database
  // This would be called by a webhook endpoint
}

export default {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendExpirationAlert,
  sendCampaignEmail,
  handleEmailEvent
};
