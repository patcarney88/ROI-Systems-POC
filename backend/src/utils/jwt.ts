import jwt from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types';

// SECURITY FIX: No fallback defaults - secrets must be explicitly set
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// SECURITY: Validate secrets on module load (fail-fast pattern)
if (!JWT_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET environment variable must be set. ' +
    'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

if (!JWT_REFRESH_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_REFRESH_SECRET environment variable must be set. ' +
    'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

// SECURITY: Enforce minimum secret length (256 bits = 64 hex chars)
if (JWT_SECRET.length < 32) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET must be at least 32 characters long (64 recommended). ' +
    'Current length: ' + JWT_SECRET.length
  );
}

if (JWT_REFRESH_SECRET.length < 32) {
  throw new Error(
    'SECURITY ERROR: JWT_REFRESH_SECRET must be at least 32 characters long (64 recommended). ' +
    'Current length: ' + JWT_REFRESH_SECRET.length
  );
}

// SECURITY: Secrets must be different
if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET and JWT_REFRESH_SECRET must be different values'
  );
}

// SECURITY: Prevent usage of obvious test/example secrets
const FORBIDDEN_SECRETS = [
  'your-secret-key-change-in-production',
  'your-refresh-secret-change-in-production',
  'development_secret',
  'test_secret',
  'secret',
  'password',
  '123456'
];

if (FORBIDDEN_SECRETS.includes(JWT_SECRET) || FORBIDDEN_SECRETS.includes(JWT_REFRESH_SECRET)) {
  throw new Error(
    'SECURITY ERROR: Detected usage of example/test secret. ' +
    'You must generate a cryptographically secure secret for production.'
  );
}

/**
 * Generate access and refresh tokens with explicit algorithm and additional claims
 * SECURITY: HS256 algorithm specified to prevent algorithm confusion attacks
 * OWASP Reference: A02:2021 - Cryptographic Failures
 */
export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens => {
  // SECURITY: Explicitly specify algorithm to prevent algorithm substitution attacks
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_EXPIRES_IN as string | number,
    issuer: 'roi-systems-api',
    audience: 'roi-systems-client'
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: JWT_REFRESH_EXPIRES_IN as string | number,
    issuer: 'roi-systems-api',
    audience: 'roi-systems-client'
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

/**
 * Verify access token with strict algorithm validation
 * SECURITY: Prevents algorithm confusion attacks (e.g., using RS256 public key as HS256 secret)
 * OWASP Reference: A02:2021 - Cryptographic Failures
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    // SECURITY: Only allow HS256 algorithm, verify issuer and audience
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'roi-systems-api',
      audience: 'roi-systems-client'
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Verify refresh token with strict algorithm validation
 * SECURITY: Same protections as access token verification
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    // SECURITY: Only allow HS256 algorithm, verify issuer and audience
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: 'roi-systems-api',
      audience: 'roi-systems-client'
    }) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode token without verification (for debugging only)
 * WARNING: Never use decoded token for authentication/authorization
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
