import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { disconnect } from 'mongoose';

let mongod: any;

export const setupTestApp = async (imports: any[] = []) => {
  // For now, use a mock MongoDB URI since mongodb-memory-server isn't installed
  const uri = 'mongodb://localhost:27017/test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      MongooseModule.forRoot(uri),
      ...imports,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  return {
    app,
    module: moduleFixture,
    mongoUri: uri,
  };
};

export const teardownTestApp = async () => {
  await disconnect();
  // Note: mongod cleanup would go here if using mongodb-memory-server
};

export const createMockUser = (overrides: Partial<any> = {}) => {
  return {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
};

export const createMockAccount = (overrides: Partial<any> = {}) => {
  return {
    userId: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      notifications: true,
    },
    ...overrides,
  };
};
