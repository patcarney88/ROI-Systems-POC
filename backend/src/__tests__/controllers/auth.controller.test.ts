/**
 * Auth Controller Tests
 * Tests for authentication controller functions
 */

import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';
import * as jwt from '../../utils/jwt';
import bcrypt from 'bcryptjs';

// Mock the JWT utility
jest.mock('../../utils/jwt');
jest.mock('bcryptjs');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      body: {},
      user: undefined
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    // Clear any existing test users (in a real app, this would be database cleanup)
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'agent'
      };

      mockRequest.body = userData;

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue(mockTokens);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role
            }),
            tokens: mockTokens
          })
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        email: 'test@example.com'
        // Missing password, firstName, lastName
      };

      try {
        await authController.register(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'PlainTextPassword',
        firstName: 'Test',
        lastName: 'User'
      };

      mockRequest.body = userData;

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
    });

    // Note: JWT token generation is tested indirectly through successful registration test
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // First register a user
      const registerData = {
        email: 'logintest@example.com',
        password: 'SecurePass123!',
        firstName: 'Login',
        lastName: 'Test'
      };

      mockRequest.body = registerData;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Now try to login
      mockRequest.body = {
        email: registerData.email,
        password: registerData.password
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: registerData.email
            }),
            tokens: expect.any(Object)
          })
        })
      );
    });

    it('should return 400 if email or password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com'
        // Missing password
      };

      try {
        await authController.login(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return 401 for invalid email', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };

      try {
        await authController.login(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should return 401 for invalid password', async () => {
      // Register a user first
      const registerData = {
        email: 'passwordtest@example.com',
        password: 'CorrectPassword123!',
        firstName: 'Password',
        lastName: 'Test'
      };

      mockRequest.body = registerData;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Try to login with wrong password
      mockRequest.body = {
        email: registerData.email,
        password: 'WrongPassword123!'
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      try {
        await authController.login(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      // Register a user
      const registerData = {
        email: 'profile@example.com',
        password: 'SecurePass123!',
        firstName: 'Profile',
        lastName: 'Test'
      };

      mockRequest.body = registerData;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Get the userId from the response
      const registerResponse = jsonMock.mock.calls[0][0];
      const userId = registerResponse.data.user.id;

      // Mock authenticated request
      mockRequest.user = {
        userId,
        email: registerData.email,
        role: 'agent'
      };

      await authController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: registerData.email,
              firstName: registerData.firstName,
              lastName: registerData.lastName
            })
          })
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      try {
        await authController.getProfile(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      // Register a user
      const registerData = {
        email: 'update@example.com',
        password: 'SecurePass123!',
        firstName: 'Original',
        lastName: 'Name'
      };

      mockRequest.body = registerData;
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'token',
        refreshToken: 'refresh'
      });

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const registerResponse = jsonMock.mock.calls[0][0];
      const userId = registerResponse.data.user.id;

      // Update profile
      mockRequest.user = {
        userId,
        email: registerData.email,
        role: 'agent'
      };

      mockRequest.body = {
        firstName: 'Updated',
        lastName: 'NameNew'
      };

      await authController.updateProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              firstName: 'Updated',
              lastName: 'NameNew'
            })
          })
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      try {
        await authController.updateProfile(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockRequest.user = {
        userId: 'user_123',
        email: 'test@example.com',
        role: 'agent'
      };

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            message: 'Logged out successfully'
          })
        })
      );
    });
  });
});
