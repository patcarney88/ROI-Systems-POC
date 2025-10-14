# Document Intelligence System

Comprehensive AI-powered document analysis system for real estate closing documents.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Document Intelligence System provides advanced AI-powered analysis capabilities for real estate closing documents:

- **Summarization**: Automatic extraction of key information and generation of executive summaries
- **Change Detection**: Text and visual comparison between document versions with significance assessment
- **Compliance Checking**: Automated validation against configurable rules for different document types
- **Relationship Detection**: Identification of relationships between related documents

## Features

### 1. Document Summarization

**Two-Method Approach**:
- **Extractive**: TF-IDF based key sentence extraction
- **Abstractive**: Transformer-based summary generation using BART

**Generated Outputs**:
- Executive summary (2-3 sentences)
- Detailed summary (1-2 paragraphs)
- Key points (bullet list)
- Main parties identification
- Key dates extraction
- Key amounts extraction
- Action items identification

**Use Cases**:
- Quick document review
- Email notifications with summaries
- Dashboard previews
- Audit trail documentation

### 2. Change Detection

**Text Diff Analysis**:
- Line-by-line comparison
- Semantic similarity matching for modifications
- Critical keyword detection
- Change significance assessment (CRITICAL/HIGH/MEDIUM/LOW)

**Visual Diff** (Optional):
- PDF page-by-page comparison
- Highlighted change regions
- Change percentage calculation
- Annotated output PDF

**Output**:
- Additions list
- Deletions list
- Modifications with similarity scores
- Change summary
- Formatted diff text
- Critical changes identification

### 3. Compliance Checking

**Validation Categories**:

#### Required Fields
- Verifies presence of mandatory fields
- Checks for non-empty values
- Supports nested field validation

#### Signatures
- Validates all required signatures present
- Checks signature types (buyer, seller, notary, etc.)
- Identifies missing signatures

#### Date Checks
- Closing date validation
- Date sequence verification
- Reasonable timeframe validation
- Expiration date checks

#### Amount Validation
- Loan-to-value ratio checks
- Fee reasonableness validation
- Earnest money percentage checks
- Debt-to-income ratio estimation

#### Format Validation
- Email format validation
- Phone number format checking
- SSN format verification
- Legal description completeness

**Supported Document Types**:
- Settlement Statement
- Purchase Agreement
- Loan Application
- Title Insurance
- Deed
- Disclosure Documents
- Inspection Reports
- Appraisals

### 4. Transaction Document Tracking

**Features**:
- Required document checklist by transaction type
- Completion percentage tracking
- Missing document identification
- Critical missing alerts
- Deadline tracking

**Transaction Types**:
- Purchase
- Sale
- Refinance
- HELOC
- Cash-out Refinance
- Reverse Mortgage

## Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│           Frontend (React/TypeScript)           │
└─────────────────┬───────────────────────────────┘
                  │
                  │ REST API
                  │
┌─────────────────▼───────────────────────────────┐
│      Backend API (Node.js/TypeScript)           │
│  ┌──────────────────────────────────────────┐   │
│  │  DocumentIntelligenceService             │   │
│  └──────────┬───────────────────────────────┘   │
└─────────────┼───────────────────────────────────┘
              │
              │ HTTP/JSON
              │
┌─────────────▼───────────────────────────────────┐
│        ML Service (Python/FastAPI)              │
│  ┌────────────────────────────────────────┐     │
│  │  Intelligence Router                   │     │
│  └──┬──────────┬───────────┬─────────────┘     │
│     │          │           │                     │
│  ┌──▼──┐  ┌───▼───┐  ┌───▼────┐               │
│  │Sum- │  │Change │  │Compli- │               │
│  │mari-│  │Detec- │  │ance    │               │
│  │zer  │  │tor    │  │Checker │               │
│  └─────┘  └───────┘  └────────┘               │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **Document Upload** → Backend receives document
2. **Text Extraction** → OCR/parsing extracts text
3. **Intelligence Request** → Backend calls ML service
4. **AI Processing** → ML models analyze content
5. **Result Storage** → Results saved to PostgreSQL
6. **User Notification** → User receives analysis results

## Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 14+
- 4GB+ RAM (for ML models)

### Python Dependencies

```bash
cd ml
pip install -r requirements.txt
```

**Core Dependencies**:
```txt
transformers>=4.30.0
torch>=2.0.0
nltk>=3.8.0
scikit-learn>=1.3.0
opencv-python>=4.8.0
Pillow>=10.0.0
pdf2image>=1.16.0
fastapi>=0.100.0
pydantic>=2.0.0
```

### ML Models

**Automatic Download**:
Models are downloaded automatically on first use.

**Manual Download** (Optional):
```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "facebook/bart-large-cnn"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
```

### Database Setup

