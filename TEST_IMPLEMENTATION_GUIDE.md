# Test Implementation Guide - ROI Systems POC

This guide provides step-by-step instructions for implementing comprehensive testing for the ROI Systems POC.

---

## Quick Start

### 1. Install Testing Dependencies

**Backend Testing**:
```bash
cd backend
npm install --save-dev supertest @types/supertest
```

**Frontend Testing**:
```bash
cd frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

**E2E Testing** (from root):
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Run Existing Tests

**Backend Tests**:
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm test -- --coverage      # With coverage
```

**Frontend Tests**:
```bash
cd frontend
npm test                    # Run all tests
npm run test:ui             # UI mode
npm run test:coverage       # With coverage
```

---

## Test Structure

### Backend Test Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                          # Test configuration
│   │   ├── utils/
│   │   │   ├── jwt.test.ts                   # JWT utility tests ✅ IMPLEMENTED
│   │   │   └── logger.test.ts                # Logger tests (TODO)
│   │   ├── controllers/
│   │   │   ├── auth.controller.test.ts       # Auth tests ✅ IMPLEMENTED
│   │   │   ├── client.controller.test.ts     # Client tests (TODO)
│   │   │   ├── document.controller.test.ts   # Document tests (TODO)
│   │   │   └── campaign.controller.test.ts   # Campaign tests (TODO)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.test.ts       # Auth middleware (TODO)
│   │   │   ├── error.middleware.test.ts      # Error handling (TODO)
│   │   │   └── validation.middleware.test.ts # Validation (TODO)
│   │   └── integration/
│   │       ├── auth.integration.test.ts      # Auth API tests (TODO)
│   │       ├── documents.integration.test.ts # Document API tests (TODO)
│   │       ├── clients.integration.test.ts   # Client API tests (TODO)
│   │       └── campaigns.integration.test.ts # Campaign API tests (TODO)
│   └── [application code]
├── jest.config.js                             # Jest configuration ✅ IMPLEMENTED
└── package.json
```

### Frontend Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   └── setup.ts                          # Vitest configuration ✅ IMPLEMENTED
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.test.tsx                # Dashboard tests (TODO)
│   │   ├── Documents.tsx
│   │   ├── Documents.test.tsx                # Documents tests (TODO)
│   │   ├── Clients.tsx
│   │   ├── Clients.test.tsx                  # Clients tests (TODO)
│   │   ├── Campaigns.tsx
│   │   └── Campaigns.test.tsx                # Campaigns tests (TODO)
│   └── modals/
│       ├── DocumentUploadModal.tsx
│       ├── DocumentUploadModal.test.tsx      # Modal tests (TODO)
│       └── [other modals...]
├── vitest.config.ts                          # Vitest configuration ✅ IMPLEMENTED
└── package.json
```

### E2E Test Structure

```
tests/
└── e2e/
    ├── auth.e2e.test.ts                      # Auth flow tests (TODO)
    ├── document-upload.e2e.test.ts           # Document upload tests (TODO)
    ├── client-management.e2e.test.ts         # Client management tests (TODO)
    └── campaign-flow.e2e.test.ts             # Campaign flow tests (TODO)
```

---

## Writing Tests

### Backend Unit Test Example

**Testing a Controller** (`auth.controller.test.ts`):
```typescript
import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
            tokens: expect.any(Object)
          })
        })
      );
    });
  });
});
```

### Backend Integration Test Example

**Testing API Endpoints**:
```typescript
import request from 'supertest';
import app from '../../index';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
```

### Frontend Component Test Example

**Testing a React Component**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';

