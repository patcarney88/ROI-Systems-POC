# Running Tests - ROI Systems

This guide explains how to run tests for the ROI Systems platform.

## Prerequisites

- Node.js 18+ installed
- Dependencies installed (`npm install`)
- Environment variables configured (see `.env.example`)

## Backend Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Tests with Coverage
```bash
cd backend
npm test -- --coverage
```

### Run Specific Test File
```bash
cd backend
npm test -- src/__tests__/middleware/auth.test.ts
```

### Run Tests Matching Pattern
```bash
cd backend
npm test -- --testPathPattern="auth|jwt"
```

### Run Tests in Watch Mode
```bash
cd backend
npm test:watch
```

### View Coverage Report (HTML)
```bash
cd backend
npm test -- --coverage
open coverage/index.html
```

## Frontend Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests with Coverage
```bash
cd frontend
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
cd frontend
npm run test:watch
```

### Run Tests with UI
```bash
cd frontend
npm run test:ui
```

## Test Output

### Successful Test Run
```
PASS src/__tests__/middleware/auth.test.ts
  Auth Middleware - SECURITY CRITICAL
    ✓ Valid JWT token authenticates successfully
    ✓ Invalid JWT token is rejected
    ...
    
Test Suites: 4 passed, 4 total
Tests:       47 passed, 47 total
Coverage:    76.08% statements, 57.62% branches
```

### Failed Test Run
```
FAIL src/__tests__/middleware/auth.test.ts
  Auth Middleware - SECURITY CRITICAL
    ✕ should reject invalid token
    
  Expected: 401
  Received: 200
```

## Coverage Thresholds

### Current Thresholds (Week 1)
- **Statements**: 30%
- **Branches**: 30%
- **Functions**: 30%
- **Lines**: 30%

### Actual Coverage (Week 1)
- **Statements**: 76.08%
- **Branches**: 57.62%
- **Functions**: 76%
- **Lines**: 74.85%

## CI/CD Pipeline

Tests run automatically on:
- **Pull Requests**: Full test suite + coverage
- **Commits to main**: Integration tests
- **Nightly**: E2E + performance tests

### View CI Results
- GitHub Actions: `.github/workflows/ci.yml`
- Coverage Reports: Codecov or Coveralls

## Common Issues

### Issue: Tests Fail with "Cannot find module"
**Solution**: Install dependencies
```bash
npm install
```

### Issue: JWT_SECRET not set
**Solution**: Set environment variables in test setup
```bash
# Already configured in src/__tests__/setup.ts
export JWT_SECRET="test-jwt-secret-minimum-32-characters-long-for-security"
```

### Issue: Tests timeout
**Solution**: Increase timeout in jest.config.js
```javascript
testTimeout: 10000
```

### Issue: Coverage below threshold
**Solution**: Write more tests or adjust threshold
```javascript
coverageThreshold: {
  global: {
    branches: 30,
    functions: 30,
    lines: 30,
    statements: 30
  }
}
```

## Debugging Tests

### Run Single Test with Verbose Output
```bash
npm test -- --verbose --testNamePattern="should reject invalid token"
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Add Debug Logging
```typescript
it('should do something', () => {
  console.log('Debug:', variableToDebug);
  expect(result).toBe(expected);
});
```

## Test Files Location

### Backend
```
backend/
  src/
    __tests__/
      controllers/
        auth.controller.test.ts
      middleware/
        auth.test.ts
        errorHandler.test.ts
      utils/
        jwt.test.ts
      setup.ts
```

### Frontend
```
frontend/
  src/
    test/
      setup.ts
      utils.tsx
    components/
      __tests__/
        Component.test.tsx
```

## Environment Variables for Testing

```bash
# Backend (.env.test)
NODE_ENV=test
JWT_SECRET=test-jwt-secret-minimum-32-characters-long-for-security
JWT_REFRESH_SECRET=test-refresh-secret-minimum-32-characters-long-different
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

## Performance

### Test Execution Times (Week 1)
- **Total**: ~2 seconds
- **Unit Tests**: ~1.5 seconds
- **Integration Tests**: ~0.5 seconds

### Optimization Tips
- Use `jest.mock()` for external dependencies
- Run tests in parallel (default)
- Use `--maxWorkers=50%` for resource limits
- Cache test results with `--cache`

## Next Steps

- Week 2: Add integration tests
- Week 3: Add E2E tests
- Week 4: Performance testing
- Week 6: Full test suite coverage

## Support

For issues or questions:
- Check [Testing Strategy](./TESTING_STRATEGY.md)
- Review test examples in `__tests__/`
- Contact: Test Engineering Team

---

**Last Updated**: 2025-01-14  
**Status**: Week 1 Complete - All Tests Passing (47/47)