```bash
# Navigate to backend
cd backend

# Add schema to main schema file or use Prisma's multi-schema
# Copy schema.document-intelligence.prisma contents to schema.prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_document_intelligence
```

## Usage

### TypeScript Integration

```typescript
import { documentIntelligenceService } from './services/document-intelligence.service';

// Generate summary
const summary = await documentIntelligenceService.generateSummary(
  documentId,
  fullText,
  'PURCHASE_AGREEMENT'
);

console.log(summary.executiveSummary);
console.log(summary.keyPoints);

// Detect changes
const changes = await documentIntelligenceService.detectChanges(
  documentId,
  oldText,
  newText
);

console.log(`${changes.changePercentage}% changed`);
console.log(`Significance: ${changes.significance}`);

// Check compliance
const compliance = await documentIntelligenceService.checkCompliance(
  documentId,
  'SETTLEMENT_STATEMENT',
  extractedData,
  'PURCHASE'
);

console.log(`Status: ${compliance.overallStatus}`);
console.log(`Critical issues: ${compliance.criticalIssues}`);

// Full analysis
const analysis = await documentIntelligenceService.runFullAnalysis(
  documentId,
  fullText,
  'PURCHASE_AGREEMENT',
  extractedData,
  previousText
);
```

### Python Direct Usage

```python
from ml.src.document_intelligence import (
    DocumentSummarizer,
    ChangeDetector,
    ComplianceChecker
)

# Summarization
summarizer = DocumentSummarizer()
summary = summarizer.generate_summary(
    text=document_text,
    category='PURCHASE_AGREEMENT'
)

print(summary['executive_summary'])
print(summary['key_points'])

# Change detection
detector = ChangeDetector()
changes = detector.detect_text_changes(
    old_text=original_text,
    new_text=updated_text
)

print(f"Changes: {changes['change_percentage']:.1f}%")
print(f"Significance: {changes['significance']}")

# Compliance checking
checker = ComplianceChecker()
result = checker.check_compliance(
    category='LOAN_APPLICATION',
    extracted_data=data,
    transaction_type='PURCHASE'
)

print(f"Status: {result['overall_status']}")
print(f"Missing fields: {result['missing_fields']}")
```

## API Reference

### Summarization Endpoint

**POST** `/v1/intelligence/summarize`

**Request**:
```json
{
  "text": "Full document text...",
  "category": "PURCHASE_AGREEMENT"
}
```

**Response**:
```json
{
  "executive_summary": "Brief 2-3 sentence summary",
  "detailed_summary": "1-2 paragraph summary",
  "key_points": ["Point 1", "Point 2"],
  "main_parties": ["John Doe", "Jane Smith"],
  "key_dates": {
    "closing_date": "2024-01-15",
    "inspection_deadline": "2023-12-20"
  },
  "key_amounts": {
    "purchase_price": "450000",
    "earnest_money": "5000"
  },
  "action_items": ["Complete inspection", "Submit financing"],
  "summary_method": "HYBRID",
  "word_count": 50,
  "original_word_count": 1500,
  "compression_ratio": 0.033,
  "confidence": 0.92,
  "processing_time": 1250
}
```

### Change Detection Endpoint

**POST** `/v1/intelligence/changes`

**Request**:
```json
{
  "old_text": "Original document text...",
  "new_text": "Updated document text...",
  "old_pdf_path": "/path/to/original.pdf",
  "new_pdf_path": "/path/to/updated.pdf"
}
```

**Response**:
```json
{
  "additions": ["Added line 1", "Added line 2"],
  "deletions": ["Deleted line 1"],
  "modifications": [
    {
      "old": "Original text",
      "new": "Updated text",
      "similarity": 0.85
    }
  ],
  "change_percentage": 12.5,
  "significance": "HIGH",
  "changes_summary": "Document updated with 2 additions, 1 deletion, 1 modification",
  "text_diff": "Formatted diff text...",
  "visual_diff_url": "/path/to/diff.pdf",
  "critical_changes": [
    {
      "type": "modification",
      "old_content": "Price: $400,000",
      "new_content": "Price: $450,000",
      "keywords": ["price"]
    }
  ]
}
```

### Compliance Check Endpoint

**POST** `/v1/intelligence/compliance`

**Request**:
```json
{
  "category": "SETTLEMENT_STATEMENT",
  "data": {
    "buyer_name": "John Doe",
    "seller_name": "Jane Smith",
    "property_address": "123 Main St",
    "sale_price": "450000",
    "closing_date": "2024-01-15",
    "signatures": [
      {"type": "buyer", "date": "2024-01-10"},
      {"type": "seller", "date": "2024-01-10"}
    ]
  },
  "transaction_type": "PURCHASE"
}
```

