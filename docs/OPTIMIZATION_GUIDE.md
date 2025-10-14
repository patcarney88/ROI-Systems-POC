# ROI Systems POC - Performance Optimization Guide

## Quick Reference

**Priority**: P0 (Critical) > P1 (High) > P2 (Medium) > P3 (Low)
**Impact**: Critical > High > Medium > Low
**Effort**: Low (1 day) < Medium (2-3 days) < High (5+ days)

---

## Table of Contents

1. [Frontend Optimizations](#frontend-optimizations)
2. [Backend Optimizations](#backend-optimizations)
3. [Database Optimizations](#database-optimizations)
4. [Caching Strategy](#caching-strategy)
5. [Infrastructure Optimizations](#infrastructure-optimizations)

---

## Frontend Optimizations

### P0-1: Implement Code Splitting (Effort: Medium, Impact: High)

**Current Issue**: All components bundled in single 273KB file (81KB gzipped), exceeding 81KB target.

**Solution**:

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Documents = lazy(() => import('./pages/Documents'));
const Clients = lazy(() => import('./pages/Clients'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Lazy load modals
const DocumentUploadModal = lazy(() => import('./modals/DocumentUploadModal'));
const ClientModal = lazy(() => import('./modals/ClientModal'));
const CampaignModal = lazy(() => import('./modals/CampaignModal'));

function AppContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        {/* ... other routes */}
      </Routes>
    </Suspense>
  );
}
```

**Loading Spinner Component**:

```typescript
// frontend/src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
```

**Expected Results**:
- Initial bundle: 273KB → 150KB (55KB gzipped)
- Load time: 800ms → 500ms (37% faster)
- Route chunks: 5 x 30KB each
- **Target met**: 55KB < 81KB ✅

---

### P0-2: Optimize Vite Build Configuration (Effort: Low, Impact: Medium)

**Current Issue**: Basic Vite config without optimization settings.

**Solution**:

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',
    minify: 'terser',

    terserOptions: {
      compress: {
        drop_console: true,      // Remove console.log in production
        drop_debugger: true,      // Remove debugger statements
        passes: 2,                 // Multiple compression passes
      },
    },

    rollupOptions: {
      output: {
        // Manual chunk splitting
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],

          // Feature chunks
          'pages': [
            './src/pages/Dashboard',
            './src/pages/Documents',
            './src/pages/Clients',
          ],
          'modals': [
            './src/modals/DocumentUploadModal',
            './src/modals/ClientModal',
            './src/modals/CampaignModal',
          ],
        },

        // Optimized chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunk > 500KB

    // Source maps for production debugging
    sourcemap: false, // Disable in production for performance
  },

  server: {
    port: 5050,
    host: true,
  },
});
```

**Expected Results**:
- Better chunk splitting
- Smaller individual chunks
- Improved caching (separate vendor chunks)

---

### P1-1: Add React Performance Optimizations (Effort: Medium, Impact: Medium)

**Current Issue**: No memo/callback optimizations, potential unnecessary re-renders.

**Solution**:

```typescript
// frontend/src/App.tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const Dashboard = memo(lazy(() => import('./pages/Dashboard')));
const Documents = memo(lazy(() => import('./pages/Documents')));

function AppContent() {
  const [documents, setDocuments] = useState<Document[]>([]);

  // Memoize expensive computations
  const stats = useMemo(() => ({
    totalDocuments: documents.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    emailEngagement: calculateEngagement(campaigns),
  }), [documents, clients, campaigns]);

  // Memoize callbacks to prevent re-renders
  const handleDocumentUpload = useCallback((files: File[], metadata: any) => {
    const newDocs = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      // ... document creation
    }));
    setDocuments(prev => [...newDocs, ...prev]);
  }, []);

  const handleClientSave = useCallback((clientData: any) => {
    setClients(prev => /* ... */);
  }, []);

  return (
    <Routes>
      <Route path="/" element={
        <Dashboard
          documents={documents}
          stats={stats}
          onDocumentUpload={handleDocumentUpload}
          onClientSave={handleClientSave}
        />
      } />
    </Routes>
  );
}
```

**Expected Results**:
- Reduced re-renders
- Better component performance
- Improved user experience

---

### P2-1: Implement Virtual Scrolling (Effort: Medium, Impact: Medium)

**Current Issue**: Large lists render all items, impacting performance.

**Solution**:

```typescript
// Install react-window
npm install react-window

// frontend/src/pages/Documents.tsx
import { FixedSizeList as List } from 'react-window';

export default function Documents({ documents }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <DocumentCard document={documents[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={documents.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

**Expected Results**:
- Render only visible items
- 1000 items: 100% DOM → 10-20 DOM elements
- Scroll performance: Smooth even with 10K+ items

---

## Backend Optimizations

### P0-1: Implement Database Queries (Effort: High, Impact: Critical)

**Current Issue**: Controllers use in-memory arrays, can't scale beyond 10K documents.

**Solution**:

```typescript
// backend/src/models/document.model.ts
import { Pool } from 'pg';

export class DocumentModel {
  constructor(private pool: Pool) {}

  async getDocuments(params: {
    userId: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, status, type, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Build dynamic query
    const conditions = ['user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (type) {
      conditions.push(`type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    const query = `
      SELECT
        d.*,
        u.name as uploader_name,
        u.email as uploader_email
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getDocumentStats(userId: string) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'expiring') as expiring,
        COUNT(*) FILTER (WHERE status = 'expired') as expired
      FROM documents
      WHERE user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
}
```

**Controller Update**:

```typescript
// backend/src/controllers/document.controller.ts
import { DocumentModel } from '../models/document.model';

const documentModel = new DocumentModel(pool);

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { status, type, page, limit } = req.query;

  const documents = await documentModel.getDocuments({
    userId,
    status: status as string,
    type: type as string,
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20,
  });

  res.json({ success: true, data: { documents } });
});
```

**Expected Results**:
- O(n) → O(log n) with indexes
- 10K documents: 100ms → 5ms (95% faster)
- Memory: O(n) → O(1)
- Scalability: Unlimited

---

### P0-2: Implement JWT Token Caching (Effort: Low, Impact: High)

**Current Issue**: JWT verification takes 2-5ms per request, CPU bottleneck at 5K req/s.

**Solution**:

```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import LRU from 'lru-cache';

const jwtCache = new LRU<string, JWTPayload>({
  max: 10000,        // Maximum 10K cached tokens
  ttl: 300000,       // 5 minute TTL
  updateAgeOnGet: true,
});

export const verifyAccessToken = (token: string): JWTPayload => {
  // Check cache first
  const cached = jwtCache.get(token);
  if (cached) {
    return cached;
  }

  // Verify and cache
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    jwtCache.set(token, payload);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Clear cache on logout
export const invalidateToken = (token: string) => {
  jwtCache.delete(token);
};
```

**Expected Results**:
- JWT verification: 2-5ms → 0.1ms (95% faster)
- CPU usage: -70%
- Throughput: +50% (1K → 1.5K req/s)
- 80% cache hit rate

---

### P1-1: Implement N+1 Query Prevention (Effort: Medium, Impact: High)

**Current Issue**: Risk of N+1 queries when loading relationships.

**Solution**:

```typescript
// backend/src/models/document.model.ts

// BAD: N+1 queries
async getDocumentsWithUsers(userId: string) {
  const docs = await this.getDocuments({ userId });

  // N queries!
  for (const doc of docs) {
    doc.user = await userModel.getUser(doc.uploadedBy);
  }

  return docs;
}

// GOOD: Single query with JOIN
async getDocumentsWithUsers(userId: string) {
  const query = `
    SELECT
      d.*,
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email
      ) as uploader
    FROM documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.user_id = $1
    ORDER BY d.created_at DESC
  `;

  const result = await this.pool.query(query, [userId]);
  return result.rows;
}
```

**DataLoader Pattern** (for GraphQL-like APIs):

```typescript
// backend/src/loaders/user.loader.ts
import DataLoader from 'dataloader';

export const createUserLoader = (pool: Pool) => {
  return new DataLoader<string, User>(async (userIds) => {
    const query = `
      SELECT * FROM users
      WHERE id = ANY($1)
    `;

    const result = await pool.query(query, [userIds]);

    // Map results to match input order
    const userMap = new Map(result.rows.map(u => [u.id, u]));
    return userIds.map(id => userMap.get(id));
  });
};
```

**Expected Results**:
- 100 documents: 100 queries → 1 query (99% reduction)
- Response time: 1000ms → 10ms (99% faster)

---

### P1-2: Reduce Body Size Limit (Effort: Low, Impact: Medium)

**Current Issue**: 10MB JSON limit can cause memory exhaustion.

**Solution**:

```typescript
// backend/src/index.ts

// Before
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// After
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// For file uploads, use streaming
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const upload = multer({
  storage: multerS3({
    s3: new S3Client({}),
    bucket: 'roi-systems-documents',
    key: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});
```

**Expected Results**:
- Memory usage: -50% for request handling
- More predictable memory consumption
- Better handling of large uploads

---

## Database Optimizations

### P0-1: Increase Connection Pool Size (Effort: Low, Impact: Medium)

**Current Issue**: Pool size of 20 bottlenecks at ~2K req/s.

**Solution**:

```typescript
// services/auth-service/src/database/connection.ts

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'roi_dev',
  password: process.env.DB_PASSWORD,

  // Connection pool settings - OPTIMIZED
  min: parseInt(process.env.DB_POOL_MIN || '5'),      // 2 → 5
  max: parseInt(process.env.DB_POOL_MAX || '50'),     // 20 → 50
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),

  // Query timeout - REDUCED
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '5000'), // 10s → 5s

  application_name: 'roi-auth-service',
};
```

**Environment Configuration**:

```bash
# .env.production
DB_POOL_MIN=10
DB_POOL_MAX=100
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=3000
DB_QUERY_TIMEOUT=5000
```

**Expected Results**:
- Throughput: 2K → 5K req/s (2.5x improvement)
- Connection wait time: Reduced

---

### P1-1: Add Query Performance Monitoring (Effort: Medium, Impact: High)

**Current Issue**: Slow queries logged but not tracked.

**Solution**:

```typescript
// services/auth-service/src/database/connection.ts
import prometheus from 'prom-client';

// Prometheus metrics
const queryDuration = new prometheus.Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['query_type', 'table'],
  buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
});

const slowQueryCounter = new prometheus.Counter({
  name: 'db_slow_queries_total',
  help: 'Total number of slow queries (>1s)',
  labelNames: ['query_type', 'table'],
});

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  const queryType = text.trim().split(' ')[0].toUpperCase();
  const table = extractTable(text);

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Record metrics
    queryDuration.observe({ query_type: queryType, table }, duration);

    // Log slow queries
    if (duration > 1000) {
      slowQueryCounter.inc({ query_type: queryType, table });
      logger.warn(`Slow query detected (${duration}ms):`, {
        query: text.substring(0, 100),
        duration,
        queryType,
        table,
      });
    }

    return result;
  } catch (error) {
    logger.error('Database query error:', {
      query: text.substring(0, 100),
      error: error.message,
      queryType,
      table,
    });
    throw error;
  }
}

function extractTable(query: string): string {
  const match = query.match(/FROM\s+(\w+)/i) || query.match(/INTO\s+(\w+)/i);
  return match ? match[1] : 'unknown';
}
```

**Expected Results**:
- Identify slow queries in production
- Track query performance trends
- Alert on performance degradation

---

## Caching Strategy

### P0-1: Implement Redis Cache-Aside Pattern (Effort: Medium, Impact: High)

**Current Issue**: Redis connected but not used for caching.

**Solution**:

```typescript
// backend/src/cache/cache.service.ts
import { createClient } from 'redis';

export class CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
    });

    this.client.connect();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Cache-aside pattern: get or fetch
   */
  async getOrFetch<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }
}

