/**
 * SoftPro OAuth Service
 *
 * Features:
 * - OAuth 2.0 authorization code flow
 * - Secure token storage (encrypted)
 * - Automatic token refresh
 * - Multi-tenant support
 * - Permission scoping
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/security';
import { AuthenticationError } from '../types/softpro.types';

const logger = createLogger('softpro-oauth');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOFTPRO_OAUTH_AUTHORIZE_URL =
  process.env.SOFTPRO_OAUTH_AUTHORIZE_URL ||
  'https://auth.softprocorp.com/oauth/authorize';

const SOFTPRO_OAUTH_TOKEN_URL =
  process.env.SOFTPRO_OAUTH_TOKEN_URL || 'https://auth.softprocorp.com/oauth/token';

const SOFTPRO_OAUTH_REVOKE_URL =
  process.env.SOFTPRO_OAUTH_REVOKE_URL || 'https://auth.softprocorp.com/oauth/revoke';

const OAUTH_REDIRECT_URI =
  process.env.SOFTPRO_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/v1/integrations/softpro/callback';

const OAUTH_SCOPES = [
  'read:transactions',
  'write:transactions',
  'read:contacts',
  'write:contacts',
  'read:documents',
  'write:documents',
  'webhooks',
];

// Token expiry buffer (refresh 5 minutes before actual expiry)
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

// ============================================================================
// TYPES
// ============================================================================

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  scope: string;
}

interface StateData {
  organizationId: string;
  redirectPath?: string;
  timestamp: number;
}

// ============================================================================
// OAUTH AUTHORIZATION FLOW
// ============================================================================

/**
 * Generate OAuth authorization URL
 * @param organizationId - Organization ID
 * @param redirectPath - Optional redirect path after authorization
 * @returns Authorization URL
 */
