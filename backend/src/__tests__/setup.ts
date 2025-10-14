/**
 * Test Setup and Configuration
 * Global setup for all Jest tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long-for-security';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters-long-different-from-access';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Set longer timeout for async operations
jest.setTimeout(10000);

export {};
