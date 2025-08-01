# 🔌 RESTful API Specifications
## Digital Docs Platform - ROI Systems POC

### API Overview
Comprehensive REST API design for the Digital Docs platform, supporting the three core workflows with Claude AI integration. Built following OpenAPI 3.0 standards with consistent patterns, comprehensive error handling, and optimal performance.

### API Design Principles
- **RESTful Design**: Resource-based URLs with standard HTTP methods
- **Consistent Patterns**: Uniform naming, response formats, and error handling
- **Versioning Strategy**: URL-based versioning (v1, v2, etc.)
- **Security First**: JWT authentication, rate limiting, input validation
- **Performance Optimized**: Pagination, filtering, caching headers

---

## 🏗️ API Architecture

### Base URL Structure
```
Production:  https://api.roidocs.com/v1
Staging:     https://api-staging.roidocs.com/v1
Development: https://api-dev.roidocs.com/v1
```

### Common Patterns
```yaml
Resource URLs:
  - Collection: GET /v1/documents
  - Resource: GET /v1/documents/{id}
  - Nested: GET /v1/agencies/{agency_id}/users
  - Actions: POST /v1/documents/{id}/share

HTTP Methods:
  - GET: Retrieve resource(s)
  - POST: Create new resource
  - PUT: Update entire resource
  - PATCH: Partial resource update
  - DELETE: Remove resource

Status Codes:
  - 200: OK (successful GET, PUT, PATCH)
  - 201: Created (successful POST)
  - 204: No Content (successful DELETE)
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (authentication required)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (resource doesn't exist)
  - 409: Conflict (resource already exists)
  - 422: Unprocessable Entity (business logic error)
  - 429: Too Many Requests (rate limited)
  - 500: Internal Server Error (system error)
```

---

## 🔐 Authentication API

### OpenAPI Specification
```yaml
openapi: 3.0.3
info:
  title: ROI Systems Authentication API
  version: 1.0.0
  description: Authentication and user management for Digital Docs platform

paths:
  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: "agent@realestate.com"
                password:
                  type: string
                  minLength: 8
                  example: "SecurePass123!"
                remember_me:
                  type: boolean
                  default: false
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                    description: JWT access token (15 min expiry)
                  refresh_token:
                    type: string
                    description: Refresh token (7 days expiry)
                  user:
                    $ref: '#/components/schemas/User'
                  expires_at:
                    type: string
                    format: date-time
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

  /auth/refresh:
    post:
      summary: Refresh access token
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refresh_token]
              properties:
                refresh_token:
                  type: string
      responses:
        '200':
          description: Token refreshed
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  expires_at:
                    type: string
                    format: date-time

  /auth/mfa/enable:
    post:
      summary: Enable multi-factor authentication
      tags: [Authentication]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [method]
              properties:
                method:
                  type: string
                  enum: [totp, sms, email]
                phone_number:
                  type: string
                  description: Required for SMS method
      responses:
        '200':
          description: MFA setup initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  qr_code:
                    type: string
                    description: Base64 QR code for TOTP setup
                  backup_codes:
                    type: array
                    items:
                      type: string
                  secret:
                    type: string
                    description: Secret key for manual TOTP setup
```

---

## 📄 Document Management API