export const cacheService = new CacheService();
```

**Usage in Controllers**:

```typescript
// backend/src/controllers/document.controller.ts
import { cacheService } from '../cache/cache.service';

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const cacheKey = `doc:${id}:${userId}`;

  // Use cache-aside pattern
  const document = await cacheService.getOrFetch(
    cacheKey,
    3600, // 1 hour TTL
    async () => {
      return await documentModel.getDocument(id, userId);
    }
  );

  res.json({ success: true, data: { document } });
});
```

**Cache Invalidation**:

```typescript
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  // Update in database
  const document = await documentModel.updateDocument(id, userId, req.body);

  // Invalidate cache
  await cacheService.del(`doc:${id}:${userId}`);

  res.json({ success: true, data: { document } });
});
```

**Expected Results**:
- Cache hit rate: 70-80%
- Response time: 50ms → 5ms for cached (90% faster)
- Database load: -70%

---

### P1-1: Implement Cache Warming (Effort: Low, Impact: Medium)

**Current Issue**: Cold cache on startup leads to slow first requests.

**Solution**:

```typescript
// backend/src/cache/cache-warmer.ts
export class CacheWarmer {
  constructor(
    private cacheService: CacheService,
    private documentModel: DocumentModel
  ) {}

  async warmDocumentCache(userId: string) {
    // Fetch recent documents
    const documents = await this.documentModel.getDocuments({
      userId,
      page: 1,
      limit: 50,
    });

    // Cache each document
    for (const doc of documents) {
      await this.cacheService.set(
        `doc:${doc.id}:${userId}`,
        doc,
        3600
      );
    }

    logger.info(`Warmed cache for ${documents.length} documents`);
  }

