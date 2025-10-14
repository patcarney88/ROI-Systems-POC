/**
 * Enhanced File Upload Middleware
 * Multer configuration with file validation and memory storage
 */

import multer from 'multer';
import { Request } from 'express';
import { AppError } from './error.middleware';
import { createLogger } from '../utils/logger';

const logger = createLogger('upload-middleware');

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * File filter function
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn(`Rejected file with invalid MIME type: ${file.mimetype}`);
    return callback(
      new AppError(400, 'INVALID_FILE_TYPE', `File type ${file.mimetype} is not allowed`)
    );
  }

  // Check file extension
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    logger.warn(`Rejected file with invalid extension: ${ext}`);
    return callback(
      new AppError(400, 'INVALID_FILE_EXTENSION', `File extension ${ext} is not allowed`)
    );
  }

  callback(null, true);
};

/**
 * Multer configuration for single file upload
 */
export const uploadSingle = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
}).single('file');

/**
 * Multer configuration for multiple file upload
 */
export const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files at once
  },
  fileFilter,
}).array('files', 10);

/**
 * Error handling middleware for multer errors
 */
export const handleMulterError = (
  error: any,
  req: Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded. Maximum is 10 files.',
        },
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNEXPECTED_FILE',
          message: 'Unexpected field name for file upload',
        },
      });
    }
  }

  next(error);
};

/**
 * Validate uploaded file
 */
export const validateUploadedFile = (req: Request, res: any, next: any) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file was uploaded',
      },
    });
  }

  next();
};
