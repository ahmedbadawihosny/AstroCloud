import { Module } from '@nestjs/common';
import { ShareProxyController } from './share-proxy.controller';

@Module({
  controllers: [ShareProxyController],
})
export class ShareProxyModule {}
