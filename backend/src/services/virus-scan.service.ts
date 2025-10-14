/**
 * Virus Scanning Service
 * Uses ClamAV for file scanning or AWS-based scanning
 */

import { createLogger } from '../utils/logger';
import crypto from 'crypto';

const logger = createLogger('virus-scan');

export interface ScanResult {
  isClean: boolean;
  virus?: string;
  scannedAt: Date;
  scanDuration: number; // milliseconds
  fileHash: string;
}

export class VirusScanService {
  private scanningEnabled: boolean;

  constructor() {
    this.scanningEnabled = process.env.VIRUS_SCAN_ENABLED === 'true';

    if (this.scanningEnabled) {
      logger.info('Virus scanning enabled');
    } else {
      logger.warn('Virus scanning disabled - for development only');
    }
  }

  /**
   * Scan file for viruses
   * In production, this would integrate with ClamAV or AWS
   */
  async scanFile(fileBuffer: Buffer, filename: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      // Calculate file hash for tracking
      const fileHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // If scanning is disabled (development), return clean result
      if (!this.scanningEnabled) {
        logger.info(`Virus scan bypassed for: ${filename} (development mode)`);
        return {
          isClean: true,
          scannedAt: new Date(),
          scanDuration: Date.now() - startTime,
          fileHash,
        };
      }

      // Perform actual virus scanning
      // This would integrate with ClamAV daemon or AWS scanning service
      const scanResult = await this.performScan(fileBuffer, filename);

      const duration = Date.now() - startTime;

      if (scanResult.isClean) {
        logger.info(`File clean: ${filename} (${duration}ms)`);
      } else {
        logger.warn(`Virus detected in ${filename}: ${scanResult.virus}`);
      }

      return {
        ...scanResult,
        scanDuration: duration,
        fileHash,
      };
    } catch (error) {
      logger.error(`Virus scan error for ${filename}:`, error);
      throw new Error(`Virus scanning failed: ${error}`);
    }
  }

  /**
   * Perform actual virus scan
   * Placeholder for ClamAV or AWS integration
   */
  private async performScan(
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ isClean: boolean; virus?: string; scannedAt: Date }> {
    // In production, this would:
    // 1. Send file to ClamAV daemon: clamd.scan(fileBuffer)
    // 2. Or use AWS S3 antivirus scanning
    // 3. Or integrate with third-party API (VirusTotal, etc.)

    // For now, implement basic checks
    const maliciousPatterns = [
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR', // EICAR test signature
      // Add more patterns as needed
    ];

    const fileContent = fileBuffer.toString('utf-8', 0, Math.min(1024, fileBuffer.length));

    for (const pattern of maliciousPatterns) {
      if (fileContent.includes(pattern)) {
        return {
          isClean: false,
          virus: 'EICAR-Test-File',
          scannedAt: new Date(),
        };
      }
    }

    // Check file size (files >50MB might be suspicious)
    if (fileBuffer.length > 50 * 1024 * 1024) {
      logger.warn(`Large file detected: ${filename} (${fileBuffer.length} bytes)`);
    }

    return {
      isClean: true,
      scannedAt: new Date(),
    };
  }

  /**
   * Batch scan multiple files
   */
  async scanFiles(
    files: { buffer: Buffer; filename: string }[]
  ): Promise<Map<string, ScanResult>> {
    const results = new Map<string, ScanResult>();

    // Scan files in parallel
    const scanPromises = files.map(async (file) => {
      const result = await this.scanFile(file.buffer, file.filename);
      results.set(file.filename, result);
    });

    await Promise.all(scanPromises);

    return results;
  }

  /**
   * Check if file type is allowed
   */
  isFileTypeAllowed(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size (max 50MB)
   */
  isFileSizeValid(size: number): boolean {
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    return size <= maxSize;
  }

  /**
   * Get file type from buffer (magic number detection)
   */
  async detectFileType(buffer: Buffer): Promise<string> {
    // Check magic numbers
    const signatures: Record<string, string> = {
      '25504446': 'application/pdf', // PDF
      '504B0304': 'application/zip', // ZIP/DOCX
      'FFD8FFE0': 'image/jpeg', // JPEG
      'FFD8FFE1': 'image/jpeg', // JPEG
      '89504E47': 'image/png', // PNG
      '47494638': 'image/gif', // GIF
    };

    const hex = buffer.toString('hex', 0, 4).toUpperCase();

    for (const [signature, mimetype] of Object.entries(signatures)) {
      if (hex.startsWith(signature)) {
        return mimetype;
      }
    }

    return 'application/octet-stream';
  }
}

// Export singleton instance
export const virusScanService = new VirusScanService();