**Response**:
```json
{
  "overall_status": "NON_COMPLIANT",
  "checks": [
    {
      "check_name": "Required Fields",
      "check_type": "REQUIRED_FIELD",
      "status": "FAIL",
      "message": "Missing 1 required field: loan_amount",
      "severity": "CRITICAL"
    },
    {
      "check_name": "Signatures",
      "check_type": "SIGNATURE",
      "status": "FAIL",
      "message": "Missing 1 required signature: closing_agent",
      "severity": "CRITICAL"
    }
  ],
  "critical_issues": 2,
  "warnings": 0,
  "suggestions": 0,
  "missing_signatures": ["closing_agent"],
  "missing_fields": ["loan_amount"],
  "date_inconsistencies": [],
  "format_issues": [],
  "requires_review": true
}
```

## Database Schema

### Key Models

#### DocumentSummary
Stores AI-generated summaries with metadata.

```prisma
model DocumentSummary {
  id                String
  documentId        String
  executiveSummary  String
  detailedSummary   String
  keyPoints         String[]
  mainParties       String[]
  keyDates          Json
  keyAmounts        Json
  actionItems       String[]
  summaryMethod     SummaryMethod
  confidence        Float?
}
```

#### DocumentVersion
Tracks version history and changes.

```prisma
model DocumentVersion {
  id                String
  documentId        String
  versionNumber     Int
  changeType        ChangeType
  changesSummary    String
  textDiff          String?
  significance      SignificanceLevel
  previousVersionId String?
}
```

#### ComplianceCheck
Stores compliance validation results.

```prisma
model ComplianceCheck {
  id                String
  documentId        String
  overallStatus     ComplianceStatus
  checks            Json
  criticalIssues    Int
  warnings          Int
  missingSignatures String[]
  missingFields     String[]
  requiresReview    Boolean
}
```

## Best Practices

### Summarization

1. **Text Quality**: Ensure OCR text is clean before summarization
2. **Length**: Documents should be >100 words for meaningful summaries
3. **Category**: Always provide document category for better results
4. **Validation**: Review AI summaries for accuracy before relying on them

### Change Detection

1. **Version Control**: Always maintain previous versions for comparison
2. **Critical Changes**: Pay special attention to changes flagged as CRITICAL
3. **Visual Diff**: Use PDF visual diff for scanned documents
4. **Audit Trail**: Store all change detection results for compliance

### Compliance Checking

1. **Rule Configuration**: Customize rules for your organization's requirements
2. **Manual Review**: Always review documents flagged for compliance issues
3. **Updates**: Keep compliance rules updated with regulatory changes
4. **Validation**: Validate extracted data accuracy before compliance checks

### Performance

1. **Async Processing**: Use background jobs for large documents
2. **Caching**: Cache summarization results
3. **Batch Processing**: Process multiple documents in batches
4. **Resource Limits**: Monitor ML service memory and CPU usage

## Troubleshooting

### Common Issues

#### Summarization Model Not Loading

**Problem**: `Abstractive summarization model not loaded`

**Solution**:
```bash
# Ensure transformers and torch are installed
pip install transformers torch

# Test model loading
python -c "from transformers import pipeline; pipeline('summarization', model='facebook/bart-large-cnn')"
```

#### PDF Processing Fails

**Problem**: `pdf2image not available for visual diff`

**Solution**:
```bash
# Install pdf2image
pip install pdf2image

# Install poppler (system dependency)
# macOS:
brew install poppler

# Ubuntu:
sudo apt-get install poppler-utils
```

#### Compliance Check Failures

**Problem**: All documents showing as `NON_COMPLIANT`

**Solution**:
- Verify extracted data format matches expected structure
- Check required fields are using correct field names
- Review compliance rules configuration
- Enable debug logging to see detailed check results

#### Performance Issues

**Problem**: Slow summarization or timeouts

**Solution**:
- Use smaller model: `facebook/bart-base` instead of `bart-large-cnn`
- Enable GPU acceleration if available
- Chunk very large documents (>10,000 words)
- Increase API timeout values

### Debugging

Enable detailed logging:

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

View ML service logs:
```bash
tail -f /var/log/ml-service.log
```

Test individual components:
```python
# Test summarizer
from ml.src.document_intelligence import DocumentSummarizer
summarizer = DocumentSummarizer()
result = summarizer.generate_summary("Your test text here")
print(result)

# Test compliance
from ml.src.document_intelligence import ComplianceChecker
checker = ComplianceChecker()
result = checker.check_compliance('PURCHASE_AGREEMENT', your_data)
print(result)
```

## Support

For issues or questions:
1. Check this documentation
2. Review API logs
3. Test components individually
4. Contact development team with detailed error messages

## Changelog

### Version 1.0.0 (2024-10-14)
- Initial release
- Document summarization (extractive + abstractive)
- Change detection (text + visual)
- Compliance checking with configurable rules
- Transaction document tracking
- Complete API and TypeScript integration
