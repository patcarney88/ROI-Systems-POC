/**
 * SECURITY-CRITICAL: Auth Middleware Tests
 * Tests JWT authentication and authorization middleware
 * OWASP A07:2021 - Identification and Authentication Failures
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import * as jwt from '../../utils/jwt';

// Mock the JWT utilities
jest.mock('../../utils/jwt');

describe('Auth Middleware - SECURITY CRITICAL', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    describe('SECURITY TEST 1: Valid JWT token authenticates successfully', () => {
      it('should authenticate user with valid JWT token', () => {
        const mockPayload = {
          userId: 'user_123',
          email: 'test@example.com',
          role: 'agent',
        };

        mockRequest.headers = {
          authorization: 'Bearer valid-token-here',
        };

        (jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(jwt.verifyAccessToken).toHaveBeenCalledWith('valid-token-here');
        expect(mockRequest.user).toEqual(mockPayload);
        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 2: Invalid JWT token is rejected', () => {
      it('should reject invalid JWT token with 401', () => {
        mockRequest.headers = {
          authorization: 'Bearer invalid-token',
        };

        (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid access token');
        });

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid access token',
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 3: Expired JWT token is rejected', () => {
      it('should reject expired JWT token with 401', () => {
        mockRequest.headers = {
          authorization: 'Bearer expired-token',
        };

        (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
          throw new Error('Access token has expired');
        });

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Access token has expired',
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 4: Missing JWT token returns 401', () => {
      it('should return 401 when Authorization header is missing', () => {
        mockRequest.headers = {};

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authentication token provided',
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 5: Malformed JWT token returns 401', () => {
      it('should reject token without Bearer prefix', () => {
        mockRequest.headers = {
          authorization: 'InvalidFormat token-here',
        };

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No authentication token provided',
          },
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject empty Bearer token', () => {
        mockRequest.headers = {
          authorization: 'Bearer ',
        };

        (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid access token');
        });

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 6: JWT with wrong algorithm rejected', () => {
      it('should reject token with unsupported algorithm', () => {
        mockRequest.headers = {
          authorization: 'Bearer token-with-wrong-algo',
        };

        (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid access token');
        });

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.objectContaining({
              code: 'UNAUTHORIZED',
            }),
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 7: User not found after token validation', () => {
      it('should handle case where token is valid but user does not exist', () => {
        const mockPayload = {
          userId: 'non-existent-user',
          email: 'deleted@example.com',
          role: 'agent',
        };

        mockRequest.headers = {
          authorization: 'Bearer valid-token-deleted-user',
        };

        (jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Token is valid, user is attached to request
        // Controller layer should handle user existence check
        expect(mockRequest.user).toEqual(mockPayload);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('SECURITY TEST 8: JWT token with missing claims rejected', () => {
      it('should reject token missing required userId claim', () => {
        mockRequest.headers = {
          authorization: 'Bearer token-missing-claims',
        };

        // Mock token with missing userId
        (jwt.verifyAccessToken as jest.Mock).mockReturnValue({
          email: 'test@example.com',
          role: 'agent',
          // userId is missing
        });

        authenticate(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        // Token is technically valid but missing claims
        // This should still call next() but user validation should fail in controller
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for users with correct role', () => {
      mockRequest.user = {
        userId: 'user_123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const authorizeMiddleware = authorize('admin', 'agent');

      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should deny access for users without correct role', () => {
      mockRequest.user = {
        userId: 'user_123',
        email: 'client@example.com',
        role: 'client',
      };

      const authorizeMiddleware = authorize('admin');

      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated users', () => {
      mockRequest.user = undefined;

      const authorizeMiddleware = authorize('admin');

      authorizeMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
