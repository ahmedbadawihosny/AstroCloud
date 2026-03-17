import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  health() {
    return { status: 'ok' };
  }

  handleUserCreated(payload: Record<string, unknown>) {
    this.logger.log(`user_created event received: ${JSON.stringify(payload)}`);
    return { accepted: true };
  }

  handleFileUploaded(payload: Record<string, unknown>) {
    this.logger.log(`file_uploaded event received: ${JSON.stringify(payload)}`);
    return { accepted: true };
  }

  handleFileDeleted(payload: Record<string, unknown>) {
    this.logger.log(`file_deleted event received: ${JSON.stringify(payload)}`);
    return { accepted: true };
  }

  handleFileShared(payload: Record<string, unknown>) {
    this.logger.log(`file_shared event received: ${JSON.stringify(payload)}`);
    return { accepted: true };
  }
}
