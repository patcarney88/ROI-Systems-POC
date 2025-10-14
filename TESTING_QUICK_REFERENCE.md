# Testing Quick Reference - ROI Systems POC

Quick reference guide for testing in the ROI Systems project.

---

## Current Status

| Metric | Value | Status |
|--------|-------|--------|
| Test Coverage | 0% | CRITICAL |
| Tests Written | 2 test files | Started |
| Tests Needed | 198+ tests | In Progress |
| CI/CD Status | Failing | Needs Fix |
| Production Ready | NO | High Risk |

---

## Quick Commands

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Run specific test file
npm test jwt.test.ts

# Run specific test suite
npm test -- --testNamePattern="Auth Controller"
```

### Frontend Tests

```bash
cd frontend

# Install dependencies first
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Run all tests
npm test

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# With coverage
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
```

---

## Files Created

### Test Configuration
- `/backend/jest.config.js` - Backend Jest configuration
- `/backend/src/__tests__/setup.ts` - Backend test setup
- `/frontend/vitest.config.ts` - Frontend Vitest configuration
- `/frontend/src/test/setup.ts` - Frontend test setup

### Test Files (Examples)
- `/backend/src/__tests__/utils/jwt.test.ts` - JWT utility tests (10 tests)
- `/backend/src/__tests__/controllers/auth.controller.test.ts` - Auth controller tests (15 tests)

### Documentation
- `/TESTING_INFRASTRUCTURE_ANALYSIS.md` - Comprehensive analysis (877 lines)
- `/TEST_IMPLEMENTATION_GUIDE.md` - Implementation guide (540 lines)
- `/TESTING_QUICK_REFERENCE.md` - This file

---

## Test Structure

```
ROI-Systems-POC/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts                    ✅ Created
│   │   │   ├── utils/
│   │   │   │   └── jwt.test.ts             ✅ Created (10 tests)
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.test.ts ✅ Created (15 tests)
│   │   │   │   ├── client.controller.test.ts    (TODO)
│   │   │   │   ├── document.controller.test.ts  (TODO)
│   │   │   │   └── campaign.controller.test.ts  (TODO)
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.test.ts      (TODO)
│   │   │   │   ├── error.middleware.test.ts     (TODO)
│   │   │   │   └── validation.middleware.test.ts (TODO)
│   │   │   └── integration/
│   │   │       ├── auth.integration.test.ts      (TODO)
│   │   │       ├── documents.integration.test.ts (TODO)
│   │   │       ├── clients.integration.test.ts   (TODO)
│   │   │       └── campaigns.integration.test.ts (TODO)
│   └── jest.config.js                      ✅ Created
│
├── frontend/
│   ├── src/
│   │   ├── test/
│   │   │   └── setup.ts                    ✅ Created
│   │   ├── pages/
│   │   │   ├── Dashboard.test.tsx               (TODO)
│   │   │   ├── Documents.test.tsx               (TODO)
│   │   │   ├── Clients.test.tsx                 (TODO)
│   │   │   ├── Campaigns.test.tsx               (TODO)
│   │   │   └── Analytics.test.tsx               (TODO)
│   │   └── modals/
│   │       ├── DocumentUploadModal.test.tsx     (TODO)
│   │       ├── ClientModal.test.tsx             (TODO)
│   │       └── CampaignModal.test.tsx           (TODO)
│   └── vitest.config.ts                    ✅ Created
│
└── tests/
    └── e2e/
        ├── auth.e2e.test.ts                     (TODO)
        ├── document-upload.e2e.test.ts          (TODO)
        ├── client-management.e2e.test.ts        (TODO)
        └── campaign-flow.e2e.test.ts            (TODO)
```

---

## Installation Commands

### Install Backend Testing Dependencies
```bash
cd backend
# Already installed: jest, @types/jest, ts-jest