  async warmStatsCache(userId: string) {
    const stats = await this.documentModel.getDocumentStats(userId);
    await this.cacheService.set(`stats:${userId}`, stats, 300);
  }
}
```

**Startup Warm-up**:

```typescript
// backend/src/index.ts
app.listen(PORT, async () => {
  logger.info('Server started, warming cache...');

  // Warm cache for most active users
  const activeUsers = await userModel.getActiveUsers(100);
  for (const user of activeUsers) {
    await cacheWarmer.warmDocumentCache(user.id);
  }

  logger.info('Cache warming complete');
});
```

---

## Infrastructure Optimizations

### P1-1: Configure Database Read Replicas (Effort: Medium, Impact: High)

**Solution**:

```typescript
// backend/src/database/connection.ts
const readPool = new Pool({
  host: process.env.DB_READ_HOST || process.env.DB_HOST,
  port: parseInt(process.env.DB_READ_PORT || process.env.DB_PORT || '5432'),
  // ... other config
  max: 100, // More connections for reads
});

const writePool = new Pool({
  host: process.env.DB_WRITE_HOST || process.env.DB_HOST,
  port: parseInt(process.env.DB_WRITE_PORT || process.env.DB_PORT || '5432'),
  // ... other config
  max: 50, // Fewer connections for writes
});

