/**
 * OAuth Service
 *
 * Features:
 * - Google OAuth integration
 * - Microsoft OAuth integration
 * - Facebook OAuth integration
 * - Account linking (connect OAuth to existing account)
 * - Account creation from OAuth
 * - Profile synchronization
 */

import { PrismaClient, OAuthProvider, UserStatus } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { createLogger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/security';
import { createSession, type DeviceInfo } from './session.service';

const logger = createLogger('oauth-service');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || '';
const MICROSOFT_CALLBACK_URL = process.env.MICROSOFT_CALLBACK_URL || '';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || '';

// ============================================================================
// TYPES
// ============================================================================

export interface OAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export interface OAuthLoginResult {
  user: any;
  tokens: any;
  isNewUser: boolean;
}

// ============================================================================
// PASSPORT CONFIGURATION
// ============================================================================

/**
 * Initialize OAuth strategies
 */
export function initializeOAuth(): void {
  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const oauthProfile: OAuthProfile = {
              provider: OAuthProvider.GOOGLE,
              providerId: profile.id,
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              username: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
            };

            done(null, oauthProfile);
          } catch (error) {
            done(error);
          }
        }
      )
    );
  }

  // Microsoft OAuth Strategy
  if (MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: MICROSOFT_CLIENT_ID,
          clientSecret: MICROSOFT_CLIENT_SECRET,
          callbackURL: MICROSOFT_CALLBACK_URL,
          scope: ['user.read'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const oauthProfile: OAuthProfile = {
              provider: OAuthProvider.MICROSOFT,
              providerId: profile.id,
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              username: profile.displayName,
              accessToken,
              refreshToken,
            };

            done(null, oauthProfile);
          } catch (error) {
            done(error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'emails', 'name', 'picture'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const oauthProfile: OAuthProfile = {
              provider: OAuthProvider.FACEBOOK,
              providerId: profile.id,
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              username: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
              accessToken,
              refreshToken,
            };

            done(null, oauthProfile);
          } catch (error) {
            done(error);
          }
        }
      )
    );
  }

  logger.info('OAuth strategies initialized');
}

// ============================================================================
// OAUTH LOGIN/SIGNUP
// ============================================================================

/**
 * Handle OAuth login or create new account
 * @param profile - OAuth profile
 * @param deviceInfo - Device information
 * @returns Login result with user and tokens
 */