### Core Document Operations
```yaml
paths:
  /documents:
    get:
      summary: List documents
      tags: [Documents]
      security:
        - BearerAuth: []
      parameters:
        - name: agency_id
          in: query
          schema:
            type: string
            format: uuid
        - name: transaction_id
          in: query
          schema:
            type: string
            format: uuid
        - name: document_type
          in: query
          schema:
            type: string
            enum: [contract, disclosure, inspection, appraisal, title, insurance, loan]
        - name: search
          in: query
          description: Full-text search query
          schema:
            type: string
        - name: tags
          in: query
          description: Comma-separated tags
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: sort
          in: query
          schema:
            type: string
            enum: [created_at, updated_at, filename, file_size]
            default: created_at
        - name: order
          in: query
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: Documents retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Document'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
                  filters:
                    type: object
                    properties:
                      document_types:
                        type: array
                        items:
                          type: string
                      tags:
                        type: array
                        items:
                          type: string

    post:
      summary: Upload document
      tags: [Documents]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file:
                  type: string
                  format: binary
                  description: Document file (max 25MB)
                transaction_id:
                  type: string
                  format: uuid
                title:
                  type: string
                  maxLength: 500
                description:
                  type: string
                  maxLength: 2000
                tags:
                  type: array
                  items:
                    type: string
                custom_fields:
                  type: object
                  additionalProperties: true
      responses:
        '201':
          description: Document uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
        '400':
          description: Invalid file or request
        '413':
          description: File too large

  /documents/{id}:
    get:
      summary: Get document details
      tags: [Documents]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Document details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentDetailed'
        '404':
          $ref: '#/components/responses/NotFound'

    put:
      summary: Update document metadata
      tags: [Documents]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  maxLength: 500
                description:
                  type: string
                  maxLength: 2000
                tags:
                  type: array
                  items:
                    type: string
                custom_fields:
                  type: object
                  additionalProperties: true
      responses:
        '200':
          description: Document updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'

  /documents/{id}/download:
    get:
      summary: Download document file
      tags: [Documents]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: version
          in: query
          description: Specific version to download
          schema:
            type: integer
      responses:
        '200':
          description: File content
          content:
            application/octet-stream:
              schema:
                type: string
                format: binary
          headers:
            Content-Disposition:
              schema:
                type: string
            Content-Length:
              schema:
                type: integer
        '404':
          $ref: '#/components/responses/NotFound'

  /documents/{id}/share:
    post:
      summary: Share document with client
      tags: [Documents]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [shared_with_email, access_type]
              properties:
                shared_with_email:
                  type: string
                  format: email
                access_type:
                  type: string
                  enum: [view, download, comment]
                expires_at:
                  type: string
                  format: date-time
                password:
                  type: string
                  description: Optional password protection
                message:
                  type: string
                  description: Personal message to include
      responses:
        '201':
          description: Document shared successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  share_id:
                    type: string
                    format: uuid
                  share_url:
                    type: string
                    format: uri
                  expires_at:
                    type: string
                    format: date-time
```

### Claude AI Integration
```yaml
  /documents/{id}/analyze:
    post:
      summary: Analyze document with Claude AI
      tags: [Documents, AI]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                analysis_type:
                  type: string
                  enum: [categorize, extract_data, summarize, compliance_check]
                  default: categorize
                custom_prompt:
                  type: string
                  description: Custom analysis instructions
      responses:
        '200':
          description: Analysis completed
          content:
            application/json:
              schema:
                type: object
                properties:
                  analysis_id:
                    type: string
                    format: uuid
                  document_type:
                    type: string
                  confidence_score:
                    type: number
                    format: float
                    minimum: 0
                    maximum: 1
                  extracted_data:
                    type: object
                    properties:
                      names:
                        type: array
                        items:
                          type: string
                      dates:
                        type: array
                        items:
                          type: string
                          format: date
                      amounts:
                        type: array
                        items:
                          type: number
                  summary:
                    type: string
                  compliance_issues:
                    type: array
                    items:
                      type: object
                      properties:
                        issue:
                          type: string
                        severity:
                          type: string
                          enum: [low, medium, high, critical]
        '202':
          description: Analysis started (async processing)
          content:
            application/json:
              schema:
                type: object
                properties:
                  analysis_id:
                    type: string
                    format: uuid
                  status:
                    type: string
                    enum: [processing, completed, failed]
```

---

## 📧 Email Campaign API

