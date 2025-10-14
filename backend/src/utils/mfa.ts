/**
 * Multi-Factor Authentication (MFA) Utilities
 *
 * Features:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - QR code generation for authenticator apps
 * - Backup codes generation
 * - SMS OTP via Twilio
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('mfa-utils');

// ============================================================================
// CONFIGURATION
// ============================================================================

const APP_NAME = process.env.APP_NAME || 'ROI Systems';
const TOTP_WINDOW = parseInt(process.env.TOTP_WINDOW || '1'); // +/- 30 seconds
const BACKUP_CODES_COUNT = 10;

// Twilio configuration (for SMS OTP)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// ============================================================================
// TYPES
// ============================================================================

export interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface TOTPVerification {
  valid: boolean;
  delta?: number; // Time window delta if valid
}

// ============================================================================
// TOTP (AUTHENTICATOR APP) FUNCTIONS
// ============================================================================

/**
 * Generate TOTP secret and QR code for user enrollment
 * @param userEmail - User's email for labeling
 * @param userId - User's ID for uniqueness
 * @returns TOTP setup data including secret and QR code
 */
export async function generateTOTPSecret(
  userEmail: string,
  userId: string
): Promise<TOTPSetup> {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${userEmail})`,
      issuer: APP_NAME,
      length: 32,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    logger.info(`Generated TOTP secret for user: ${userId}`);

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
      backupCodes,
    };
  } catch (error) {
    logger.error('Error generating TOTP secret:', error);
    throw new Error('Failed to generate TOTP secret');
  }
}

/**
 * Verify TOTP token
 * @param token - 6-digit TOTP token
 * @param secret - User's TOTP secret
 * @returns Verification result
 */
export function verifyTOTPToken(
  token: string,
  secret: string
): TOTPVerification {
  try {
    // Remove spaces and validate format
    const cleanToken = token.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return { valid: false };
    }

    // Verify token with time window
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: cleanToken,
      window: TOTP_WINDOW,
    });

    return {
      valid: verified !== false,
      delta: typeof verified === 'number' ? verified : undefined,
    };
  } catch (error) {
    logger.error('Error verifying TOTP token:', error);
    return { valid: false };
  }
}

/**
 * Generate current TOTP token (for testing)
 * @param secret - TOTP secret
 * @returns Current token
 */
export function generateTOTPToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}

// ============================================================================
// BACKUP CODES
// ============================================================================

/**
 * Generate backup codes for account recovery
 * @param count - Number of codes to generate
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = BACKUP_CODES_COUNT): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-');

    if (code) {
      codes.push(code);
    }
  }

  return codes;
}

/**
 * Hash backup code for storage
 * @param code - Plain backup code
 * @returns Hashed code
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace(/-/g, '').toLowerCase())
    .digest('hex');
}

/**
 * Verify backup code
 * @param providedCode - Code provided by user
 * @param hashedCodes - Array of hashed codes
 * @returns Index of matched code or -1
 */
export function verifyBackupCode(
  providedCode: string,
  hashedCodes: string[]
): number {
  const hashedProvided = hashBackupCode(providedCode);
  return hashedCodes.findIndex((hash) => hash === hashedProvided);
}

// ============================================================================
// SMS OTP (via Twilio)
// ============================================================================

/**
 * Send SMS OTP code
 * @param phoneNumber - Phone number in E.164 format
 * @param code - OTP code to send
 * @returns Success status
 */
export async function sendSMSOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      logger.warn('Twilio credentials not configured');
      return false;
    }

    // Initialize Twilio client
    const twilio = require('twilio');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Send SMS
    await client.messages.create({
      body: `Your ${APP_NAME} verification code is: ${code}. Valid for 5 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    logger.info(`SMS OTP sent to: ${phoneNumber.substring(0, 6)}***`);
    return true;
  } catch (error) {
    logger.error('Error sending SMS OTP:', error);
    return false;
  }
}

/**
 * Generate and send SMS OTP
 * @param phoneNumber - Phone number
 * @returns OTP code and hash
 */
export async function generateAndSendSMSOTP(phoneNumber: string): Promise<{
  code: string;
  hash: string;
  expiresAt: Date;
} | null> {
  try {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();

    // Send SMS
    const sent = await sendSMSOTP(phoneNumber, code);
    if (!sent) {
      return null;
    }

    // Hash code for storage
    const hash = crypto.createHash('sha256').update(code).digest('hex');

    // Set expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return { code, hash, expiresAt };
  } catch (error) {
    logger.error('Error generating and sending SMS OTP:', error);
    return null;
  }
}

/**
 * Verify SMS OTP
 * @param providedCode - Code provided by user
 * @param hashedCode - Stored hashed code
 * @param expiresAt - Expiry time
 * @returns Valid status
 */
export function verifySMSOTP(
  providedCode: string,
  hashedCode: string,
  expiresAt: Date
): boolean {
  try {
    // Check expiry
    if (new Date() > expiresAt) {
      return false;
    }

    // Hash provided code
    const hash = crypto.createHash('sha256').update(providedCode).digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedCode));
  } catch (error) {
    logger.error('Error verifying SMS OTP:', error);
    return false;
  }
}

// ============================================================================
// MFA VALIDATION
// ============================================================================

/**
 * Validate phone number format (E.164)
 * @param phoneNumber - Phone number to validate
 * @returns Valid status
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format phone number for display (mask)
 * @param phoneNumber - Phone number
 * @returns Masked phone number
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || phoneNumber.length < 4) {
    return '***';
  }
  const lastFour = phoneNumber.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Check if MFA is required based on security settings
 * @param userRole - User's role
 * @param organizationType - Organization type
 * @returns MFA requirement status
 */
export function isMFARequired(
  userRole: string,
  organizationType: string
): boolean {
  // MFA required for admins and company admins
  if (userRole === 'ADMIN' || userRole === 'COMPANY_ADMIN') {
    return true;
  }

  // MFA required for title companies
  if (organizationType === 'TITLE_COMPANY') {
    return true;
  }

  return false;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * Check rate limit for MFA attempts
 * @param identifier - User ID or IP address
 * @param maxAttempts - Max attempts allowed
 * @param windowMinutes - Time window in minutes
 * @returns Allowed status
 */
export function checkMFARateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remainingAttempts: number; resetAt?: Date } {
  const now = new Date();
  const entry = rateLimitStore.get(identifier);

  // No previous attempts or window expired
  if (!entry || now > entry.resetAt) {
    const resetAt = new Date(now.getTime() + windowMinutes * 60 * 1000);
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for identifier
 * @param identifier - User ID or IP address
 */
export function resetMFARateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate MFA session token (temporary token for 2FA flow)
 * @returns Session token
 */
export function generateMFASessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate MFA method
 * @param method - MFA method
 * @returns Valid status
 */
export function isValidMFAMethod(method: string): boolean {
  const validMethods = ['totp', 'sms', 'backup_code'];
  return validMethods.includes(method.toLowerCase());
}
