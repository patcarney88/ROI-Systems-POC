/**
 * Security Utilities for Authentication System
 *
 * Features:
 * - Password hashing with bcrypt (12 rounds)
 * - JWT generation and verification with RS256
 * - Token generation for various purposes
 * - Cryptographic utilities
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

// RS256 Keys (should be loaded from environment or AWS KMS)
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  type: 'access' | 'refresh';
  sessionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

export interface DecodedToken extends JWTPayload {
  iat: number;
  exp: number;
  jti: string;
}

// ============================================================================
// PASSWORD HASHING
// ============================================================================

/**
 * Hash a password using bcrypt with 12 rounds
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if password needs rehashing (bcrypt rounds changed)
 * @param hash - Hashed password
 * @returns True if hash needs updating
 */
export function needsRehash(hash: string): boolean {
  const rounds = bcrypt.getRounds(hash);
  return rounds !== BCRYPT_ROUNDS;
}

// ============================================================================
// JWT TOKEN MANAGEMENT (RS256)
// ============================================================================

/**
 * Generate access and refresh token pair with RS256
 * @param payload - Token payload
 * @returns Token pair with expiry dates
 */
export function generateTokenPair(
  payload: Omit<JWTPayload, 'type'>
): TokenPair {
  if (!JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY not configured');
  }

  const now = new Date();
  const accessTokenExpiry = new Date(now.getTime() + parseExpiry(JWT_ACCESS_EXPIRY));
  const refreshTokenExpiry = new Date(now.getTime() + parseExpiry(JWT_REFRESH_EXPIRY));

  // Generate access token
  const accessToken = jwt.sign(
    {
      ...payload,
      type: 'access',
      jti: uuidv4(), // Unique token ID
    },
    JWT_PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: JWT_ACCESS_EXPIRY,
      issuer: 'roi-systems',
      audience: 'roi-systems-api',
    }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    {
      ...payload,
      type: 'refresh',
      jti: uuidv4(),
    },
    JWT_PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: 'roi-systems',
      audience: 'roi-systems-api',
    }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry,
    refreshTokenExpiry,
  };
}

/**
 * Verify and decode JWT token using RS256
 * @param token - JWT token
 * @param type - Expected token type
 * @returns Decoded token payload
 */
export function verifyToken(
  token: string,
  type: 'access' | 'refresh' = 'access'
): DecodedToken {
  if (!JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY not configured');
  }

  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'roi-systems',
      audience: 'roi-systems-api',
    }) as DecodedToken;

    // Verify token type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging/inspection)
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// ============================================================================
// SECURE TOKEN GENERATION
// ============================================================================

/**
 * Generate cryptographically secure random token
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate URL-safe token
 * @param length - Token length in bytes (default: 32)
 * @returns Base64URL-encoded token
 */
export function generateUrlSafeToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64url')
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Generate numeric OTP code
 * @param length - Number of digits (default: 6)
 * @returns Numeric OTP string
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

/**
 * Hash sensitive data (tokens, API keys) for storage
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate API key with prefix
 * @param prefix - Key prefix (e.g., 'roi_live_')
 * @returns API key
 */
export function generateApiKey(prefix: string = 'roi_'): {
  key: string;
  hash: string;
  prefix: string;
} {
  const randomPart = generateSecureToken(32);
  const key = `${prefix}${randomPart}`;
  const hash = hashSensitiveData(key);
  const keyPrefix = key.substring(0, Math.min(prefix.length + 8, key.length));

  return { key, hash, prefix: keyPrefix };
}

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

/**
 * Encrypt sensitive data (e.g., MFA secrets)
 * @param text - Plain text to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV:AuthTag:Encrypted format
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted data in IV:AuthTag:Encrypted format
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse expiry string to milliseconds
 * @param expiry - Expiry string (e.g., '15m', '7d')
 * @returns Milliseconds
 */
function parseExpiry(expiry: string): number {
  const units: { [key: string]: number } = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  return value * units[unit];
}

/**
 * Calculate token expiry date from expiry string
 * @param expiry - Expiry string
 * @returns Expiry date
 */
export function calculateExpiryDate(expiry: string): Date {
  const ms = parseExpiry(expiry);
  return new Date(Date.now() + ms);
}

/**
 * Check if date has expired
 * @param date - Date to check
 * @returns True if expired
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Generate CSRF token
 * @returns CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 * @param token - Token to validate
 * @param expectedToken - Expected token
 * @returns True if valid
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }
  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

/**
 * Generate password reset token with expiry
 * @param expiryHours - Hours until expiry (default: 1)
 * @returns Token and expiry date
 */
export function generatePasswordResetToken(expiryHours: number = 1): {
  token: string;
  hash: string;
  expiry: Date;
} {
  const token = generateSecureToken(32);
  const hash = hashSensitiveData(token);
  const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  return { token, hash, expiry };
}

/**
 * Generate email verification token
 * @param expiryHours - Hours until expiry (default: 24)
 * @returns Token and expiry date
 */
export function generateEmailVerificationToken(expiryHours: number = 24): {
  token: string;
  hash: string;
  expiry: Date;
} {
  const token = generateSecureToken(32);
  const hash = hashSensitiveData(token);
  const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  return { token, hash, expiry };
}
