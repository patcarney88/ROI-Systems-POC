# 🗂️ ROI Systems Document Management System

## Overview

A comprehensive, enterprise-grade document management system for real estate closing platforms with advanced features including virus scanning, OCR, machine learning categorization, full-text search, and 10-year retention policy compliance.

## 🎯 Features

### Core Features
- ✅ **Secure Document Upload** - Single and bulk upload with 50MB file size limit
- ✅ **Virus Scanning** - ClamAV integration with file sanitization
- ✅ **OCR Processing** - AWS Textract for text extraction from documents
- ✅ **ML Categorization** - Automatic document classification into 8 categories
- ✅ **Full-Text Search** - Elasticsearch integration for advanced search
- ✅ **Document Versioning** - Complete version history with audit trail
- ✅ **10-Year Retention** - Automated S3 lifecycle policies
- ✅ **AES-256 Encryption** - End-to-end encryption at rest and in transit

### Document Categories
1. **Deed** - Property ownership transfer documents
2. **Mortgage/Deed of Trust** - Loan agreements and security instruments
3. **Title Policy** - Insurance policies protecting ownership
4. **Closing Statement (HUD-1/CD)** - Final settlement statements
5. **Property Survey** - Professional boundary surveys
6. **Home Inspection** - Property condition reports
7. **Insurance Documents** - Property and liability policies
8. **Tax Documents** - Property tax assessments and bills

### Security Features
- TLS 1.3 encryption in transit
- AES-256 encryption at rest (AWS S3)
- Presigned URLs for secure temporary access
- File type validation and magic number detection
- Comprehensive audit logging
- Role-based access control (RBAC)

## 📋 Technical Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express 4.18 with TypeScript
- **Database**: PostgreSQL 15 with Prisma ORM
- **Storage**: AWS S3 with server-side encryption
- **Search**: Elasticsearch 9.x
- **OCR**: AWS Textract
- **Authentication**: JWT with bcrypt

### Libraries
- `@prisma/client` - Database ORM
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/client-textract` - OCR processing
- `@elastic/elasticsearch` - Full-text search
- `multer` - File upload handling
- `sharp` - Image processing
- `winston` - Logging

## 🚀 Getting Started

### Prerequisites
```bash
- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- AWS Account with S3 and Textract access
- Elasticsearch 9.x (optional, can be disabled)
```

### Installation

1. **Clone the repository**
```bash
cd backend
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up the database**
```bash
# Create PostgreSQL database
createdb roi_systems

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

4. **Configure AWS credentials**
```bash
# Option 1: Environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# Option 2: AWS CLI profile
aws configure
```

5. **Start Elasticsearch (optional)**
```bash
# Using Docker
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:9.1.1
```

6. **Run the server**
```bash
npm run dev
```

## 📡 API Endpoints

### Document Upload
```http
POST /api/v1/documents/upload
Content-Type: multipart/form-data

{
  "file": <binary>,
  "title": "Property Deed",
  "description": "Main residential property deed",
  "clientId": "uuid",
  "categoryId": "uuid"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "document": { ... },
    "processing": {
      "virusScan": "completed",
      "ocr": "COMPLETED",
      "categorization": "completed",
      "searchIndexing": "completed"
    }
  }
}
```

### Bulk Upload
```http
POST /api/v1/documents/upload/bulk
Content-Type: multipart/form-data

{
  "files": [<binary>, <binary>, ...],
  "clientId": "uuid",
  "categoryId": "uuid"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "successful": ["file1.pdf", "file2.pdf"],
    "failed": [
      { "filename": "file3.pdf", "error": "Virus detected" }
    ],
    "total": 3
  }
}
```

### Get Documents
```http
GET /api/v1/documents?page=1&limit=20&status=ACTIVE&categoryId=uuid

