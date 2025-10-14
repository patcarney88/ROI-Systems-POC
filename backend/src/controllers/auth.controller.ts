import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { User, UserRole, UserStatus } from '../models/User';

const logger = createLogger('auth-controller');

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role = UserRole.AGENT } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw new AppError(400, 'VALIDATION_ERROR', 'All fields are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError(409, 'USER_EXISTS', 'User with this email already exists');
  }

  // Create user (password will be hashed by the model hook)
  const newUser = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role as UserRole,
    status: UserStatus.ACTIVE
  });

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
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Check if user is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is not active');
  }

  // Verify password using model method
  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

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
  const user = await User.findByPk(payload.userId);
  if (!user) {
    throw new AppError(401, 'INVALID_TOKEN', 'User not found');
  }

  // Check if user is active
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is not active');
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

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }
  });

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
        status: user.status,
        lastLogin: user.lastLogin,
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

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Update user
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  await user.save();

  logger.info(`Profile updated for user: ${user.email}`);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
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