export function getReadPool(): Pool {
  return readPool;
}

export function getWritePool(): Pool {
  return writePool;
}
```

**Usage**:

```typescript
// Read operations
const documents = await getReadPool().query(
  'SELECT * FROM documents WHERE user_id = $1',
  [userId]
);

// Write operations
await getWritePool().query(
  'INSERT INTO documents VALUES (...)',
  [values]
);
```

**Expected Results**:
- Read throughput: 2K → 10K req/s (5x improvement)
- Database load distribution: 80/20 read/write
- Better resource utilization

---

## Summary

### Immediate Actions (Week 1)

1. **Frontend Code Splitting** - Reduce bundle size
2. **JWT Token Caching** - Reduce CPU usage
3. **Vite Build Optimization** - Improve build output

**Expected Impact**: 30% performance improvement

### Short-term Actions (Month 1)

4. **Database Query Implementation** - Replace mock data
5. **Redis Cache-Aside Pattern** - Implement caching
6. **N+1 Query Prevention** - Optimize relationships

**Expected Impact**: 500% performance improvement

### Long-term Actions (Quarter 1)

7. **Elasticsearch Integration** - Improve search
8. **Database Read Replicas** - Scale reads
9. **Advanced Monitoring** - Track performance

**Expected Impact**: 10x scalability

---

**Last Updated**: 2025-10-14
**Next Review**: After Week 1 optimizations