### Campaign Management
```yaml
paths:
  /campaigns:
    get:
      summary: List email campaigns
      tags: [Campaigns]
      security:
        - BearerAuth: []
      parameters:
        - name: agency_id
          in: query
          schema:
            type: string
            format: uuid
        - name: status
          in: query
          schema:
            type: string
            enum: [draft, scheduled, sending, sent, paused, cancelled]
        - name: campaign_type
          in: query
          schema:
            type: string
            enum: [one_time, recurring, drip, triggered]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Campaigns retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Campaign'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create email campaign
      tags: [Campaigns]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, subject_line, html_content, campaign_type]
              properties:
                name:
                  type: string
                  maxLength: 255
                description:
                  type: string
                subject_line:
                  type: string
                  maxLength: 500
                html_content:
                  type: string
                text_content:
                  type: string
                campaign_type:
                  type: string
                  enum: [one_time, recurring, drip, triggered]
                template_id:
                  type: string
                  format: uuid
                target_criteria:
                  type: object
                  properties:
                    client_segments:
                      type: array
                      items:
                        type: string
                    transaction_types:
                      type: array
                      items:
                        type: string
                    date_ranges:
                      type: object
                      properties:
                        from:
                          type: string
                          format: date
                        to:
                          type: string
                          format: date
                send_type:
                  type: string
                  enum: [immediate, scheduled, recurring]
                scheduled_at:
                  type: string
                  format: date-time
                personalization_config:
                  type: object
                  properties:
                    use_ai_optimization:
                      type: boolean
                      default: true
                    send_time_optimization:
                      type: boolean
                      default: true
      responses:
        '201':
          description: Campaign created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Campaign'

  /campaigns/{id}/send:
    post:
      summary: Send or schedule campaign
      tags: [Campaigns]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                send_type:
                  type: string
                  enum: [now, scheduled]
                  default: now
                scheduled_at:
                  type: string
                  format: date-time
                test_email:
                  type: string
                  format: email
                  description: Send test email first
      responses:
        '200':
          description: Campaign sent or scheduled
          content:
            application/json:
              schema:
                type: object
                properties:
                  campaign_id:
                    type: string
                    format: uuid
                  status:
                    type: string
                  estimated_recipients:
                    type: integer
                  send_started_at:
                    type: string
                    format: date-time

  /campaigns/{id}/metrics:
    get:
      summary: Get campaign performance metrics
      tags: [Campaigns]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Campaign metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  campaign_id:
                    type: string
                    format: uuid
                  total_recipients:
                    type: integer
                  sent_count:
                    type: integer
                  delivered_count:
                    type: integer
                  opened_count:
                    type: integer
                  clicked_count:
                    type: integer
                  unsubscribed_count:
                    type: integer
                  bounced_count:
                    type: integer
                  open_rate:
                    type: number
                    format: float
                  click_rate:
                    type: number
                    format: float
                  unsubscribe_rate:
                    type: number
                    format: float
                  bounce_rate:
                    type: number
                    format: float
                  revenue_generated:
                    type: number
                    format: float
                  updated_at:
                    type: string
                    format: date-time
```

---

## 🔔 Alert System API

### Alert Configuration
```yaml
paths:
  /alerts/config:
    get:
      summary: Get user alert configurations
      tags: [Alerts]
      security:
        - BearerAuth: []
      parameters:
        - name: alert_type
          in: query
          schema:
            type: string
            enum: [property, market, client_activity, business, system]
        - name: is_active
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: Alert configurations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/AlertConfig'

    post:
      summary: Create alert configuration
      tags: [Alerts]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, alert_type, criteria]
              properties:
                name:
                  type: string
                  maxLength: 255
                alert_type:
                  type: string
                  enum: [property, market, client_activity, business, system]
                criteria:
                  type: object
                  properties:
                    property_types:
                      type: array
                      items:
                        type: string
                    price_range:
                      type: object
                      properties:
                        min:
                          type: number
                        max:
                          type: number
                    locations:
                      type: array
                      items:
                        type: string
                    keywords:
                      type: array
                      items:
                        type: string
                delivery_channels:
                  type: array
                  items:
                    type: string
                    enum: [email, sms, push, in_app]
                  default: [email]
                frequency:
                  type: string
                  enum: [immediate, daily, weekly, monthly]
                  default: immediate
                quiet_hours:
                  type: object
                  properties:
                    start:
                      type: string
                      format: time
                    end:
                      type: string
                      format: time
                    timezone:
                      type: string
                ml_optimization_enabled:
                  type: boolean
                  default: true
      responses:
        '201':
          description: Alert configuration created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AlertConfig'

  /alerts:
    get:
      summary: Get user alerts
      tags: [Alerts]
      security:
        - BearerAuth: []
      parameters:
        - name: config_id
          in: query
          schema:
            type: string
            format: uuid
        - name: viewed
          in: query
          schema:
            type: boolean
        - name: urgency_level
          in: query
          schema:
            type: string
            enum: [low, normal, high, urgent]
        - name: since
          in: query
          description: Get alerts since this timestamp
          schema:
            type: string
            format: date-time
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: User alerts
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Alert'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
                  unread_count:
                    type: integer

  /alerts/{id}/respond:
    post:
      summary: Respond to alert
      tags: [Alerts]
      security:
        - BearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [response_type]
              properties:
                response_type:
                  type: string
                  enum: [interested, not_interested, contact_me, schedule_showing, dismissed]
                response_data:
                  type: object
                  properties:
                    preferred_contact_method:
                      type: string
                      enum: [phone, email, text]
                    preferred_times:
                      type: array
                      items:
                        type: string
                    notes:
                      type: string
      responses:
        '200':
          description: Response recorded
          content:
            application/json:
              schema:
                type: object
                properties:
                  alert_id:
                    type: string
                    format: uuid
                  response_recorded:
                    type: boolean
                  follow_up_scheduled:
                    type: boolean
```

