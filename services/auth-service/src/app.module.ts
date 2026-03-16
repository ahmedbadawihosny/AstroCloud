import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NatsModule } from '@file-sharing-app/common';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
    NatsModule,
    AuthModule,
    AccountModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
