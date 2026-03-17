import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

// Load .env from service directory (works when run from monorepo root via pnpm run dev)
dotenv.config({ path: path.join(process.cwd(), '.env') });
if (!process.env.MONGODB_URI_AUTH || !process.env.MONGODB_URI_FILE_SHARING) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Connect to NATS microservice (no HTTP server - only NATS communication)
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';

  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [natsUrl],
    },
  });

  // Start all microservices
  await app.startAllMicroservices();

  console.log(`App Service running via NATS only`);
  console.log(`NATS connected to: ${natsUrl}`);
  console.log(`No HTTP server - communicates via NATS with API Gateway`);
}

bootstrap();
