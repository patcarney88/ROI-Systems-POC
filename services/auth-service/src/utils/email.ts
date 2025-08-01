/**
 * Email Service Utilities
 * Designed by: Email Marketing Specialist + Security Specialist
 * 
 * Secure email delivery with template support and monitoring
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates for authentication flows
const emailTemplates: Record<string, EmailTemplate> = {
  'email-verification': {
    subject: 'Verify your ROI Systems account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 ROI Systems Digital Docs</h1>
          </div>
          <div class="content">
            <h2>Welcome, {{first_name}}!</h2>
            <p>Thank you for signing up for ROI Systems Digital Docs. To complete your registration and secure your account, please verify your email address.</p>
            
            <p><a href="{{verification_url}}" class="button">Verify Email Address</a></p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="{{verification_url}}">{{verification_url}}</a></p>
            
            <p><strong>Security Note:</strong> This verification link will expire in 24 hours for your security.</p>
            
            <p>If you didn't create an account with ROI Systems, please ignore this email.</p>
            
            <p>Best regards,<br>The ROI Systems Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ROI Systems. All rights reserved.</p>
            <p>This email was sent to {{email}}. If you have questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to ROI Systems Digital Docs, {{first_name}}!
      
      Thank you for signing up. To complete your registration, please verify your email address by clicking the link below:
      
      {{verification_url}}
      
      This verification link will expire in 24 hours for your security.
      
      If you didn't create an account with ROI Systems, please ignore this email.
      
      Best regards,
      The ROI Systems Team
      
      © 2025 ROI Systems. All rights reserved.
    `
  },

  'password-reset': {
    subject: 'Reset your ROI Systems password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello, {{first_name}}!</h2>
            <p>We received a request to reset your password for your ROI Systems account.</p>
            
            <p><a href="{{reset_url}}" class="button">Reset Password</a></p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="{{reset_url}}">{{reset_url}}</a></p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This reset link will expire in 1 hour for your security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If you continue to have problems, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The ROI Systems Security Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ROI Systems. All rights reserved.</p>
            <p>This email was sent to {{email}} for security purposes.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request - ROI Systems
      
      Hello, {{first_name}}!
      
      We received a request to reset your password for your ROI Systems account.
      
      Click this link to reset your password:
      {{reset_url}}
      
      SECURITY NOTICE:
      - This reset link will expire in 1 hour for your security
      - If you didn't request this reset, please ignore this email
      - Never share this link with anyone
      
      If you continue to have problems, please contact our support team immediately.
      
      Best regards,
      The ROI Systems Security Team
      
      © 2025 ROI Systems. All rights reserved.
    `
  },

  'mfa-enabled': {
    subject: 'Multi-Factor Authentication Enabled',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MFA Enabled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .success { background: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Multi-Factor Authentication Enabled</h1>
          </div>
          <div class="content">
            <h2>Hello, {{first_name}}!</h2>
            
            <div class="success">
              <strong>✅ Success!</strong> Multi-Factor Authentication has been successfully enabled for your ROI Systems account.
            </div>
            
            <p>Your account is now more secure with an additional layer of protection. Here's what this means:</p>
            
            <ul>
              <li><strong>Enhanced Security:</strong> Your account is now protected by both your password and your authenticator app</li>
              <li><strong>Login Process:</strong> You'll need to enter a 6-digit code from your authenticator app each time you log in</li>
              <li><strong>Backup Codes:</strong> Keep your backup codes safe - they can be used if you lose access to your authenticator app</li>
            </ul>
            
            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>Store your backup codes in a secure location</li>
              <li>Don't share your MFA codes with anyone</li>
              <li>Contact support if you lose access to your authenticator app</li>
            </ul>
            
            <p>If you did not enable MFA yourself, please contact our security team immediately.</p>
            
            <p>Thank you for helping keep ROI Systems secure!</p>
            
            <p>Best regards,<br>The ROI Systems Security Team</p>
          </div>
          <div class="footer">
            <p>© 2025 ROI Systems. All rights reserved.</p>
            <p>This security notification was sent to {{email}}.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Multi-Factor Authentication Enabled - ROI Systems
      
      Hello, {{first_name}}!
      
      ✅ SUCCESS! Multi-Factor Authentication has been successfully enabled for your ROI Systems account.
      
      Your account is now more secure with an additional layer of protection. Here's what this means:
      
      - Enhanced Security: Your account is now protected by both your password and your authenticator app
      - Login Process: You'll need to enter a 6-digit code from your authenticator app each time you log in
      - Backup Codes: Keep your backup codes safe - they can be used if you lose access to your authenticator app
      
      Important Reminders:
      - Store your backup codes in a secure location
      - Don't share your MFA codes with anyone
      - Contact support if you lose access to your authenticator app
      
      If you did not enable MFA yourself, please contact our security team immediately.
      
      Thank you for helping keep ROI Systems secure!
      
      Best regards,
      The ROI Systems Security Team
      
      © 2025 ROI Systems. All rights reserved.
    `
  }
};

// Create email transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email service
 */
export function initializeEmailService(): void {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined,
    // Development settings for MailHog
    ...(process.env.NODE_ENV === 'development' && {
      ignoreTLS: true,
      requireTLS: false
    })
  };

  transporter = nodemailer.createTransporter(emailConfig);

  logger.info('Email service initialized', {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: !!emailConfig.auth
  });
}

/**
 * Send email using template
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!transporter) {
    initializeEmailService();
  }

  try {
    // Get template
    const template = emailTemplates[options.template];
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject, options.data);
    const html = replaceTemplateVariables(template.html, options.data);
    const text = replaceTemplateVariables(template.text, options.data);

    // Email options
    const mailOptions = {
      from: {
        name: 'ROI Systems Digital Docs',
        address: process.env.FROM_EMAIL || 'noreply@roisystems.com'
      },
      to: options.to,
      subject: options.subject || subject,
      html,
      text,
      attachments: options.attachments || [],
      // Security headers
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'ROI Systems Auth Service'
      }
    };

    // Send email
    const info = await transporter!.sendMail(mailOptions);

    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      template: options.template,
      subject: options.subject || subject
    });

  } catch (error) {
    logger.error('Failed to send email', {
      error: error.message,
      to: options.to,
      template: options.template
    });
    throw error;
  }
}

/**
 * Replace template variables in text
 */
function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Replace {{variable}} with actual values
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify your ROI Systems account',
    template: 'email-verification',
    data: {
      first_name: firstName,
      email,
      verification_token: verificationToken,
      verification_url: verificationUrl
    }
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset your ROI Systems password',
    template: 'password-reset',
    data: {
      first_name: firstName,
      email,
      reset_token: resetToken,
      reset_url: resetUrl
    }
  });
}

/**
 * Send MFA enabled notification
 */
export async function sendMFAEnabledEmail(
  email: string,
  firstName: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Multi-Factor Authentication Enabled',
    template: 'mfa-enabled',
    data: {
      first_name: firstName,
      email
    }
  });
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  if (!transporter) {
    initializeEmailService();
  }

  try {
    await transporter!.verify();
    logger.info('Email configuration test successful');
    return true;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
}