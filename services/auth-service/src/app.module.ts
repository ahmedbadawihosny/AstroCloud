import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsModule } from '@file-sharing-app/common';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/auth_db'),
    NatsModule,
    AuthModule,
    AccountModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
