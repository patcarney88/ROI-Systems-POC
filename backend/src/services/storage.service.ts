/**
 * File Storage Service
 * Supports both AWS S3 and MinIO (S3-compatible)
 * Team Bravo: File Storage Integration
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '../utils/logger';
import crypto from 'crypto';
import path from 'path';

const logger = createLogger('storage-service');

// Storage configuration
const STORAGE_CONFIG = {
  endpoint: process.env.S3_ENDPOINT || undefined, // For MinIO
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
};

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'roi-systems-documents';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Initialize S3 client
const s3Client = new S3Client(STORAGE_CONFIG);

export interface UploadOptions {
  userId: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  etag: string;
}

/**
 * Generate a unique file key
 */
function generateFileKey(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const sanitizedName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9-_]/g, '_');
  
  return `users/${userId}/${timestamp}-${randomString}-${sanitizedName}${extension}`;
}

/**
 * Validate file before upload
 */
function validateFile(mimeType: string, size: number): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`File type ${mimeType} is not allowed`);
  }
  
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size ${size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }
}

/**
 * Upload file to S3/MinIO
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { userId, originalName, mimeType, buffer, metadata = {} } = options;
  
  try {
    // Validate file
    validateFile(mimeType, buffer.length);
    
    // Generate unique key
    const key = generateFileKey(userId, originalName);
    
    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        ...metadata,
        originalName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Upload to S3/MinIO
    const response = await s3Client.send(command);
    
    logger.info(`File uploaded successfully: ${key}`, { userId, size: buffer.length });
    
    // Generate URL (for MinIO, use endpoint; for S3, use standard URL)
    const url = STORAGE_CONFIG.endpoint
      ? `${STORAGE_CONFIG.endpoint}/${BUCKET_NAME}/${key}`
      : `https://${BUCKET_NAME}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${key}`;
    
    return {
      key,
      url,
      size: buffer.length,
      etag: response.ETag || ''
    };
  } catch (error) {
    logger.error('File upload failed:', error);
    throw error;
  }
}

/**
 * Get signed URL for temporary file access
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info(`Generated signed URL for: ${key}`, { expiresIn });
    
    return url;
  } catch (error) {
    logger.error('Failed to generate signed URL:', error);
    throw error;
  }
}

/**
 * Delete file from S3/MinIO
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(command);
    
    logger.info(`File deleted successfully: ${key}`);
  } catch (error) {
    logger.error('File deletion failed:', error);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string): Promise<Record<string, any>> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
      metadata: response.Metadata
    };
  } catch (error) {
    logger.error('Failed to get file metadata:', error);
    throw error;
  }
}

/**
 * Create versioned copy of file
 */
export async function createVersion(originalKey: string, userId: string): Promise<string> {
  try {
    // Get original file
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey
    });
    
    const { Body, ContentType, Metadata } = await s3Client.send(getCommand);
    
    if (!Body) {
      throw new Error('File body is empty');
    }
    
    // Generate version key
    const versionKey = originalKey.replace(/(\.[^.]+)$/, `-v${Date.now()}$1`);
    
    // Upload version
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: versionKey,
      Body: Body as any,
      ContentType,
      Metadata: {
        ...Metadata,
        isVersion: 'true',
        originalKey,
        versionedAt: new Date().toISOString(),
        versionedBy: userId
      }
    });
    
    await s3Client.send(putCommand);
    
    logger.info(`Created version: ${versionKey} from ${originalKey}`);
    
    return versionKey;
  } catch (error) {
    logger.error('Failed to create file version:', error);
    throw error;
  }
}

export default {
  uploadFile,
  getSignedDownloadUrl,
  deleteFile,
  fileExists,
  getFileMetadata,
  createVersion
};