describe('Dashboard', () => {
  const mockProps = {
    documents: [],
    clients: [],
    stats: {
      totalDocuments: 150,
      activeClients: 45,
      emailEngagement: 68,
      timeSaved: 2.4
    },
    onDocumentUpload: vi.fn(),
    onClientSave: vi.fn(),
    onCampaignLaunch: vi.fn()
  };

  it('should render dashboard stats', () => {
    render(
      <BrowserRouter>
        <Dashboard {...mockProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('2.4h')).toBeInTheDocument();
  });

  it('should open upload modal on click', () => {
    render(
      <BrowserRouter>
        <Dashboard {...mockProps} />
      </BrowserRouter>
    );

    const uploadButton = screen.getByText('Upload Document');
    fireEvent.click(uploadButton);

    // Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

### E2E Test Example

**Testing User Flow** (Playwright):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Document Upload Flow', () => {
  test('should upload document successfully', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5051');

    // Click upload button
    await page.click('text=Upload Document');

    // Fill form
    await page.fill('input[name="title"]', 'Test Document');
    await page.selectOption('select[name="type"]', 'contract');

    // Upload file
    await page.setInputFiles('input[type="file"]', './test-files/sample.pdf');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('text=Test Document')).toBeVisible();
  });
});
```

---

## Test Coverage Goals

### Immediate (Week 1-2)

- [ ] JWT utility tests (10 tests) ✅ IMPLEMENTED
- [ ] Auth controller tests (15 tests) ✅ PARTIALLY IMPLEMENTED
- [ ] Auth middleware tests (8 tests)
- [ ] Error middleware tests (6 tests)
- [ ] Auth API integration tests (10 tests)

**Target**: 49 tests, ~50% backend coverage

### Short-term (Week 3-4)

- [ ] Document controller tests (12 tests)
- [ ] Client controller tests (10 tests)
- [ ] Campaign controller tests (10 tests)
- [ ] Document API integration tests (8 tests)
- [ ] Client API integration tests (8 tests)
- [ ] Campaign API integration tests (8 tests)
- [ ] Dashboard component tests (8 tests)
- [ ] Modal component tests (12 tests)

**Target**: 117 tests total, ~70% coverage

### Long-term (Week 5-6)

- [ ] All component tests (40 tests)
- [ ] E2E user flow tests (8 tests)
- [ ] Performance tests (5 tests)
- [ ] Security tests (15 tests)

**Target**: 185+ tests, 85% coverage

---

## Running Tests in CI/CD

### Update GitHub Actions

**Temporary Fix** (until tests are implemented):
```yaml
# .github/workflows/ci.yml
jobs:
  unit-tests:
    steps:
      - name: Run unit tests
        run: npm run test:unit
        continue-on-error: true  # Allow failure temporarily
```

**Production Configuration** (after tests implemented):
```yaml
jobs:
  unit-tests:
    steps:
      - name: Run unit tests
        run: npm run test:unit

      - name: Check coverage threshold
        run: |
          npm run test:coverage
          npm run coverage:check
```

---

## Test Data Management

### Test Fixtures

Create test data factories:

```typescript
// backend/src/__tests__/fixtures/user.fixture.ts
export const createTestUser = (overrides = {}) => ({
  id: 'test_user_' + Date.now(),
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'agent',
  createdAt: new Date(),
  ...overrides
});

export const createTestDocument = (overrides = {}) => ({
  id: 'test_doc_' + Date.now(),
  title: 'Test Document',
  type: 'contract',
  status: 'active',
  uploadDate: new Date(),
  ...overrides
});
```

### Mock Services

```typescript
// backend/src/__tests__/mocks/jwt.mock.ts
export const mockJWTService = {
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }),
  verifyAccessToken: jest.fn().mockReturnValue({
    userId: 'test_user_123',
    email: 'test@example.com',
    role: 'agent'
  }),
  verifyRefreshToken: jest.fn()
};
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names:
```typescript
// ❌ Bad
it('test 1', () => { ... });

// ✅ Good
it('should return 401 when token is invalid', () => { ... });
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should create user with valid data', async () => {
  // Arrange
  const userData = { email: 'test@example.com', password: 'Pass123!' };

  // Act
  const result = await userService.createUser(userData);

  // Assert
  expect(result).toHaveProperty('id');
  expect(result.email).toBe(userData.email);
});
```

### 3. Test Independence

Each test should be independent:
```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
});
```

### 4. Avoid Test Interdependence

```typescript
// ❌ Bad - tests depend on order
it('creates user', () => { /* saves to shared state */ });
it('updates user', () => { /* reads from shared state */ });

// ✅ Good - tests are independent
it('creates user', () => { /* creates and cleans up */ });
it('updates user', () => { /* creates, updates, cleans up */ });
```

### 5. Use Meaningful Assertions

```typescript
// ❌ Bad
expect(result).toBeTruthy();

// ✅ Good
expect(result).toHaveProperty('id');
expect(result.email).toBe('test@example.com');
expect(result.role).toBe('agent');
```

---

## Troubleshooting

### Common Issues

**Issue**: "Cannot find module" errors
```bash
# Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Issue**: Tests timeout
```typescript
// Solution: Increase timeout
jest.setTimeout(10000); // 10 seconds
```

**Issue**: Mocks not working
```typescript
// Solution: Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
```

---

## Next Steps

1. **Review implemented tests**:
   - `/backend/src/__tests__/utils/jwt.test.ts`
   - `/backend/src/__tests__/controllers/auth.controller.test.ts`

2. **Run implemented tests**:
   ```bash
   cd backend
   npm test
   ```

3. **Implement remaining tests** using this guide as reference

4. **Monitor coverage**:
   ```bash
   npm test -- --coverage
   ```

5. **Update CI/CD** when tests are implemented

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

**Need Help?** Review the example tests in `/backend/src/__tests__/` or consult the Test Engineering team.
