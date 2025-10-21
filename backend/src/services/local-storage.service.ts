/**
 * Local Filesystem Storage Service
 * Alternative to S3 for development and small deployments
 * Team Echo: Backend Infrastructure
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';

const logger = createLogger('local-storage-service');

// Storage configuration
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

// Ensure upload directory exists
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info(`Created upload directory: ${UPLOAD_DIR}`);
  }
}

// Initialize storage on startup
ensureUploadDir().catch(console.error);

export interface StorageFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * Local Storage Service Class
 */
export class LocalStorageService {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = UPLOAD_DIR;
  }

  /**
   * Generate unique filename with timestamp and random string
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    // Sanitize filename
    const safeName = nameWithoutExt.replace(/[^a-z0-9_-]/gi, '_');

    return `${safeName}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * Upload file to local filesystem
   */
  async uploadFile(file: Express.Multer.File, options: UploadOptions = {}): Promise<StorageFile> {
    try {
      // Validate file size
      const maxSize = options.maxSize || MAX_FILE_SIZE;
      if (file.size > maxSize) {
        throw new AppError(413, 'FILE_TOO_LARGE',
          `File size ${file.size} exceeds maximum allowed size of ${maxSize} bytes`);
      }

      // Validate file type
      if (options.allowedTypes) {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        if (!options.allowedTypes.includes(ext)) {
          throw new AppError(400, 'INVALID_FILE_TYPE',
            `File type '${ext}' is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
        }
      }

      // Generate unique filename
      const uniqueFilename = this.generateUniqueFilename(file.originalname);

      // Determine target directory
      const targetDir = options.folder
        ? path.join(this.baseDir, options.folder)
        : this.baseDir;

      // Ensure target directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Full path for file
      const filePath = path.join(targetDir, uniqueFilename);

      // Move file from temp location to permanent location
      if (file.path) {
        await fs.rename(file.path, filePath);
      } else if (file.buffer) {
        // If file is in memory (buffer), write it to disk
        await fs.writeFile(filePath, file.buffer);
      } else {
        throw new AppError(500, 'FILE_PROCESSING_ERROR', 'No file data available');
      }

      // Generate public URL
      const relativePath = path.relative(this.baseDir, filePath);
      const fileUrl = this.generateFileUrl(relativePath);

      logger.info(`File uploaded successfully: ${uniqueFilename}`, {
        originalName: file.originalname,
        size: file.size,
        path: filePath
      });

      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: filePath,
        url: fileUrl
      };
    } catch (error: any) {
      logger.error('File upload failed', error);

      // Clean up file if it exists
      if (file.path) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          logger.error('Failed to clean up temp file', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Download file from storage
   */
  async downloadFile(fileUrl: string): Promise<DownloadResult> {
    try {
      // Extract relative path from URL
      const relativePath = this.extractRelativePath(fileUrl);
      const filePath = path.join(this.baseDir, relativePath);

      // Check if file exists
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new AppError(404, 'FILE_NOT_FOUND', 'Requested file not found');
      }

      // Get file info
      const filename = path.basename(filePath);
      const mimetype = this.getMimeType(filename);

      // Create read stream
      const stream = createReadStream(filePath);

      logger.info(`File download initiated: ${filename}`);

      return {
        stream,
        filename,
        mimetype,
        size: stats.size
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new AppError(404, 'FILE_NOT_FOUND', 'Requested file not found');
      }
      logger.error('File download failed', error);
      throw error;
    }
  }

  /**
   * Get file by path (for serving files)
   */
  async getFilePath(relativePath: string): Promise<string> {
    const filePath = path.join(this.baseDir, relativePath);

    // Security check - prevent path traversal
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(this.baseDir))) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied');
    }

    // Check if file exists
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    }

    return filePath;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract relative path from URL
      const relativePath = this.extractRelativePath(fileUrl);
      const filePath = path.join(this.baseDir, relativePath);

      // Check if file exists
      await fs.access(filePath);

      // Delete the file
      await fs.unlink(filePath);

      logger.info(`File deleted successfully: ${path.basename(filePath)}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it already deleted
        logger.warn(`File not found for deletion: ${fileUrl}`);
        return;
      }
      logger.error('File deletion failed', error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      const relativePath = this.extractRelativePath(fileUrl);
      const filePath = path.join(this.baseDir, relativePath);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(fileUrl: string): Promise<{ size: number; modifiedAt: Date }> {
    try {
      const relativePath = this.extractRelativePath(fileUrl);
      const filePath = path.join(this.baseDir, relativePath);
      const stats = await fs.stat(filePath);

      return {
        size: stats.size,
        modifiedAt: stats.mtime
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
      }
      throw error;
    }
  }

  /**
   * Generate public URL for file
   */
  private generateFileUrl(relativePath: string): string {
    // Normalize path separators for URL
    const urlPath = relativePath.replace(/\\/g, '/');
    return `${BASE_URL}/api/v1/documents/download/${encodeURIComponent(urlPath)}`;
  }

  /**
   * Extract relative path from URL
   */
  private extractRelativePath(fileUrl: string): string {
    // Handle both full URLs and relative paths
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const url = new URL(fileUrl);
      // Try different patterns
      let match = url.pathname.match(/\/api\/v1\/documents\/download\/(.+)$/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
      match = url.pathname.match(/\/uploads\/(.+)$/);
      if (match) {
        return match[1];
      }
    }

    // Handle relative paths
    if (fileUrl.startsWith('/uploads/')) {
      return fileUrl.slice(9); // Remove '/uploads/' prefix
    }

    // Handle paths starting with '/api/v1/documents/download/'
    if (fileUrl.startsWith('/api/v1/documents/download/')) {
      return decodeURIComponent(fileUrl.slice(28));
    }

    return fileUrl;
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.csv': 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Clean up old files (can be run as a scheduled job)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      // Recursively walk through upload directory
      const walkDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.mtime < cutoffDate) {
              await fs.unlink(fullPath);
              deletedCount++;
              logger.info(`Deleted old file: ${entry.name}`);
            }
          }
        }
      };

      await walkDir(this.baseDir);

      logger.info(`Cleanup completed: ${deletedCount} files deleted`);
      return deletedCount;
    } catch (error) {
      logger.error('Cleanup failed', error);
      throw error;
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

export default localStorageService;