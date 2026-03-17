# Auth Service Test Setup

This document describes the test setup for the auth-service.

## Test Structure

- **Unit Tests**: Located in `test/` directory
  - `auth.service.spec.ts` - Tests for AuthService
  - `account.service.spec.ts` - Tests for AccountService
- **Integration Tests**: Located in `test/integration/` directory
  - `auth.e2e.spec.ts` - End-to-end tests for complete user flows
- **Test Utilities**: Located in `test/` directory
  - `setup.ts` - Test setup utilities and mock helpers
  - `jest-setup.ts` - Global Jest configuration

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests only
npm run test:e2e

# Run tests in debug mode
npm run test:debug
```

## Test Configuration

### Jest Configuration
- Main config: `jest.config.js`
- E2E config: `test/jest-e2e.json`
- Global setup: `test/jest-setup.ts`

### Environment Variables for Tests
Tests use the following environment variables (automatically set in `jest-setup.ts`):
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret`
- `JWT_EXPIRES_IN=1h`
- `BCRYPT_ROUNDS=10`

### Database Configuration
Tests currently use a mock MongoDB URI. For production testing, consider installing `mongodb-memory-server` and updating `test/setup.ts`.

## Test Coverage

The test suite covers:
- User registration and email verification
- Login and token management
- Account management operations
- Password reset flows
- Error handling and edge cases
- Complete user journey integration tests

## Mock Data

Test utilities provide mock data generators:
- `createMockUser()` - Creates mock user data
- `createMockAccount()` - Creates mock account data

## Notes

- TypeScript errors related to Jest types are expected in the IDE but tests will run correctly
- The test setup uses mock implementations for external dependencies (NATS, S3, etc.)
- Integration tests require a running MongoDB instance for full functionality
