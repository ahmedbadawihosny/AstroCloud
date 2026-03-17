import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NatsClient } from '@file-sharing-app/common';
import { AppModule } from '../../src/app.module';

jest.setTimeout(120000);

const describeIfMongo = process.env.E2E_MONGODB_URI ? describe : describe.skip;

describeIfMongo('File Service E2E (opt-in)', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        MongooseModule.forRoot(process.env.E2E_MONGODB_URI as string),
        AppModule,
      ],
    })
      .overrideProvider(NatsClient)
      .useValue({ publish: jest.fn() })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (moduleRef) await moduleRef.close();
  });

  it('boots app module', async () => {
    expect(app).toBeDefined();
  });
});