Response: 200 OK
{
  "success": true,
  "data": {
    "documents": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### Search Documents
```http
GET /api/v1/documents/search?q=mortgage&page=1&limit=20

Response: 200 OK
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "Mortgage Agreement",
        "snippet": "...highlighted text...",
        "score": 0.95,
        "category": "Mortgage/Deed of Trust",
        "highlights": ["<mark>mortgage</mark> agreement"]
      }
    ],
    "total": 12,
    "took": 45
  }
}
```

### Get Single Document
```http
GET /api/v1/documents/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "title": "Property Deed",
      "presignedUrl": "https://s3.amazonaws.com/...",
      "category": { ... },
      "versions": [ ... ]
    }
  }
}
```

### Update Document
```http
PUT /api/v1/documents/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "categoryId": "uuid"
}

Response: 200 OK
```

### Categorize Document
```http
PUT /api/v1/documents/:id/categorize
Content-Type: application/json

{
  "categoryId": "uuid"
}

Response: 200 OK
```

### Get Document Versions
```http
GET /api/v1/documents/:id/versions

Response: 200 OK
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 2,
        "versionLabel": "Updated",
        "changeDescription": "Added signatures",
        "createdAt": "2025-01-10T10:00:00Z"
      },
      {
        "version": 1,
        "versionLabel": "Original",
        "changeDescription": "Initial upload",
        "createdAt": "2025-01-09T10:00:00Z"
      }
    ]
  }
}
```

### Delete Document
```http
DELETE /api/v1/documents/:id

Response: 200 OK
{
  "success": true,
  "data": {
    "message": "Document deleted successfully"
  }
}
```

## 🗄️ Database Schema

### Key Tables
- `documents` - Main document metadata
- `document_versions` - Version history
- `document_access_logs` - Comprehensive audit trail
- `document_categories` - Classification taxonomy
- `users` - User accounts
- `clients` - Client records

### Relationships
```
User (1) -> (N) Documents
Client (1) -> (N) Documents
DocumentCategory (1) -> (N) Documents
Document (1) -> (N) DocumentVersions
Document (1) -> (N) DocumentAccessLogs
```

## 🔒 Security Best Practices

### File Upload Security
1. File type validation (MIME type + magic numbers)
2. File size limits (50MB maximum)
3. Virus scanning before storage
4. Automatic file sanitization

### Storage Security
1. Server-side AES-256 encryption
2. Presigned URLs with 1-hour expiration
3. Encryption key management via AWS KMS
4. S3 bucket policies and access controls

### Access Control
1. JWT authentication required for all endpoints
2. User-specific data isolation
3. Audit logging for all operations
4. IP tracking and rate limiting

## 📊 Monitoring & Logging

### Winston Logger
- Structured logging with log levels
- Separate log files (error.log, combined.log)
- Log rotation and archiving
- Request/response logging via Morgan

### Audit Trail
All document operations are logged:
- UPLOAD - Document uploaded
- VIEW - Document accessed
- DOWNLOAD - Document downloaded
- UPDATE - Metadata updated
- DELETE - Document deleted (soft delete)
- VIRUS_SCAN - Virus scan performed
- OCR_PROCESS - OCR extraction completed
- CLASSIFY - Document categorized

## 🧪 Testing

### Run Tests
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Test Coverage
- Virus scanning service tests
- S3 service tests
- OCR service tests
- Categorization service tests
- Search service tests
- API endpoint integration tests
- Security tests
- Performance tests

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables with production values
- [ ] Configure PostgreSQL with connection pooling
- [ ] Set up AWS S3 bucket with lifecycle policies
- [ ] Enable virus scanning (ClamAV or AWS)
- [ ] Configure Elasticsearch cluster
- [ ] Set up Redis for caching (optional)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domains
- [ ] Set up monitoring (CloudWatch, DataDog, etc.)
- [ ] Configure backup strategy
- [ ] Enable rate limiting
- [ ] Set up log aggregation

### AWS S3 Lifecycle Policy
```json
{
  "Rules": [
    {
      "Id": "10-year-retention",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 3650
      }
    }
  ]
}
```

## 📈 Performance Optimization

### Recommendations
1. **Database**: Use connection pooling (Prisma default)
2. **S3**: Enable transfer acceleration for large files
3. **Search**: Implement query result caching
4. **OCR**: Process asynchronously with job queues
5. **API**: Add Redis caching layer for frequently accessed documents

## 🤝 Contributing

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for consistent formatting
- Conventional commits for version control

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/your-org/roi-systems/issues)
- Email: support@roi-systems.com
- Documentation: [Full API docs](https://docs.roi-systems.com)

---

**Built with ❤️ by the ROI Systems Team**
