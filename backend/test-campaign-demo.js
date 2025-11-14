#!/usr/bin/env node

/**
 * Campaign Demo System - Automated Testing Script
 *
 * This script verifies all components of the campaign demo system are working correctly.
 * Run this before demoing to ensure everything is ready.
 *
 * Usage: node test-campaign-demo.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  results.total++;
  results.tests.push({ name, passed, message });

  if (passed) {
    results.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.cyan}${message}${colors.reset}`);
  } else {
    results.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
  }
}

/**
 * Print section header
 */
function printSection(title) {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);
}

/**
 * Test 1: Backend Health Check
 */
async function testBackendHealth() {
  printSection('Test 1: Backend Health Check');

  try {
    const response = await makeRequest(`${BASE_URL}/health`);

    logTest(
      'Backend server is running',
      response.status === 200,
      response.status === 200 ? 'Server healthy' : `Status: ${response.status}`
    );

    logTest(
      'Health endpoint returns valid data',
      response.data.success === true && response.data.data.status === 'healthy',
      `Status: ${response.data.data?.status}, Uptime: ${response.data.data?.uptime?.toFixed(2)}s`
    );
  } catch (error) {
    logTest('Backend server is running', false, `Error: ${error.message}`);
    logTest('Health endpoint returns valid data', false, 'Server not reachable');
  }
}

/**
 * Test 2: API Version Endpoint
 */
async function testAPIVersion() {
  printSection('Test 2: API Version Endpoint');

  try {
    const response = await makeRequest(`${API_BASE}`);

    logTest(
      'API version endpoint responds',
      response.status === 200,
      `Version: ${response.data.data?.version}`
    );

    logTest(
      'Campaigns endpoint is registered',
      response.data.data?.endpoints?.campaigns !== undefined,
      `Endpoint: ${response.data.data?.endpoints?.campaigns}`
    );
  } catch (error) {
    logTest('API version endpoint responds', false, `Error: ${error.message}`);
    logTest('Campaigns endpoint is registered', false, 'Endpoint not found');
  }
}

/**
 * Test 3: Quick Demo Campaign Creation
 */
async function testQuickDemo() {
  printSection('Test 3: Quick Demo Campaign Creation');

  try {
    const startTime = Date.now();
    const response = await makeRequest(`${API_BASE}/campaigns/demo/quick-start`);
    const duration = Date.now() - startTime;

    logTest(
      'Quick demo endpoint responds',
      response.status === 200,
      `Response time: ${duration}ms`
    );

    logTest(
      'Campaign is created successfully',
      response.data.success === true && response.data.data.campaignId,
      `Campaign ID: ${response.data.data?.campaignId}`
    );

    logTest(
      'Initial metrics are returned',
      response.data.data.metrics && response.data.data.metrics.sent === 3,
      `Sent: ${response.data.data.metrics?.sent}, Opens: ${response.data.data.metrics?.opened}`
    );

    logTest(
      'Response time is acceptable',
      duration < 2000,
      duration < 1000 ? 'Excellent (<1s)' : duration < 2000 ? 'Good (<2s)' : 'Slow (>2s)'
    );

    return response.data.data.campaignId;
  } catch (error) {
    logTest('Quick demo endpoint responds', false, `Error: ${error.message}`);
    logTest('Campaign is created successfully', false, 'No campaign ID returned');
    logTest('Initial metrics are returned', false, 'No metrics returned');
    logTest('Response time is acceptable', false, 'Request failed');
    return null;
  }
}

/**
 * Test 4: Campaign Metrics Update
 */
async function testMetricsUpdate(campaignId) {
  printSection('Test 4: Campaign Metrics Update');

  if (!campaignId) {
    logTest('Metrics endpoint responds', false, 'No campaign ID from previous test');
    logTest('Opens appear after delay', false, 'No campaign ID from previous test');
    logTest('Open rate is realistic', false, 'No campaign ID from previous test');
    return;
  }

  try {
    // Wait for opens to appear (simulation delay)
    console.log(`${colors.yellow}Waiting 10 seconds for opens to appear...${colors.reset}\n`);
    await sleep(10000);

    const response = await makeRequest(`${API_BASE}/campaigns/${campaignId}/metrics`);

    logTest(
      'Metrics endpoint responds',
      response.status === 200,
      `Status: ${response.status}`
    );

    const metrics = response.data.data;
    const hasOpens = metrics.opened > 0;

    logTest(
      'Opens appear after delay',
      hasOpens,
      hasOpens ? `Opened: ${metrics.opened}/${metrics.sent}` : 'No opens yet'
    );

    const openRate = metrics.openRate || 0;
    const isRealistic = openRate >= 0.2 && openRate <= 1.0;

    logTest(
      'Open rate is realistic',
      isRealistic,
      `Open rate: ${(openRate * 100).toFixed(1)}% (target: 40-60%)`
    );

    logTest(
      'Delivery rate is high',
      metrics.delivered >= metrics.sent * 0.95,
      `Delivered: ${metrics.delivered}/${metrics.sent} (${(metrics.delivered/metrics.sent * 100).toFixed(1)}%)`
    );
  } catch (error) {
    logTest('Metrics endpoint responds', false, `Error: ${error.message}`);
    logTest('Opens appear after delay', false, 'Request failed');
    logTest('Open rate is realistic', false, 'Request failed');
    logTest('Delivery rate is high', false, 'Request failed');
  }
}

