import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-controller');

// Mock user database (replace with actual database in production)
const users: any[] = [];

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role = 'agent' } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw new AppError(400, 'VALIDATION_ERROR', 'All fields are required');
  }

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  users.push(newUser);

  // Generate tokens
  const tokens = generateTokens({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role
  });

  logger.info(`User registered successfully: ${email}`);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      },
      tokens
    }
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email and password are required');
  }

  // Find user
  const user = users.find(u => u.email === email);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  logger.info(`User logged in successfully: ${email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      tokens
    }
  });
});

/**
 * Refresh access token
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Refresh token is required');
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Find user
  const user = users.find(u => u.id === payload.userId);
  if (!user) {
    throw new AppError(401, 'INVALID_TOKEN', 'User not found');
  }

  // Generate new tokens
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  logger.info(`Token refreshed for user: ${user.email}`);

  res.json({
    success: true,
    data: { tokens }
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { firstName, lastName } = req.body;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Update user
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  user.updatedAt = new Date();

  logger.info(`Profile updated for user: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  });
});

/**
 * Logout user (client-side token removal)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});