export async function handleOAuthLogin(
  profile: OAuthProfile,
  deviceInfo: DeviceInfo
): Promise<OAuthLoginResult> {
  try {
    // Check if OAuth account exists
    const oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (oauthAccount) {
      // Existing OAuth account - update and login
      const user = oauthAccount.user;

      // Update OAuth account tokens
      await updateOAuthAccount(
        oauthAccount.id,
        profile.accessToken,
        profile.refreshToken,
        profile.tokenExpiry
      );

      // Create session
      const { tokens, session } = await createSession(
        user.id,
        user.email,
        user.organizationId || undefined,
        user.role,
        deviceInfo,
        []
      );

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resource: 'user',
          resourceId: user.id,
          ipAddress: deviceInfo.ipAddress,
          userAgent: deviceInfo.userAgent,
          success: true,
          metadata: {
            provider: profile.provider,
            sessionId: session.sessionId,
          },
        },
      });

      logger.info(`OAuth login successful: ${user.email} via ${profile.provider}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        tokens,
        isNewUser: false,
      };
    }

    // Check if user exists with same email
    if (profile.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email.toLowerCase() },
      });

      if (existingUser) {
        // Link OAuth account to existing user
        await linkOAuthAccount(existingUser.id, profile);

        // Create session
        const { tokens, session } = await createSession(
          existingUser.id,
          existingUser.email,
          existingUser.organizationId || undefined,
          existingUser.role,
          deviceInfo,
          []
        );

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: existingUser.id,
            action: 'OAUTH_LINK',
            resource: 'user',
            resourceId: existingUser.id,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            success: true,
            metadata: {
              provider: profile.provider,
            },
          },
        });

        logger.info(
          `OAuth account linked to existing user: ${existingUser.email}`
        );

        return {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role,
            emailVerified: existingUser.emailVerified,
          },
          tokens,
          isNewUser: false,
        };
      }
    }

    // Create new user from OAuth profile
    if (!profile.email || !profile.firstName || !profile.lastName) {
      throw new Error('OAuth profile missing required fields');
    }

    const newUser = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        emailVerified: true, // OAuth emails are pre-verified
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
        role: 'AGENT', // Default role
      },
    });

    // Link OAuth account to new user
    await linkOAuthAccount(newUser.id, profile);

    // Create session
    const { tokens, session } = await createSession(
      newUser.id,
      newUser.email,
      newUser.organizationId || undefined,
      newUser.role,
      deviceInfo,
      []
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_CREATE',
        resource: 'user',
        resourceId: newUser.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        success: true,
        metadata: {
          provider: profile.provider,
          oauth: true,
        },
      },
    });

    logger.info(`New user created via OAuth: ${newUser.email}`);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
      tokens,
      isNewUser: true,
    };
  } catch (error) {
    logger.error('Error handling OAuth login:', error);
    throw error;
  }
}

// ============================================================================
// ACCOUNT LINKING
// ============================================================================

/**
 * Link OAuth account to existing user
 * @param userId - User ID
 * @param profile - OAuth profile
 */
export async function linkOAuthAccount(
  userId: string,
  profile: OAuthProfile
): Promise<void> {
  try {
    // Check if OAuth account already linked
    const existing = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });

    if (existing) {
      if (existing.userId === userId) {
        // Already linked to this user
        return;
      }
      throw new Error('OAuth account is already linked to another user');
    }

    // Encrypt tokens if provided
    let encryptedAccessToken: string | undefined;
    let encryptedRefreshToken: string | undefined;

    if (profile.accessToken) {
      encryptedAccessToken = encrypt(profile.accessToken);
    }

    if (profile.refreshToken) {
      encryptedRefreshToken = encrypt(profile.refreshToken);
    }

    // Create OAuth account
    await prisma.oAuthAccount.create({
      data: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        providerEmail: profile.email,
        providerUsername: profile.username,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry: profile.tokenExpiry,
        profileData: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.profilePicture,
        },
        lastSyncAt: new Date(),
      },
    });

    logger.info(`OAuth account linked: ${profile.provider} for user ${userId}`);
  } catch (error) {
    logger.error('Error linking OAuth account:', error);
    throw error;
  }
}

/**
 * Unlink OAuth account from user
 * @param userId - User ID
 * @param provider - OAuth provider
 */
export async function unlinkOAuthAccount(
  userId: string,
  provider: OAuthProvider
): Promise<void> {
  try {
    // Check if user has password (can't remove last login method)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        oauthAccounts: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.passwordHash && user.oauthAccounts.length === 1) {
      throw new Error(
        'Cannot unlink last OAuth account without setting a password first'
      );
    }

    // Find and delete OAuth account
    const oauthAccount = user.oauthAccounts.find(
      (account) => account.provider === provider
    );

    if (!oauthAccount) {
      throw new Error('OAuth account not found');
    }

    await prisma.oAuthAccount.delete({
      where: { id: oauthAccount.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'OAUTH_UNLINK',
        resource: 'user',
        resourceId: userId,
        success: true,
        metadata: {
          provider,
        },
      },
    });

    logger.info(`OAuth account unlinked: ${provider} for user ${userId}`);
  } catch (error) {
    logger.error('Error unlinking OAuth account:', error);
    throw error;
  }
}

/**
 * Update OAuth account tokens
 * @param oauthAccountId - OAuth account ID
 * @param accessToken - New access token
 * @param refreshToken - New refresh token
 * @param tokenExpiry - Token expiry date
 */
async function updateOAuthAccount(
  oauthAccountId: string,
  accessToken?: string,
  refreshToken?: string,
  tokenExpiry?: Date
): Promise<void> {
  try {
    const updateData: any = {
      lastSyncAt: new Date(),
    };

    if (accessToken) {
      updateData.accessToken = encrypt(accessToken);
    }

    if (refreshToken) {
      updateData.refreshToken = encrypt(refreshToken);
    }

    if (tokenExpiry) {
      updateData.tokenExpiry = tokenExpiry;
    }

    await prisma.oAuthAccount.update({
      where: { id: oauthAccountId },
      data: updateData,
    });
  } catch (error) {
    logger.error('Error updating OAuth account:', error);
  }
}

// ============================================================================
// PROFILE SYNCHRONIZATION
// ============================================================================

/**
 * Sync user profile from OAuth provider
 * @param userId - User ID
 * @param provider - OAuth provider
 * @returns Updated user
 */
export async function syncOAuthProfile(
  userId: string,
  provider: OAuthProvider
): Promise<any> {
  try {
    // Get OAuth account
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: {
        userId,
        provider,
      },
      include: {
        user: true,
      },
    });

    if (!oauthAccount) {
      throw new Error('OAuth account not found');
    }

    // Decrypt access token
    if (!oauthAccount.accessToken) {
      throw new Error('No access token available');
    }

    const accessToken = decrypt(oauthAccount.accessToken);

    // Fetch profile from provider (implementation depends on provider)
    // This is a placeholder - actual implementation would use provider APIs
    const profileData: any = await fetchProfileFromProvider(provider, accessToken);

    // Update user profile if needed
    const updateData: any = {};
    if (profileData.firstName && !oauthAccount.user.firstName) {
      updateData.firstName = profileData.firstName;
    }
    if (profileData.lastName && !oauthAccount.user.lastName) {
      updateData.lastName = profileData.lastName;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Update OAuth account profile data
    await prisma.oAuthAccount.update({
      where: { id: oauthAccount.id },
      data: {
        profileData: profileData,
        lastSyncAt: new Date(),
      },
    });

    logger.info(`Profile synced from ${provider} for user ${userId}`);

    return {
      ...oauthAccount.user,
      ...updateData,
    };
  } catch (error) {
    logger.error('Error syncing OAuth profile:', error);
    throw error;
  }
}

/**
 * Fetch profile from OAuth provider (placeholder)
 * @param provider - OAuth provider
 * @param accessToken - Access token
 * @returns Profile data
 */
async function fetchProfileFromProvider(
  provider: OAuthProvider,
  accessToken: string
): Promise<any> {
  // This would be implemented based on each provider's API
  // For now, return empty object
  logger.warn(`Profile fetch not implemented for provider: ${provider}`);
  return {};
}

/**
 * Get user's OAuth accounts
 * @param userId - User ID
 * @returns List of OAuth accounts
 */
export async function getUserOAuthAccounts(userId: string): Promise<any[]> {
  try {
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerEmail: true,
        providerUsername: true,
        profileData: true,
        createdAt: true,
        lastSyncAt: true,
      },
    });

    return accounts;
  } catch (error) {
    logger.error('Error getting user OAuth accounts:', error);
    return [];
  }
}
