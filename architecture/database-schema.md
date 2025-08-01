# 🗄️ Database Schema & Optimization Plan
## Digital Docs Platform - ROI Systems POC

### Schema Overview
Multi-database architecture optimized for the Digital Docs platform's three core workflows. Designed for ACID compliance, horizontal scaling, and sub-200ms query performance.

### Database Strategy
- **Primary DB**: PostgreSQL 15+ (ACID compliance, complex queries)
- **Cache Layer**: Redis 7+ (sessions, search cache, real-time data)
- **Search Engine**: Elasticsearch 8+ (full-text search, analytics)
- **Analytics DB**: ClickHouse (time-series data, business intelligence)

---

## 📊 PostgreSQL Primary Database

### Core Tables

#### Users & Authentication
```sql
-- Core user authentication and profile data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-factor authentication tokens
CREATE TABLE mfa_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type mfa_type NOT NULL, -- 'email', 'sms', 'totp'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth connections (Google, Microsoft, etc.)
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'facebook'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);
```

#### Agencies & Teams
```sql
-- Real estate agencies/brokerages
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    address JSONB, -- Structured address data
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    branding_config JSONB, -- Colors, fonts, etc.
    subscription_tier subscription_tier DEFAULT 'basic',
    subscription_status subscription_status DEFAULT 'active',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Agency relationships with roles
CREATE TABLE agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role agency_role NOT NULL, -- 'owner', 'admin', 'agent', 'assistant'
    permissions JSONB DEFAULT '[]', -- Specific permissions array
    status member_status DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agency_id)
);

-- Teams within agencies
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);
```

#### Document Management
```sql
-- Core document metadata
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_id UUID, -- Links to transaction/deal
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 for deduplication
    storage_path TEXT NOT NULL,
    
    -- Document classification (AI-generated)
    document_type document_type, -- 'contract', 'disclosure', 'inspection', etc.
    category VARCHAR(100),
    confidence_score DECIMAL(5,4), -- AI classification confidence
    
    -- Content extraction (OCR + AI)
    extracted_text TEXT,
    extracted_data JSONB, -- Names, dates, amounts, etc.
    
    -- Access control
    visibility document_visibility DEFAULT 'private',
    access_permissions JSONB DEFAULT '{}',
    
    -- Metadata
    title VARCHAR(500),
    description TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Status and tracking
    status document_status DEFAULT 'processing',
    processing_errors JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(extracted_text, '')), 'C')
    ) STORED
);

-- Document versions for version control
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    changes_summary TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- Document sharing and access logs
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shared_with_email VARCHAR(255),
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_type share_access_type DEFAULT 'view', -- 'view', 'download', 'comment'
    share_token VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- Optional password protection
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document access audit log
CREATE TABLE document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    share_id UUID REFERENCES document_shares(id) ON DELETE SET NULL,
    action access_action NOT NULL, -- 'view', 'download', 'upload', 'share', 'delete'
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions & Deals
```sql
-- Real estate transactions/deals
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Basic transaction info
    transaction_number VARCHAR(100),
    transaction_type transaction_type NOT NULL, -- 'sale', 'purchase', 'lease', 'refinance'
    status transaction_status DEFAULT 'active',
    
    -- Property information
    property_address JSONB NOT NULL,
    property_type property_type, -- 'residential', 'commercial', 'land'
    property_details JSONB, -- Bedrooms, bathrooms, sq ft, etc.
    
    -- Financial details
    list_price DECIMAL(12,2),
    sale_price DECIMAL(12,2),
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(12,2),
    
    -- Parties involved
    listing_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    selling_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_contact_info JSONB, -- Buyer/seller information
    
    -- Important dates
    listing_date DATE,
    contract_date DATE,
    closing_date DATE,
    possession_date DATE,
    
    -- Custom fields and notes
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link documents to transactions
CREATE TABLE transaction_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_role VARCHAR(100), -- 'contract', 'disclosure', 'inspection', etc.
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id, document_id)
);
```

#### Email Campaigns & Marketing
```sql
-- Email campaign templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE, -- NULL for system templates
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type template_type NOT NULL, -- 'anniversary', 'market_update', 'holiday', etc.
    subject_line VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]', -- Available template variables
    is_system_template BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email campaigns
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Campaign details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    campaign_type campaign_type NOT NULL,
    
    -- Content
    subject_line VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Targeting and personalization
    target_criteria JSONB, -- Audience selection criteria
    personalization_config JSONB, -- ML personalization settings
    
    -- Scheduling
    status campaign_status DEFAULT 'draft',
    send_type send_type DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    recurring_config JSONB, -- For recurring campaigns
    
    -- Performance tracking
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Individual email sends
CREATE TABLE email_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Personalized content
    personalized_subject VARCHAR(500),
    personalized_content TEXT,
    
    -- Delivery tracking
    status send_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    last_opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email link click tracking