---

## 🔍 Search API

### Advanced Search
```yaml
paths:
  /search/documents:
    get:
      summary: Search documents with advanced filtering
      tags: [Search]
      security:
        - BearerAuth: []
      parameters:
        - name: q
          in: query
          description: Search query
          schema:
            type: string
        - name: document_type
          in: query
          schema:
            type: array
            items:
              type: string
        - name: date_from
          in: query
          schema:
            type: string
            format: date
        - name: date_to
          in: query
          schema:
            type: string
            format: date
        - name: tags
          in: query
          description: Comma-separated tags
          schema:
            type: string
        - name: file_size_min
          in: query
          schema:
            type: integer
        - name: file_size_max
          in: query
          schema:
            type: integer
        - name: sort
          in: query
          schema:
            type: string
            enum: [relevance, date, size, filename]
            default: relevance
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: highlight
          in: query
          description: Return highlighted search terms
          schema:
            type: boolean
            default: true
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      allOf:
                        - $ref: '#/components/schemas/Document'
                        - type: object
                          properties:
                            relevance_score:
                              type: number
                              format: float
                            highlights:
                              type: object
                              properties:
                                title:
                                  type: array
                                  items:
                                    type: string
                                content:
                                  type: array
                                  items:
                                    type: string
                  pagination:
                    $ref: '#/components/schemas/Pagination'
                  facets:
                    type: object
                    properties:
                      document_types:
                        type: object
                        additionalProperties:
                          type: integer
                      tags:
                        type: object
                        additionalProperties:
                          type: integer
                  query_suggestions:
                    type: array
                    items:
                      type: string

  /search/suggestions:
    get:
      summary: Get search suggestions
      tags: [Search]
      security:
        - BearerAuth: []
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            minLength: 2
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Search suggestions
          content:
            application/json:
              schema:
                type: object
                properties:
                  suggestions:
                    type: array
                    items:
                      type: object
                      properties:
                        text:
                          type: string
                        type:
                          type: string
                          enum: [document, tag, filename, content]
                        frequency:
                          type: integer
```

---

## 📊 Analytics API

### Performance Metrics
```yaml
paths:
  /analytics/dashboard:
    get:
      summary: Get dashboard metrics
      tags: [Analytics]
      security:
        - BearerAuth: []
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [day, week, month, quarter, year]
            default: month
        - name: agency_id
          in: query
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Dashboard metrics
          content:
            application/json:
              schema:
                type: object
                properties:
                  documents:
                    type: object
                    properties:
                      total_count:
                        type: integer
                      uploaded_this_period:
                        type: integer
                      storage_used_bytes:
                        type: integer
                      avg_processing_time:
                        type: number
                        format: float
                  campaigns:
                    type: object
                    properties:
                      total_sent:
                        type: integer
                      avg_open_rate:
                        type: number
                        format: float
                      avg_click_rate:
                        type: number
                        format: float
                      revenue_generated:
                        type: number
                        format: float
                  alerts:
                    type: object
                    properties:
                      total_sent:
                        type: integer
                      response_rate:
                        type: number
                        format: float
                      conversion_rate:
                        type: number
                        format: float
                  users:
                    type: object
                    properties:
                      active_users:
                        type: integer
                      new_signups:
                        type: integer
                      retention_rate:
                        type: number
                        format: float

  /analytics/reports:
    post:
      summary: Generate custom report
      tags: [Analytics]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [report_type, date_range]
              properties:
                report_type:
                  type: string
                  enum: [document_usage, campaign_performance, alert_effectiveness, user_activity]
                date_range:
                  type: object
                  required: [start_date, end_date]
                  properties:
                    start_date:
                      type: string
                      format: date
                    end_date:
                      type: string
                      format: date
                filters:
                  type: object
                  properties:
                    agency_ids:
                      type: array
                      items:
                        type: string
                        format: uuid
                    user_ids:
                      type: array
                      items:
                        type: string
                        format: uuid
                    document_types:
                      type: array
                      items:
                        type: string
                format:
                  type: string
                  enum: [json, csv, pdf]
                  default: json
      responses:
        '200':
          description: Report generated
          content:
            application/json:
              schema:
                type: object
                properties:
                  report_id:
                    type: string
                    format: uuid
                  download_url:
                    type: string
                    format: uri
                  expires_at:
                    type: string
                    format: date-time
        '202':
          description: Report generation started
          content:
            application/json:
              schema:
                type: object
                properties:
                  report_id:
                    type: string
                    format: uuid
                  status:
                    type: string
                    enum: [processing, completed, failed]
                  estimated_completion:
                    type: string
                    format: date-time
```

