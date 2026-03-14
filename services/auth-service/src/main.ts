import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

// Load .env from service directory (works when run from monorepo root via pnpm run dev)
dotenv.config({ path: path.join(process.cwd(), '.env') });
if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || 'nats://localhost:4222'],
    },
  });
  await app.startAllMicroservices();
}

bootstrap();