CREATE TABLE email_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    send_id UUID NOT NULL REFERENCES email_sends(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);
```

#### Alerts & Notifications
```sql
-- Alert configurations for users
CREATE TABLE alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Alert settings
    name VARCHAR(255) NOT NULL,
    alert_type alert_type NOT NULL, -- 'property', 'market', 'client_activity', 'business'
    
    -- Criteria and filters
    criteria JSONB NOT NULL, -- Search criteria, price ranges, locations, etc.
    filters JSONB DEFAULT '{}',
    
    -- Delivery preferences
    delivery_channels JSONB DEFAULT '["email"]', -- email, sms, push, in_app
    frequency alert_frequency DEFAULT 'immediate', -- immediate, daily, weekly
    quiet_hours JSONB, -- Time ranges to avoid sending
    
    -- ML optimization
    ml_optimization_enabled BOOLEAN DEFAULT TRUE,
    personalization_score DECIMAL(5,4),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert instances (actual alerts sent)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES alert_configs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert content
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    alert_data JSONB, -- Structured data (property details, etc.)
    
    -- Relevance scoring
    relevance_score DECIMAL(5,4),
    urgency_level urgency_level DEFAULT 'normal',
    
    -- Delivery tracking
    delivery_channels JSONB NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Engagement tracking
    viewed_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_type VARCHAR(50), -- 'interested', 'not_interested', 'contact_me'
    
    -- Conversion tracking
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(12,2),
    conversion_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert responses and interactions
CREATE TABLE alert_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    response_type response_type NOT NULL,
    response_data JSONB,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Custom Types (ENUMs)
```sql
-- User and authentication types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
CREATE TYPE mfa_type AS ENUM ('email', 'sms', 'totp', 'backup_code');

-- Agency and subscription types
CREATE TYPE subscription_tier AS ENUM ('basic', 'professional', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'suspended');
CREATE TYPE agency_role AS ENUM ('owner', 'admin', 'agent', 'assistant', 'viewer');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE team_role AS ENUM ('lead', 'member');

-- Document types
CREATE TYPE document_type AS ENUM (
    'contract', 'disclosure', 'inspection', 'appraisal', 'title',
    'insurance', 'loan', 'listing', 'offer', 'counteroffer',
    'amendment', 'addendum', 'closing', 'deed', 'other'
);
CREATE TYPE document_visibility AS ENUM ('private', 'team', 'agency', 'public');
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'error', 'archived');
CREATE TYPE share_access_type AS ENUM ('view', 'download', 'comment');
CREATE TYPE access_action AS ENUM ('view', 'download', 'upload', 'share', 'delete', 'edit');

-- Transaction types
CREATE TYPE transaction_type AS ENUM ('sale', 'purchase', 'lease', 'refinance', 'rental');
CREATE TYPE transaction_status AS ENUM ('active', 'pending', 'closed', 'cancelled');
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'multi_family', 'condo');

-- Campaign and marketing types
CREATE TYPE template_type AS ENUM (
    'anniversary', 'market_update', 'holiday', 'birthday',
    'tax_reminder', 'maintenance', 'newsletter', 'custom'
);
CREATE TYPE campaign_type AS ENUM ('one_time', 'recurring', 'drip', 'triggered');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');
CREATE TYPE send_type AS ENUM ('immediate', 'scheduled', 'recurring');
CREATE TYPE send_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- Alert types
CREATE TYPE alert_type AS ENUM ('property', 'market', 'client_activity', 'business', 'system');
CREATE TYPE alert_frequency AS ENUM ('immediate', 'daily', 'weekly', 'monthly');
CREATE TYPE urgency_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE response_type AS ENUM ('interested', 'not_interested', 'contact_me', 'schedule_showing', 'dismissed');
```

