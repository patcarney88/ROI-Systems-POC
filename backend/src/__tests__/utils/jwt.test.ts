/**
 * JWT Utility Tests
 * Tests for JWT token generation and verification
 */

import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../utils/jwt';

describe('JWT Utilities', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      const tokens = generateTokens(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken.length).toBeGreaterThan(0);
      expect(tokens.refreshToken.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different users', () => {
      const payload1 = {
        userId: 'user_1',
        email: 'user1@example.com',
        role: 'agent'
      };

      const payload2 = {
        userId: 'user_2',
        email: 'user2@example.com',
        role: 'agent'
      };

      const tokens1 = generateTokens(payload1);
      const tokens2 = generateTokens(payload2);

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });

    it('should include user data in token payload', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'admin'
      };

      const tokens = generateTokens(payload);
      const decoded = verifyAccessToken(tokens.accessToken);

      expect(decoded).toMatchObject({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      const tokens = generateTokens(payload);
      const decoded = verifyAccessToken(tokens.accessToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyAccessToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-valid-jwt';

      expect(() => {
        verifyAccessToken(malformedToken);
      }).toThrow();
    });

    it('should throw error for empty token', () => {
      expect(() => {
        verifyAccessToken('');
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      const tokens = generateTokens(payload);
      const decoded = verifyRefreshToken(tokens.refreshToken);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';

      expect(() => {
        verifyRefreshToken(invalidToken);
      }).toThrow();
    });

    it('should not accept access token as refresh token', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      const tokens = generateTokens(payload);

      // Access token should not be valid as refresh token
      expect(() => {
        verifyRefreshToken(tokens.accessToken);
      }).toThrow();
    });
  });

  describe('Token expiration', () => {
    it('should include expiration in token', () => {
      const payload = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      const tokens = generateTokens(payload);
      const decoded = verifyAccessToken(tokens.accessToken);

      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      expect(decoded.exp!).toBeGreaterThan(decoded.iat!);
    });
  });
});
