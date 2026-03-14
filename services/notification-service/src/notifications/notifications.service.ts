import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  health() {
    return { status: 'ok' };
  }

  // Subscribes to: user_created, file_uploaded, file_deleted, file_shared (NATS)
  // Sends emails/webhooks/logs; idempotent with eventId
}