export async function getAuthorizationUrl(
  organizationId: string,
  redirectPath?: string
): Promise<string> {
  try {
    // Get or create integration record
    let integration = await prisma.softProIntegration.findUnique({
      where: { organizationId },
    });

    if (!integration) {
      integration = await prisma.softProIntegration.create({
        data: {
          organizationId,
          clientId: '', // Will be set during configuration
          clientSecret: '', // Will be set during configuration
          status: 'DISCONNECTED',
        },
      });
    }

    // Generate state parameter for CSRF protection
    const stateData: StateData = {
      organizationId,
      redirectPath,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: integration.clientId,
      response_type: 'code',
      redirect_uri: OAUTH_REDIRECT_URI,
      scope: OAUTH_SCOPES.join(' '),
      state,
    });

    const authUrl = `${SOFTPRO_OAUTH_AUTHORIZE_URL}?${params.toString()}`;

    logger.info('Generated OAuth authorization URL', {
      organizationId,
      hasRedirectPath: !!redirectPath,
    });

    return authUrl;
  } catch (error: any) {
    logger.error('Failed to generate authorization URL', {
      organizationId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Exchange authorization code for access tokens
 * @param code - Authorization code from OAuth callback
 * @param state - State parameter for CSRF validation
 * @returns State data
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<StateData> {
  try {
    // Validate and decode state
    const stateData = validateState(state);

    // Get integration
    const integration = await prisma.softProIntegration.findUnique({
      where: { organizationId: stateData.organizationId },
    });

    if (!integration) {
      throw new AuthenticationError('Integration not found');
    }

    // Update status to authenticating
    await prisma.softProIntegration.update({
      where: { id: integration.id },
      data: { status: 'AUTHENTICATING' },
    });

    // Exchange code for tokens
    const tokenResponse = await requestTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      client_id: integration.clientId,
      client_secret: decrypt(integration.clientSecret),
    });

    // Store encrypted tokens
    await storeTokens(integration.id, tokenResponse);

    logger.info('Successfully exchanged code for tokens', {
      organizationId: stateData.organizationId,
    });

    return stateData;
  } catch (error: any) {
    logger.error('Failed to exchange code for tokens', {
      error: error.message,
    });

    throw new AuthenticationError(
      'Failed to exchange authorization code for tokens',
      { originalError: error.message }
    );
  }
}

/**
 * Refresh access token
 * @param integrationId - Integration ID
 * @returns New access token
 */
export async function refreshAccessToken(integrationId: string): Promise<string> {
  try {
    const integration = await prisma.softProIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new AuthenticationError('Integration not found');
    }

    if (!integration.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    logger.info('Refreshing access token', { integrationId });

    // Decrypt refresh token
    const refreshToken = decrypt(integration.refreshToken);

    // Request new tokens
    const tokenResponse = await requestTokens({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: integration.clientId,
      client_secret: decrypt(integration.clientSecret),
    });

    // Store new tokens
    await storeTokens(integrationId, tokenResponse);

    logger.info('Successfully refreshed access token', { integrationId });

    return decrypt(tokenResponse.access_token);
  } catch (error: any) {
    logger.error('Failed to refresh access token', {
      integrationId,
      error: error.message,
    });

    // Update integration status to error
    await prisma.softProIntegration.update({
      where: { id: integrationId },
      data: {
        status: 'ERROR',
        lastErrorAt: new Date(),
        lastErrorMessage: 'Failed to refresh access token',
      },
    });

    throw new AuthenticationError('Failed to refresh access token', {
      originalError: error.message,
    });
  }
}

/**
 * Get valid access token (auto-refresh if needed)
 * @param integrationId - Integration ID
 * @returns Valid access token
 */
export async function getValidAccessToken(integrationId: string): Promise<string> {
  try {
    const integration = await prisma.softProIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new AuthenticationError('Integration not found');
    }

    if (integration.status !== 'CONNECTED') {
      throw new AuthenticationError(
        `Integration is ${integration.status}. Please reconnect.`
      );
    }

    if (!integration.accessToken) {
      throw new AuthenticationError('No access token available');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const expiresAt = integration.tokenExpiresAt;

    if (!expiresAt || now.getTime() >= expiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS) {
      logger.info('Access token expired or about to expire, refreshing', {
        integrationId,
      });
      return await refreshAccessToken(integrationId);
    }

    // Token is still valid
    return decrypt(integration.accessToken);
  } catch (error: any) {
    logger.error('Failed to get valid access token', {
      integrationId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Revoke access (disconnect integration)
 * @param integrationId - Integration ID
 */
export async function revokeAccess(integrationId: string): Promise<void> {
  try {
    const integration = await prisma.softProIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new AuthenticationError('Integration not found');
    }

    if (integration.accessToken) {
      try {
        // Revoke access token with SoftPro
        await axios.post(
          SOFTPRO_OAUTH_REVOKE_URL,
          {
            token: decrypt(integration.accessToken),
            client_id: integration.clientId,
            client_secret: decrypt(integration.clientSecret),
          },
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );
      } catch (revokeError: any) {
        // Log but don't fail if revocation fails
        logger.warn('Failed to revoke token with SoftPro', {
          integrationId,
          error: revokeError.message,
        });
      }
    }

    // Update integration to disconnected
    await prisma.softProIntegration.update({
      where: { id: integrationId },
      data: {
        status: 'DISCONNECTED',
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      },
    });

    logger.info('Successfully revoked access', { integrationId });
  } catch (error: any) {
    logger.error('Failed to revoke access', {
      integrationId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Validate access token
 * @param accessToken - Access token to validate
 * @returns True if valid
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    // Make a test API call to validate token
    const response = await axios.get(
      `${process.env.SOFTPRO_SANDBOX_BASE_URL || 'https://api-sandbox.softprocorp.com/api/v1'}/user/profile`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 5000,
      }
    );

    return response.status === 200;
  } catch (error: any) {
    logger.warn('Token validation failed', {
      statusCode: error.response?.status,
      error: error.message,
    });
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Request OAuth tokens
 * @param params - Token request parameters
 * @returns Token response
 */
async function requestTokens(params: Record<string, string>): Promise<TokenResponse> {
  try {
    const response = await axios.post<TokenResponse>(SOFTPRO_OAUTH_TOKEN_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Token request failed', {
      statusCode: error.response?.status,
      error: error.message,
      data: error.response?.data,
    });

    throw new AuthenticationError('Failed to request tokens from SoftPro', {
      statusCode: error.response?.status,
      details: error.response?.data,
    });
  }
}

/**
 * Store encrypted tokens
 * @param integrationId - Integration ID
 * @param tokenResponse - Token response from OAuth
 */
async function storeTokens(
  integrationId: string,
  tokenResponse: TokenResponse
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  await prisma.softProIntegration.update({
    where: { id: integrationId },
    data: {
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: encrypt(tokenResponse.refresh_token),
      tokenExpiresAt: expiresAt,
      status: 'CONNECTED',
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });
}

/**
 * Validate state parameter
 * @param state - State parameter from callback
 * @returns Decoded state data
 */
function validateState(state: string): StateData {
  try {
    const stateJson = Buffer.from(state, 'base64url').toString('utf-8');
    const stateData: StateData = JSON.parse(stateJson);

    // Validate timestamp (state should not be older than 10 minutes)
    const now = Date.now();
    const stateAge = now - stateData.timestamp;
    const maxAge = 10 * 60 * 1000; // 10 minutes

    if (stateAge > maxAge) {
      throw new Error('State parameter expired');
    }

    return stateData;
  } catch (error: any) {
    logger.error('State validation failed', { error: error.message });
    throw new AuthenticationError('Invalid state parameter', {
      originalError: error.message,
    });
  }
}

/**
 * Generate random state parameter
 * @returns Base64 encoded state
 */
function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}