---

## 📈 Indexes & Performance Optimization

### Primary Indexes
```sql
-- Users and authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status_active ON users(status) WHERE status = 'active';
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_mfa_tokens_user_expires ON mfa_tokens(user_id, expires_at);

-- Agency and teams
CREATE INDEX idx_agency_members_user_id ON agency_members(user_id);
CREATE INDEX idx_agency_members_agency_id ON agency_members(agency_id);
CREATE INDEX idx_agency_members_role ON agency_members(role);
CREATE INDEX idx_team_members_team_user ON team_members(team_id, user_id);

-- Documents (critical for performance)
CREATE INDEX idx_documents_agency_id ON documents(agency_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_transaction_id ON documents(transaction_id);
CREATE INDEX idx_documents_type_category ON documents(document_type, category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_file_hash ON documents(file_hash); -- Deduplication

-- Document versions and sharing
CREATE INDEX idx_document_versions_doc_id ON document_versions(document_id);
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_token ON document_shares(share_token);
CREATE INDEX idx_document_shares_expires ON document_shares(expires_at);
CREATE INDEX idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_created_at ON document_access_logs(created_at DESC);

-- Transactions
CREATE INDEX idx_transactions_agency_id ON transactions(agency_id);
CREATE INDEX idx_transactions_listing_agent ON transactions(listing_agent_id);
CREATE INDEX idx_transactions_selling_agent ON transactions(selling_agent_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_dates ON transactions(closing_date, created_at);
CREATE INDEX idx_transaction_documents_transaction ON transaction_documents(transaction_id);

-- Email campaigns
CREATE INDEX idx_email_campaigns_agency_id ON email_campaigns(agency_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX idx_email_sends_recipient ON email_sends(recipient_email);
CREATE INDEX idx_email_sends_status ON email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON email_sends(sent_at DESC);

-- Alerts
CREATE INDEX idx_alert_configs_user_id ON alert_configs(user_id);
CREATE INDEX idx_alert_configs_active ON alert_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_alerts_config_id ON alerts(config_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_sent_at ON alerts(sent_at DESC);
CREATE INDEX idx_alerts_viewed ON alerts(viewed_at) WHERE viewed_at IS NOT NULL;
```

### Composite Indexes for Complex Queries
```sql
-- Document search optimization
CREATE INDEX idx_documents_agency_status_type ON documents(agency_id, status, document_type);
CREATE INDEX idx_documents_user_created ON documents(uploaded_by, created_at DESC);
CREATE INDEX idx_documents_transaction_type ON documents(transaction_id, document_type);

-- Email performance tracking
CREATE INDEX idx_email_sends_campaign_status ON email_sends(campaign_id, status);
CREATE INDEX idx_email_sends_delivered_opened ON email_sends(delivered_at, opened_at);

-- Alert effectiveness
CREATE INDEX idx_alerts_config_sent_viewed ON alerts(config_id, sent_at, viewed_at);
CREATE INDEX idx_alerts_user_responded ON alerts(user_id, responded_at) WHERE responded_at IS NOT NULL;
```