---

## 📋 Schema Definitions

### Core Schemas
```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        first_name:
          type: string
        last_name:
          type: string
        phone:
          type: string
        avatar_url:
          type: string
          format: uri
        timezone:
          type: string
        locale:
          type: string
        status:
          type: string
          enum: [active, inactive, suspended]
        email_verified:
          type: boolean
        mfa_enabled:
          type: boolean
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Document:
      type: object
      properties:
        id:
          type: string
          format: uuid
        filename:
          type: string
        original_filename:
          type: string
        file_extension:
          type: string
        mime_type:
          type: string
        file_size:
          type: integer
        document_type:
          type: string
          enum: [contract, disclosure, inspection, appraisal, title, insurance, loan, listing, offer, counteroffer, amendment, addendum, closing, deed, other]
        category:
          type: string
        confidence_score:
          type: number
          format: float
        title:
          type: string
        description:
          type: string
        tags:
          type: array
          items:
            type: string
        status:
          type: string
          enum: [processing, ready, error, archived]
        visibility:
          type: string
          enum: [private, team, agency, public]
        uploaded_by:
          type: string
          format: uuid
        transaction_id:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        processed_at:
          type: string
          format: date-time

    DocumentDetailed:
      allOf:
        - $ref: '#/components/schemas/Document'
        - type: object
          properties:
            extracted_text:
              type: string
            extracted_data:
              type: object
              properties:
                names:
                  type: array
                  items:
                    type: string
                dates:
                  type: array
                  items:
                    type: string
                    format: date
                amounts:
                  type: array
                  items:
                    type: number
            versions:
              type: array
              items:
                type: object
                properties:
                  version_number:
                    type: integer
                  created_at:
                    type: string
                    format: date-time
                  created_by:
                    type: string
                    format: uuid
            shares:
              type: array
              items:
                type: object
                properties:
                  share_id:
                    type: string
                    format: uuid
                  shared_with_email:
                    type: string
                    format: email
                  access_type:
                    type: string
                    enum: [view, download, comment]
                  expires_at:
                    type: string
                    format: date-time
                  access_count:
                    type: integer
                  created_at:
                    type: string
                    format: date-time

    Campaign:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        campaign_type:
          type: string
          enum: [one_time, recurring, drip, triggered]
        status:
          type: string
          enum: [draft, scheduled, sending, sent, paused, cancelled]
        subject_line:
          type: string
        total_recipients:
          type: integer
        sent_count:
          type: integer
        delivered_count:
          type: integer
        opened_count:
          type: integer
        clicked_count:
          type: integer
        unsubscribed_count:
          type: integer
        bounced_count:
          type: integer
        created_by:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
        scheduled_at:
          type: string
          format: date-time
        sent_at:
          type: string
          format: date-time

    AlertConfig:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        alert_type:
          type: string
          enum: [property, market, client_activity, business, system]
        criteria:
          type: object
        delivery_channels:
          type: array
          items:
            type: string
            enum: [email, sms, push, in_app]
        frequency:
          type: string
          enum: [immediate, daily, weekly, monthly]
        is_active:
          type: boolean
        ml_optimization_enabled:
          type: boolean
        personalization_score:
          type: number
          format: float
        last_triggered_at:
          type: string
          format: date-time
        trigger_count:
          type: integer
        created_at:
          type: string
          format: date-time

    Alert:
      type: object
      properties:
        id:
          type: string
          format: uuid
        config_id:
          type: string
          format: uuid
        title:
          type: string
        message:
          type: string
        alert_data:
          type: object
        relevance_score:
          type: number
          format: float
        urgency_level:
          type: string
          enum: [low, normal, high, urgent]
        delivery_channels:
          type: array
          items:
            type: string
        sent_at:
          type: string
          format: date-time
        viewed_at:
          type: string
          format: date-time
        clicked_at:
          type: string
          format: date-time
        responded_at:
          type: string
          format: date-time
        response_type:
          type: string
          enum: [interested, not_interested, contact_me, schedule_showing, dismissed]
        converted:
          type: boolean
        conversion_value:
          type: number
          format: float

    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        pages:
          type: integer
        has_next:
          type: boolean
        has_prev:
          type: boolean

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        code:
          type: string
        details:
          type: object
        request_id:
          type: string
          format: uuid
        timestamp:
          type: string
          format: date-time

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Unauthorized"
            message: "Valid authentication token required"
            code: "AUTH_REQUIRED"

    Forbidden:
      description: Insufficient permissions
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Forbidden"
            message: "Insufficient permissions for this resource"
            code: "INSUFFICIENT_PERMISSIONS"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Not Found"
            message: "The requested resource was not found"
            code: "RESOURCE_NOT_FOUND"

    RateLimited:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "Too Many Requests"
            message: "Rate limit exceeded. Try again later."
            code: "RATE_LIMITED"
      headers:
        Retry-After:
          schema:
            type: integer
            description: Seconds to wait before retry

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## ⚡ Performance & Optimization

### API Performance Targets
```yaml
Response Time Targets:
  - Authentication: <200ms
  - Document metadata: <300ms
  - Document search: <500ms
  - Campaign creation: <1s
  - File upload: <30s (depends on size)
  - AI analysis: <10s

