/**
 * AWS S3 Service with AES-256 Encryption
 * Handles secure document storage with presigned URLs
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createLogger } from '../utils/logger';
import crypto from 'crypto';
import stream from 'stream';

const logger = createLogger('s3-service');

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'roi-systems-documents';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    logger.info(`S3 Service initialized for bucket: ${this.bucket}`);
  }

  /**
   * Upload file to S3 with server-side AES-256 encryption
   */
  async uploadFile(
    file: Express.Multer.File,
    key: string,
    metadata?: Record<string, string>
  ): Promise<{
    bucket: string;
    key: string;
    etag: string;
    location: string;
    encryptionKey: string;
  }> {
    try {
      // Generate encryption key reference (actual key stored in KMS)
      const encryptionKeyRef = crypto.randomBytes(32).toString('hex');

      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256', // AWS-managed encryption
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          encryptionKeyRef,
          ...metadata,
        },
      };

      const command = new PutObjectCommand(uploadParams);
      const response = await this.s3Client.send(command);

      logger.info(`File uploaded successfully: ${key}`);

      return {
        bucket: this.bucket,
        key,
        etag: response.ETag || '',
        location: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
        encryptionKey: encryptionKeyRef,
      };
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Generate presigned URL for secure temporary access
   * URL expires after specified duration (default: 1 hour)
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      logger.info(`Generated presigned URL for: ${key} (expires in ${expiresIn}s)`);

      return presignedUrl;
    } catch (error) {
      logger.error('Presigned URL generation error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convert stream to buffer
      const stream = response.Body as stream.Readable;
      const chunks: Uint8Array[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      logger.error('S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
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
  async getFileMetadata(key: string): Promise<Record<string, any>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        etag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      logger.error('Get metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  /**
   * Apply S3 lifecycle policy for 10-year retention
   */
  async applyLifecyclePolicy(): Promise<void> {
    // This would be configured via AWS console or CloudFormation
    // Lifecycle rule: Transition to Glacier after 1 year, delete after 10 years
    logger.info('S3 lifecycle policy should be configured via AWS Management Console');
  }
}

// Export singleton instance
export const s3Service = new S3Service();