/**
 * Test 5: Overview Statistics
 */
async function testOverviewStats() {
  printSection('Test 5: Overview Statistics');

  try {
    const response = await makeRequest(`${API_BASE}/campaigns/stats/overview`);

    logTest(
      'Overview stats endpoint responds',
      response.status === 200,
      `Status: ${response.status}`
    );

    const stats = response.data.data;

    logTest(
      'Stats include campaign counts',
      stats.totalCampaigns !== undefined && stats.activeCampaigns !== undefined,
      `Total: ${stats.totalCampaigns}, Active: ${stats.activeCampaigns}`
    );

    logTest(
      'Stats include message metrics',
      stats.totalSent !== undefined && stats.totalOpened !== undefined,
      `Sent: ${stats.totalSent}, Opened: ${stats.totalOpened}`
    );

    logTest(
      'Stats include aggregated rates',
      stats.avgOpenRate !== undefined && stats.avgClickRate !== undefined,
      `Avg Open Rate: ${(stats.avgOpenRate * 100).toFixed(1)}%, Avg Click Rate: ${(stats.avgClickRate * 100).toFixed(1)}%`
    );
  } catch (error) {
    logTest('Overview stats endpoint responds', false, `Error: ${error.message}`);
    logTest('Stats include campaign counts', false, 'Request failed');
    logTest('Stats include message metrics', false, 'Request failed');
    logTest('Stats include aggregated rates', false, 'Request failed');
  }
}

/**
 * Test 6: Campaign List Endpoint
 */
async function testCampaignList() {
  printSection('Test 6: Campaign List Endpoint');

  try {
    const response = await makeRequest(`${API_BASE}/campaigns`);

    // Note: This endpoint requires authentication, so we expect 401
    logTest(
      'Campaign list endpoint exists',
      response.status === 401 || response.status === 200,
      response.status === 401 ? 'Authentication required (expected)' : `Found ${response.data.data?.length || 0} campaigns`
    );
  } catch (error) {
    logTest('Campaign list endpoint exists', false, `Error: ${error.message}`);
  }
}

/**
 * Test 7: Performance Benchmarks
 */
async function testPerformance() {
  printSection('Test 7: Performance Benchmarks');

  try {
    // Test health endpoint speed
    const start1 = Date.now();
    await makeRequest(`${BASE_URL}/health`);
    const healthTime = Date.now() - start1;

    logTest(
      'Health check is fast',
      healthTime < 100,
      `${healthTime}ms (target: <100ms)`
    );

    // Test API endpoint speed
    const start2 = Date.now();
    await makeRequest(`${API_BASE}`);
    const apiTime = Date.now() - start2;

    logTest(
      'API endpoint is fast',
      apiTime < 200,
      `${apiTime}ms (target: <200ms)`
    );

    // Test demo creation speed
    const start3 = Date.now();
    await makeRequest(`${API_BASE}/campaigns/demo/quick-start`);
    const demoTime = Date.now() - start3;

    logTest(
      'Demo creation is fast',
      demoTime < 1000,
      `${demoTime}ms (target: <1000ms)`
    );
  } catch (error) {
    logTest('Health check is fast', false, `Error: ${error.message}`);
    logTest('API endpoint is fast', false, `Error: ${error.message}`);
    logTest('Demo creation is fast', false, `Error: ${error.message}`);
  }
}

/**
 * Print final results
 */
function printResults() {
  console.log(`\n${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}Test Results Summary${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Success Rate: ${percentage}%`);

  if (results.failed > 0) {
    console.log(`\n${colors.yellow}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.message) console.log(`    ${t.message}`);
      });
  }

  console.log('');

  if (results.failed === 0) {
    console.log(`${colors.green}╔═══════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║   ✓ ALL TESTS PASSED - DEMO READY!   ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}╔═══════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║   ✗ SOME TESTS FAILED - FIX REQUIRED  ║${colors.reset}`);
    console.log(`${colors.red}╚═══════════════════════════════════════╝${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Campaign Demo System - Automated Test Suite         ║${colors.reset}`);
  console.log(`${colors.cyan}║  ROI Systems POC                                      ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.yellow}Testing backend at: ${BASE_URL}${colors.reset}\n`);

  try {
    await testBackendHealth();
    await testAPIVersion();
    const campaignId = await testQuickDemo();
    await testMetricsUpdate(campaignId);
    await testOverviewStats();
    await testCampaignList();
    await testPerformance();

    printResults();
  } catch (error) {
    console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