### Partial Indexes for Efficiency
```sql
-- Only index active/relevant records
CREATE INDEX idx_users_active_email ON users(email) WHERE status = 'active';
CREATE INDEX idx_documents_ready ON documents(agency_id, created_at) WHERE status = 'ready';
CREATE INDEX idx_campaigns_active ON email_campaigns(agency_id, scheduled_at) WHERE status IN ('scheduled', 'sending');
CREATE INDEX idx_alerts_unviewed ON alerts(user_id, sent_at) WHERE viewed_at IS NULL;
```

---

## 🔄 Redis Cache Strategy

### Cache Patterns
```yaml
User Sessions:
  Key Pattern: "session:{user_id}:{session_id}"
  TTL: 86400 (24 hours)
  Data: JWT payload, permissions, preferences

Document Metadata:
  Key Pattern: "doc:{document_id}"
  TTL: 3600 (1 hour)
  Data: Document metadata without file content

Search Results:
  Key Pattern: "search:{hash_of_query}"
  TTL: 300 (5 minutes)
  Data: Search results with pagination

Agency Settings:
  Key Pattern: "agency:{agency_id}:settings"
  TTL: 1800 (30 minutes)
  Data: Branding, configuration, subscription info

Email Templates:
  Key Pattern: "template:{template_id}"
  TTL: 3600 (1 hour)
  Data: Compiled template with variables

Alert Configurations:
  Key Pattern: "alerts:{user_id}"
  TTL: 1800 (30 minutes)
  Data: Active alert configurations
```

### Cache Invalidation
```sql
-- Trigger functions for cache invalidation
CREATE OR REPLACE FUNCTION invalidate_user_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Invalidate user session cache on user updates
    PERFORM pg_notify('cache_invalidate', 'user:' || NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_cache_invalidation
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_user_cache();
```

---

## 🔍 Elasticsearch Search Index

### Document Index Mapping
```json
{
  "mappings": {
    "properties": {
      "id": {"type": "keyword"},
      "agency_id": {"type": "keyword"},
      "title": {
        "type": "text",
        "analyzer": "standard",
        "boost": 2.0
      },
      "extracted_text": {
        "type": "text",
        "analyzer": "standard"
      },
      "document_type": {"type": "keyword"},
      "category": {"type": "keyword"},
      "tags": {"type": "keyword"},
      "filename": {
        "type": "text",
        "analyzer": "filename_analyzer"
      },
      "created_at": {"type": "date"},
      "updated_at": {"type": "date"},
      "file_size": {"type": "long"},
      "extracted_data": {
        "type": "object",
        "properties": {
          "names": {"type": "keyword"},
          "dates": {"type": "date"},
          "amounts": {"type": "scaled_float", "scaling_factor": 100}
        }
      }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "filename_analyzer": {
          "tokenizer": "keyword",
          "filters": ["lowercase", "pattern_replace"]
        }
      }
    }
  }
}
```

---

## 📊 ClickHouse Analytics Schema

### Event Tracking Tables
```sql
-- User activity events
CREATE TABLE user_events (
    timestamp DateTime64(3),
    user_id UUID,
    agency_id UUID,
    event_type LowCardinality(String),
    event_data String, -- JSON
    session_id String,
    ip_address IPv4,
    user_agent String,
    INDEX idx_user_time (user_id, timestamp),
    INDEX idx_agency_time (agency_id, timestamp),
    INDEX idx_event_type (event_type)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, user_id);

-- Document access analytics
CREATE TABLE document_analytics (
    timestamp DateTime64(3),
    document_id UUID,
    user_id UUID,
    agency_id UUID,
    action LowCardinality(String),
    duration UInt32, -- seconds spent
    success Bool,
    INDEX idx_doc_time (document_id, timestamp),
    INDEX idx_user_time (user_id, timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, document_id);

-- Email campaign analytics
CREATE TABLE email_analytics (
    timestamp DateTime64(3),
    campaign_id UUID,
    send_id UUID,
    agency_id UUID,
    event_type LowCardinality(String), -- sent, delivered, opened, clicked
    recipient_email String,
    INDEX idx_campaign_time (campaign_id, timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (timestamp, campaign_id);
```