# Install additional dependencies:
npm install --save-dev supertest @types/supertest
```

### Install Frontend Testing Dependencies
```bash
cd frontend
# Need to install:
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom
```

### Install E2E Testing Dependencies
```bash
# From project root:
npm install --save-dev @playwright/test
npx playwright install
```

---

## Testing Priorities

### Phase 1: Foundation (Week 1-2) - 49 tests

**Completed**:
- ✅ JWT utility tests (10 tests)
- ✅ Auth controller tests (15 tests - partial)

**TODO**:
- [ ] Auth middleware tests (8 tests)
- [ ] Error middleware tests (6 tests)
- [ ] Auth API integration tests (10 tests)

### Phase 2: Expansion (Week 3-4) - 68 tests

- [ ] Document controller tests (12 tests)
- [ ] Client controller tests (10 tests)
- [ ] Campaign controller tests (10 tests)
- [ ] Document API tests (8 tests)
- [ ] Client API tests (8 tests)
- [ ] Campaign API tests (8 tests)
- [ ] Dashboard component tests (8 tests)
- [ ] Modal component tests (12 tests)

### Phase 3: Complete (Week 5-6) - 81 tests

- [ ] Remaining component tests (40 tests)
- [ ] E2E tests (8 tests)
- [ ] Performance tests (5 tests)
- [ ] Security tests (15 tests)

---

## Coverage Goals

| Timeframe | Target Coverage | Tests Needed |
|-----------|----------------|--------------|
| Current | 0% | 0 tests |
| Week 2 | 50% | 49 tests |
| Week 4 | 70% | 117 tests |
| Week 6 | 85% | 198+ tests |

---

## Common Test Patterns

### Backend Controller Test
```typescript
describe('Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = { body: {} };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should do something', async () => {
    // Arrange
    mockRequest.body = { /* test data */ };

    // Act
    await controller.method(mockRequest as Request, mockResponse as Response);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });
});
```

### Backend Integration Test
```typescript
import request from 'supertest';
import app from '../../index';

describe('API Endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Frontend Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('should render', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const onClick = vi.fn();
    render(<Component onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## CI/CD Integration

### Current Status
- CI pipeline configured but tests missing
- 4 out of 5 jobs will fail without tests
- Need to implement tests before enabling full CI

### Temporary CI Fix
Edit `.github/workflows/ci.yml`:
```yaml
jobs:
  unit-tests:
    steps:
      - name: Run unit tests
        run: npm run test:unit
        continue-on-error: true  # Temporary
```

### Production CI Configuration
Once tests are implemented:
```yaml
jobs:
  unit-tests:
    steps:
      - name: Run unit tests
        run: npm run test:unit

      - name: Check coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Next Steps

1. **Install Frontend Testing Dependencies**:
   ```bash
   cd frontend
   npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Run Existing Tests**:
   ```bash
   cd backend
   npm test
   ```

3. **Write Priority Tests**:
   - Auth middleware tests
   - Error middleware tests
   - Auth API integration tests

4. **Fix CI Pipeline**:
   - Add `continue-on-error: true` to failing jobs
   - Remove once tests are implemented

5. **Monitor Coverage**:
   ```bash
   npm test -- --coverage
   ```

---

## Resources

- **Full Analysis**: `TESTING_INFRASTRUCTURE_ANALYSIS.md`
- **Implementation Guide**: `TEST_IMPLEMENTATION_GUIDE.md`
- **Example Tests**: `/backend/src/__tests__/`

---

## Critical Issues

1. **0% Test Coverage**: No tests for production code
2. **CI/CD Failing**: Pipeline expects tests that don't exist
3. **Production Risk**: Cannot deploy safely without tests
4. **Security Risk**: No validation of authentication/authorization
5. **Regression Risk**: No protection against breaking changes

---

## Immediate Actions Required

- [ ] Install frontend testing dependencies
- [ ] Run existing backend tests to verify setup
- [ ] Write auth middleware tests (CRITICAL)
- [ ] Write auth API integration tests (CRITICAL)
- [ ] Fix CI/CD pipeline
- [ ] Document test results

---

## Success Metrics

**Week 2 Goals**:
- 50% test coverage
- 49 tests passing
- CI pipeline stable
- Critical paths tested

**Week 4 Goals**:
- 70% test coverage
- 117 tests passing
- All API endpoints tested
- Main components tested

**Week 6 Goals**:
- 85% test coverage
- 198+ tests passing
- E2E tests implemented
- Production ready

---

**Last Updated**: October 14, 2025
**Status**: In Progress - Foundation Phase
**Priority**: CRITICAL
