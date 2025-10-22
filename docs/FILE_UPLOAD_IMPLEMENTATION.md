# File Upload/Download Implementation Documentation

## Overview
This document describes the complete file upload and download system implementation for the ROI Systems POC. The system supports local filesystem storage with a clear upgrade path to AWS S3.

## Architecture

### Backend Components

#### 1. Storage Service (`/backend/src/services/local-storage.service.ts`)
- **Purpose**: Handles all file operations (upload, download, delete)
- **Features**:
  - Local filesystem storage
  - Unique filename generation to prevent collisions
  - MIME type detection
  - File size validation
  - Path traversal security
  - Cleanup of old files

#### 2. Document Controller (`/backend/src/controllers/document.controller.ts`)
- **Endpoints**:
  - `POST /api/v1/documents` - Upload document with metadata
  - `GET /api/v1/documents/:id/download` - Download document (authenticated)
  - `GET /api/v1/documents/download/*` - Serve files directly (public URLs)

#### 3. Upload Middleware (`/backend/src/middleware/upload.middleware.ts`)
- Uses `multer` for multipart/form-data handling
- File type validation (PDF, DOC, DOCX, JPG, JPEG, PNG)
- File size validation (default 10MB max)

### Frontend Components

#### 1. API Client (`/frontend/src/services/api.client.ts`)
- `uploadFile()` - Basic file upload
- `uploadFileWithProgress()` - Upload with progress tracking

#### 2. API Services (`/frontend/src/services/api.services.ts`)
- `documentApi.upload()` - Upload document with metadata
- `documentApi.download()` - Download document with proper filename handling

#### 3. UI Components
- **DocumentUploadModal** (`/frontend/src/modals/DocumentUploadModal.tsx`)
  - Drag-and-drop support
  - Multiple file selection
  - Upload progress tracking
  - Form validation with Zod
  - File type/size validation

- **HomeownerPortal** (`/frontend/src/pages/HomeownerPortal.tsx`)
  - Document download functionality
  - Notification integration

- **TitleAgentDashboard** (`/frontend/src/pages/TitleAgentDashboard.tsx`)
  - Drag-and-drop file upload
  - Bulk upload support

## Configuration

### Environment Variables

```env
# File Upload Configuration
MAX_FILE_SIZE=10485760              # 10MB in bytes
UPLOAD_DIR=./uploads                # Local storage directory
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,jpeg,png
STORAGE_TYPE=local                  # 'local' or 's3'
BASE_URL=http://localhost:3000      # Base URL for file downloads
```

## Usage Examples

### Backend - Upload File

```typescript
// In controller
const uploadResult = await localStorageService.uploadFile(req.file, {
  folder: `user_${userId}`,
  allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  maxSize: 10485760 // 10MB
});
```

### Frontend - Upload with Progress

```typescript
const response = await apiClient.uploadFileWithProgress(
  '/documents',
  file,
  {
    client: 'John Doe',
    title: 'Purchase Agreement',
    type: 'Purchase Agreement'
  },
  (progress) => {
    console.log(`Upload progress: ${progress}%`);
  }
);
```

### Frontend - Download Document

```typescript
try {
  await documentApi.download(documentId);
  // File will be downloaded automatically with correct filename
} catch (error) {
  console.error('Download failed:', error);
}
```

## File Storage Structure

```
uploads/
├── user_1/
│   ├── document_1734543210000_a3f2d8e9.pdf
│   ├── image_1734543220000_b4c1f7a2.jpg
│   └── ...
├── user_2/
│   └── ...
└── temp/
    └── ...
```

## Security Features

1. **File Type Validation**: Only allowed file types can be uploaded
2. **File Size Limits**: Configurable maximum file size
3. **Unique Filenames**: Prevents filename collisions and overwrites
4. **Path Traversal Protection**: Prevents access to files outside upload directory
5. **User Isolation**: Files organized by user ID
6. **Authentication**: Download endpoints require authentication

## Error Handling

### Backend Errors
- `400 INVALID_FILE_TYPE`: Unsupported file type
- `413 FILE_TOO_LARGE`: File exceeds size limit
- `404 FILE_NOT_FOUND`: File doesn't exist
- `500 FILE_PROCESSING_ERROR`: Server error during upload

### Frontend Error Handling
- Validation before upload
- User-friendly error notifications
- Automatic retry for network failures
- Progress tracking for large files

## Performance Considerations

1. **Streaming**: Files are streamed for downloads, not loaded into memory
2. **Progress Tracking**: Real-time upload progress for better UX
3. **Chunking**: Large files can be uploaded in chunks (future enhancement)
4. **Cleanup**: Automated cleanup of old files to manage disk space

## Upgrading to AWS S3

To upgrade from local storage to AWS S3:

1. **Update Environment Variables**:
```env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=roi-systems-documents
```

2. **Switch Storage Service**:
- The existing `storage.service.ts` already has S3 support
- Simply change import in document controller:
```typescript
// Change from:
import { localStorageService } from '../services/local-storage.service';
// To:
import { storageService } from '../services/storage.service';
```

3. **Migrate Existing Files**:
- Use AWS CLI or migration script to copy files from local to S3
- Update database file URLs to point to S3

## Testing

### Manual Testing
1. **Upload Test**:
   - Open HomeownerPortal or TitleAgentDashboard
   - Click "Upload Document" or drag files
   - Verify progress bar shows
   - Check file appears in uploads directory

2. **Download Test**:
   - Click download button on any document
   - Verify file downloads with correct name
   - Check file content is intact

### API Testing with cURL

```bash
# Upload file
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "client=John Doe" \
  -F "type=Purchase Agreement"

# Download file
curl -X GET http://localhost:3000/api/v1/documents/DOCUMENT_ID/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded_file.pdf
```

## Troubleshooting

### Common Issues

1. **"File too large" error**:
   - Check MAX_FILE_SIZE in .env
   - Verify client-side validation matches server

2. **"Upload directory not found"**:
   - Ensure UPLOAD_DIR exists and has write permissions
   - Check path in .env is correct

3. **Downloads fail with 404**:
   - Verify file exists in uploads directory
   - Check file URL in database matches actual path

4. **CORS errors on upload**:
   - Ensure CORS_ORIGINS includes frontend URL
   - Check multipart/form-data headers are set

## Future Enhancements

1. **Image Thumbnails**: Generate thumbnails for image uploads
2. **Virus Scanning**: Integrate ClamAV or similar for file scanning
3. **File Versioning**: Keep history of document updates
4. **Bulk Operations**: Download multiple files as ZIP
5. **Direct S3 Upload**: Upload directly from browser to S3
6. **OCR Processing**: Extract text from uploaded documents
7. **File Encryption**: Encrypt sensitive documents at rest

## Support

For issues or questions about the file upload/download system:
1. Check this documentation
2. Review error logs in `/backend/logs/`
3. Check browser console for frontend errors
4. Contact the development team

---

Last Updated: October 2024
Version: 1.0.0