---

## 🚀 Performance Optimization Plan

### Query Optimization Targets
```yaml
Response Time Targets:
  - User authentication: <100ms
  - Document retrieval: <200ms
  - Search queries: <500ms
  - Dashboard loads: <1s
  - Report generation: <5s

Throughput Targets:
  - Concurrent reads: 10K/second
  - Concurrent writes: 1K/second
  - Document uploads: 100/second
  - Search queries: 500/second
```

### Database Optimization Strategies
```sql
-- Connection pooling configuration
-- PgBouncer config for connection management
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 10
max_db_connections = 30

-- Query optimization settings
SET work_mem = '256MB';
SET maintenance_work_mem = '1GB';
SET effective_cache_size = '12GB';
SET random_page_cost = 1.1; -- SSD optimization
SET seq_page_cost = 1.0;

-- Write optimization
SET checkpoint_completion_target = 0.9;
SET wal_buffers = '16MB';
SET max_wal_size = '4GB';
```

### Scaling Strategy
```yaml
Read Scaling:
  - Read replicas for read-heavy operations
  - Query routing based on operation type
  - Connection pooling with PgBouncer
  - Redis cache for frequently accessed data

Write Scaling:
  - Partition large tables by agency_id or date
  - Async processing for heavy operations
  - Bulk operations for batch updates
  - Write-through caching for hot data

Monitoring:
  - Query performance tracking
  - Index usage analysis
  - Connection pool monitoring
  - Cache hit rate optimization
```

---

## 🔄 Data Migration & Seeding

### Initial Data Setup
```sql
-- Create system agency for templates and defaults
INSERT INTO agencies (id, name, subscription_tier, subscription_status) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'ROI Systems',
    'enterprise',
    'active'
);

-- System email templates
INSERT INTO email_templates (
    agency_id, name, template_type, subject_line, 
    html_content, is_system_template, is_active
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    'Transaction Anniversary',
    'anniversary',
    'Happy Anniversary - Your {{property_address}} Transaction!',
    '<html>...</html>',
    TRUE,
    TRUE
);

-- Default alert configurations
-- Will be created per user on registration
```

### Performance Testing Data
```sql
-- Generate test data for performance testing
-- (Script to create realistic test dataset)
-- - 1000 agencies
-- - 10,000 users
-- - 100,000 documents
-- - 1,000,000 audit log entries
-- - 50,000 email sends
-- - 10,000 alerts
```

---

## 📋 Implementation Timeline

### Phase 1: Core Schema (Week 2)
1. **Users & Authentication** - Foundation tables
2. **Agencies & Teams** - Multi-tenancy structure
3. **Documents** - Core document management
4. **Basic Indexes** - Essential performance indexes

### Phase 2: Business Logic (Week 3-4)
1. **Transactions** - Real estate deal tracking
2. **Email Campaigns** - Marketing automation tables
3. **Alert System** - Notification infrastructure
4. **Advanced Indexes** - Performance optimization

### Phase 3: Analytics & Optimization (Week 5-6)
1. **ClickHouse Setup** - Analytics database
2. **Elasticsearch Config** - Search optimization
3. **Redis Caching** - Performance layer
4. **Monitoring Setup** - Performance tracking

### Phase 4: Production Readiness (Week 7-8)
1. **Security Hardening** - Row-level security, encryption
2. **Backup Strategy** - Point-in-time recovery
3. **Scaling Configuration** - Read replicas, partitioning
4. **Load Testing** - Performance validation

---

**Database Schema By**: Database Architecture Team  
**Reviewed By**: Backend Team, DevOps Team, Security Team  
**Last Updated**: Week 2, Day 2  
**Next Review**: End of Week 2

*Note: Schema will be refined based on development progress and performance testing results.*