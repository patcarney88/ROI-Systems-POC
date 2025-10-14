/**
 * ROI Systems POC - K6 Load Testing Script
 *
 * Performance targets:
 * - p95 response time: <200ms
 * - Error rate: <1%
 * - Throughput: 1K-5K req/s
 *
 * Usage:
 *   k6 run tests/performance/k6-load-test.js
 *   k6 run --vus 100 --duration 10m tests/performance/k6-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const documentUploadDuration = new Trend('document_upload_duration');
const documentRetrievalDuration = new Trend('document_retrieval_duration');
const authDuration = new Trend('auth_duration');
const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Ramp up load
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp to 50 users
        { duration: '5m', target: 50 },   // Stay at 50
        { duration: '2m', target: 100 },  // Ramp to 100
        { duration: '5m', target: 100 },  // Stay at 100
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
    },

    // Scenario 2: Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      startTime: '16m', // Start after ramp_up finishes
    },

    // Scenario 3: Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },  // Quick spike to 200
        { duration: '2m', target: 200 },  // Hold spike
        { duration: '1m', target: 0 },    // Quick drop
      ],
      startTime: '26m', // Start after constant_load finishes
    },
  },

  // Performance thresholds
  thresholds: {
    // HTTP errors should be less than 1%
    'errors': ['rate<0.01'],

    // 95% of requests should be below 200ms
    'http_req_duration': ['p(95)<200'],

    // 99% of requests should be below 500ms
    'http_req_duration{staticAsset:yes}': ['p(99)<500'],

    // Authentication should be under 100ms
    'auth_duration': ['p(95)<100'],

    // Document retrieval under 200ms
    'document_retrieval_duration': ['p(95)<200'],

    // Document upload under 1s
    'document_upload_duration': ['p(95)<1000'],

    // HTTP failures should be less than 1%
    'http_req_failed': ['rate<0.01'],
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_VERSION = 'v1';
const API_BASE = `${BASE_URL}/api/${API_VERSION}`;

// Test data
const testUsers = [
  { email: 'test1@roi-systems.com', password: 'Test123!@#' },
  { email: 'test2@roi-systems.com', password: 'Test123!@#' },
  { email: 'test3@roi-systems.com', password: 'Test123!@#' },
];

/**
 * Setup function - runs once per VU
 */
export function setup() {
  console.log('Starting ROI Systems Performance Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Base: ${API_BASE}`);

  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'health check successful': (r) => r.status === 200,
  });

  return { startTime: new Date() };
}

/**
 * Main test function
 */
export default function (data) {
  // Randomly select a test user
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  let authToken = null;

  group('Authentication Flow', () => {
    // Login
    const loginStart = Date.now();
    const loginRes = http.post(
      `${API_BASE}/auth/login`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'auth_login' },
      }
    );

    authDuration.add(Date.now() - loginStart);
    requestCounter.add(1);

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken;
        } catch (e) {
          return false;
        }
      },
    });

    if (loginSuccess) {
      try {
        const body = JSON.parse(loginRes.body);
        authToken = body.data.accessToken;
      } catch (e) {
        console.error('Failed to parse login response');
        errorRate.add(1);
        return;
      }
    } else {
      errorRate.add(1);
      return; // Exit if authentication fails
    }
  });

  // Wait a bit between requests
  sleep(1);

  group('Document Operations', () => {
    if (!authToken) {
      console.error('No auth token available');
      errorRate.add(1);
      return;
    }

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Get documents list
    const docsStart = Date.now();
    const docsRes = http.get(`${API_BASE}/documents?page=1&limit=20`, {
      headers,
      tags: { name: 'get_documents' },
    });

    documentRetrievalDuration.add(Date.now() - docsStart);
    requestCounter.add(1);

    check(docsRes, {
      'documents status is 200': (r) => r.status === 200,
      'documents response is valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch (e) {
          return false;
        }
      },
    });

    if (docsRes.status !== 200) {
      errorRate.add(1);
    }

    sleep(0.5);

    // Get document statistics
    const statsRes = http.get(`${API_BASE}/documents/stats`, {
      headers,
      tags: { name: 'get_stats' },
    });

    requestCounter.add(1);

    check(statsRes, {
      'stats status is 200': (r) => r.status === 200,
    });

    if (statsRes.status !== 200) {
      errorRate.add(1);
    }

    sleep(0.5);

    // Search documents
    const searchRes = http.get(
      `${API_BASE}/documents?search=contract&page=1&limit=10`,
      {
        headers,
        tags: { name: 'search_documents' },
      }
    );

    requestCounter.add(1);

    check(searchRes, {
      'search status is 200': (r) => r.status === 200,
    });

    if (searchRes.status !== 200) {
      errorRate.add(1);
    }
  });

  sleep(1);

  group('Client Operations', () => {
    if (!authToken) return;

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Get clients list
    const clientsRes = http.get(`${API_BASE}/clients`, {
      headers,
      tags: { name: 'get_clients' },
    });

    requestCounter.add(1);

    check(clientsRes, {
      'clients status is 200': (r) => r.status === 200,
    });

    if (clientsRes.status !== 200) {
      errorRate.add(1);
    }

    sleep(0.5);

    // Get client statistics
    const clientStatsRes = http.get(`${API_BASE}/clients/stats`, {
      headers,
      tags: { name: 'get_client_stats' },
    });

    requestCounter.add(1);

    check(clientStatsRes, {
      'client stats status is 200': (r) => r.status === 200,
    });

    if (clientStatsRes.status !== 200) {
      errorRate.add(1);
    }
  });

  sleep(1);

  group('Campaign Operations', () => {
    if (!authToken) return;

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Get campaigns list
    const campaignsRes = http.get(`${API_BASE}/campaigns`, {
      headers,
      tags: { name: 'get_campaigns' },
    });

    requestCounter.add(1);

    check(campaignsRes, {
      'campaigns status is 200': (r) => r.status === 200,
    });

    if (campaignsRes.status !== 200) {
      errorRate.add(1);
    }
  });

  // Think time between iterations
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;

  console.log('Performance Test Complete');
  console.log(`Total Duration: ${duration}s`);
  console.log('Check summary for detailed metrics');
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

/**
 * Text summary helper
 */
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '=== Performance Test Summary ===\n\n';

  // Test duration
  const duration = data.state.testRunDurationMs / 1000;
  summary += indent + `Test Duration: ${duration.toFixed(2)}s\n\n`;

  // VUs
  summary += indent + `Virtual Users: ${data.metrics.vus.values.max}\n`;
  summary += indent + `Requests Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Requests/sec: ${(data.metrics.http_reqs.values.count / duration).toFixed(2)}\n\n`;

  // Response times
  summary += indent + 'Response Times:\n';
  summary += indent + `  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += indent + `  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;

  // Error rates
  const errorRate = data.metrics.errors ? data.metrics.errors.values.rate : 0;
  const failRate = data.metrics.http_req_failed.values.rate;
  summary += indent + `Error Rate: ${(errorRate * 100).toFixed(2)}%\n`;
  summary += indent + `Failed Requests: ${(failRate * 100).toFixed(2)}%\n\n`;

  // Custom metrics
  if (data.metrics.auth_duration) {
    summary += indent + 'Auth Duration:\n';
    summary += indent + `  p95: ${data.metrics.auth_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  if (data.metrics.document_retrieval_duration) {
    summary += indent + 'Document Retrieval Duration:\n';
    summary += indent + `  p95: ${data.metrics.document_retrieval_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  summary += indent + '\n=================================\n';

  return summary;
}
