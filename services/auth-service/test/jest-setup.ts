// Global test timeout

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  log: () => { },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  debug: () => { },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  info: () => { },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  warn: () => { },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  error: () => { },
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '10';