Throughput Targets:
  - Concurrent API requests: 1K/second
  - File uploads: 100/minute
  - Search queries: 500/second
  - Real-time notifications: 10K/second

Caching Strategy:
  - GET endpoints: 5-60 minutes TTL
  - Search results: 5 minutes TTL
  - User sessions: 24 hours TTL
  - Static content: 1 year TTL
```

### Rate Limiting
```yaml
Rate Limits by Endpoint:
  Authentication:
    - /auth/login: 5/minute per IP
    - /auth/refresh: 10/minute per user
    - /auth/mfa/*: 3/minute per user
  
  Documents:
    - POST /documents: 20/minute per user
    - GET /documents: 100/minute per user
    - /documents/*/download: 50/minute per user
  
  Campaigns:
    - POST /campaigns: 10/hour per agency
    - POST /campaigns/*/send: 5/hour per agency
  
  Search:
    - /search/*: 100/minute per user
  
  Default: 1000/hour per user
```

---

## 🚀 Implementation Timeline

### Phase 1: Core APIs (Week 3-4)
1. **Authentication API** - Login, MFA, token management
2. **User Management API** - Profiles, agencies, teams
3. **Document API** - CRUD operations, basic search
4. **Error Handling** - Consistent error responses

### Phase 2: Advanced Features (Week 5-6)
1. **Claude AI Integration** - Document analysis endpoints
2. **Advanced Search** - Elasticsearch integration
3. **File Operations** - Upload, download, sharing
4. **Campaign API** - Basic email campaign management

### Phase 3: Marketing & Alerts (Week 7-8)
1. **Campaign Advanced Features** - ML optimization, analytics
2. **Alert System API** - Configuration, delivery, responses
3. **Analytics API** - Dashboards, reports, metrics
4. **Performance Optimization** - Caching, rate limiting

### Phase 4: Production Readiness (Week 9-10)
1. **API Gateway Setup** - Routing, security, monitoring
2. **Documentation** - Complete OpenAPI specs, examples
3. **Testing** - Integration tests, load testing
4. **Monitoring** - API performance, error tracking

---

**API Specifications By**: API Architecture Team  
**Reviewed By**: Backend Team, Frontend Team, Security Team  
**Last Updated**: Week 2, Day 4  
**Next Review**: End of Week 3

*Note: API specifications will be refined based on frontend integration requirements and performance testing results.*