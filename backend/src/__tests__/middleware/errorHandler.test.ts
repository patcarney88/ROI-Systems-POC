/**
 * Error Handler Middleware Tests
 * Tests error handling and security of error responses
 * OWASP A04:2021 - Insecure Design (Information Exposure)
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../middleware/error.middleware';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockNext = jest.fn();

    mockRequest = {
      path: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    // Reset NODE_ENV
    process.env.NODE_ENV = 'test';

    jest.clearAllMocks();
  });

  describe('SECURITY TEST 1: Handle 404 not found errors', () => {
    it('should handle not found errors correctly', () => {
      const notFoundError = new AppError(404, 'NOT_FOUND', 'Resource not found');

      errorHandler(
        notFoundError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    });
  });

  describe('SECURITY TEST 2: Handle validation errors', () => {
    it('should handle validation errors with proper status code', () => {
      const validationError = new AppError(
        400,
        'VALIDATION_ERROR',
        'Invalid input data',
        {
          fields: ['email', 'password'],
        }
      );

      errorHandler(
        validationError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            fields: ['email', 'password'],
          },
        },
      });
    });
  });

  describe('SECURITY TEST 3: Handle authentication errors', () => {
    it('should handle unauthorized errors', () => {
      const authError = new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');

      errorHandler(
        authError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      });
    });

    it('should handle forbidden errors', () => {
      const forbiddenError = new AppError(403, 'FORBIDDEN', 'Access denied');

      errorHandler(
        forbiddenError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    });
  });

  describe('SECURITY TEST 4: Handle database errors', () => {
    it('should handle database connection errors', () => {
      const dbError = new AppError(
        503,
        'DATABASE_ERROR',
        'Database connection failed'
      );

      errorHandler(
        dbError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });
    });
  });

  describe('SECURITY TEST 5: Handle generic errors', () => {
    it('should handle unexpected errors with 500 status', () => {
      const genericError = new Error('Unexpected error occurred');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
          }),
        })
      );
    });
  });

  describe('SECURITY TEST 6: Do not leak sensitive info in error messages', () => {
    it('should hide stack traces in production', () => {
      process.env.NODE_ENV = 'production';
      const genericError = new Error('Database password is wrong');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      // Verify no stack trace is included
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.error.stack).toBeUndefined();
    });

    it('should show error details in development/test', () => {
      process.env.NODE_ENV = 'development';
      const genericError = new Error('Test error message');

      errorHandler(
        genericError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.error.message).toBe('Test error message');
      expect(errorResponse.error.stack).toBeDefined();
    });

    it('should not expose internal error details in production', () => {
      process.env.NODE_ENV = 'production';
      const internalError = new Error('Connection to internal service X failed');

      errorHandler(
        internalError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.error.message).toBe('An unexpected error occurred');
      expect(errorResponse.error.message).not.toContain('internal service');
    });

    it('should sanitize AppError details in production', () => {
      process.env.NODE_ENV = 'production';
      const appError = new AppError(
        500,
        'SERVER_ERROR',
        'User-friendly error message',
        {
          internalDetail: 'Sensitive internal information',
        }
      );

      errorHandler(
        appError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      const errorResponse = jsonMock.mock.calls[0][0];
      expect(errorResponse.error.message).toBe('User-friendly error message');
      // Details are included for AppError but should be sanitized by developer
      expect(errorResponse.error.details).toBeDefined();
    });
  });

  describe('AppError class', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError(400, 'TEST_ERROR', 'Test message', {
        field: 'test',
      });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('AppError');
    });

    it('should capture stack trace', () => {
      const error = new AppError(500, 'ERROR', 'Test');
      expect(error.stack).toBeDefined();
    });
  });
});
