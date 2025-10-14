# Document Intelligence - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Install Dependencies (2 min)

```bash
cd ml
pip install transformers torch nltk opencv-python Pillow pdf2image
```

### 2. Download Models (1 min)

```bash
python -c "from transformers import pipeline; pipeline('summarization', model='facebook/bart-large-cnn')"
```

### 3. Start ML Service (1 min)

```bash
cd ml
uvicorn src.api.prediction_api:app --host 0.0.0.0 --port 8000
```

### 4. Test Endpoint (1 min)

```bash
curl -X POST http://localhost:8000/v1/intelligence/health
```

✅ You're ready to use the Document Intelligence API!

---

## 📋 Common Use Cases

### Summarize a Document

```typescript
import { documentIntelligenceService } from './services/document-intelligence.service';

const summary = await documentIntelligenceService.generateSummary(
  documentId,
  fullText,
  'PURCHASE_AGREEMENT'
);

console.log(summary.executiveSummary);
console.log(summary.keyPoints);
```

### Detect Changes

```typescript
const changes = await documentIntelligenceService.detectChanges(
  documentId,
  oldText,
  newText
);

console.log(`${changes.changePercentage}% changed`);
console.log(`Significance: ${changes.significance}`);
```

### Check Compliance

```typescript
const compliance = await documentIntelligenceService.checkCompliance(
  documentId,
  'SETTLEMENT_STATEMENT',
  extractedData
);

if (compliance.overallStatus !== 'COMPLIANT') {
  console.log(`Issues: ${compliance.criticalIssues}`);
  console.log(`Missing: ${compliance.missingFields}`);
}
```

---

## 🔌 API Endpoints

| Endpoint | Purpose | Time |
|----------|---------|------|
| `POST /v1/intelligence/summarize` | Generate summary | ~1-2s |
| `POST /v1/intelligence/changes` | Detect changes | ~100ms |
| `POST /v1/intelligence/compliance` | Check compliance | ~50-200ms |
| `POST /v1/intelligence/analyze/full` | Complete analysis | ~2-3s |

---

## 📊 Database Models

```prisma
// Store AI summaries
DocumentSummary {
  executiveSummary
  detailedSummary
  keyPoints[]
  mainParties[]
  keyDates
  keyAmounts
}

// Track versions
DocumentVersion {
  versionNumber
  changeType
  changesSummary
  textDiff
  significance
}

// Store compliance results
ComplianceCheck {
  overallStatus
  checks[]
  criticalIssues
  missingFields[]
  requiresReview
}
```

---

## ⚡ Performance Tips

1. **Cache Results**: Store summaries in database
2. **Batch Processing**: Process multiple documents together
3. **Async Jobs**: Use background tasks for large documents
4. **Resource Monitoring**: Monitor ML service memory (2GB+ needed)

---

## 🛠️ Troubleshooting

### Model Won't Load
```bash
# Check transformers installation
pip install --upgrade transformers torch

# Test model loading
python -c "from transformers import pipeline; print(pipeline('summarization'))"
```

### PDF Processing Fails
```bash
# Install system dependencies
# macOS:
brew install poppler

# Ubuntu:
sudo apt-get install poppler-utils
```

### Slow Performance
- Reduce model size: Use `bart-base` instead of `bart-large`
- Enable GPU: Install `torch` with CUDA support
- Increase timeout: Set `timeout: 120000` in service config

---

## 📚 Full Documentation

For detailed information, see:
- `/ml/docs/DOCUMENT_INTELLIGENCE.md` - Complete guide
- `/DOCUMENT_INTELLIGENCE_IMPLEMENTATION.md` - Implementation details
- `http://localhost:8000/api/ml/docs` - API documentation

---

## ✅ Quick Checklist

- [ ] Python 3.9+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] ML models downloaded (~3GB)
- [ ] ML service running (port 8000)
- [ ] Health check passes
- [ ] Database migrations run
- [ ] Environment variables set

---

## 🎯 Next Steps

1. **Test Basic Features**: Try summarization, change detection
2. **Customize Rules**: Configure compliance rules for your documents
3. **Integrate Frontend**: Add UI components for intelligence features
4. **Monitor Performance**: Set up logging and metrics
5. **Deploy**: Follow deployment checklist in main documentation

---

## 💡 Pro Tips

- Always provide document category for better results
- Review AI summaries for accuracy in critical applications
- Use visual diff for scanned PDFs
- Store all compliance results for audit trails
- Monitor ML service resource usage

---

## 🚨 Critical PostgreSQL Requirement

**This system uses PostgreSQL EXCLUSIVELY**

- ❌ DO NOT use Supabase
- ❌ DO NOT use DynamoDB
- ✅ USE PostgreSQL (AWS RDS) for ALL operations

---

For questions or issues, refer to the troubleshooting section in the main documentation.
