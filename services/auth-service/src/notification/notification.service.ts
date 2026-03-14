import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  /** Stub: notifications are sent via NATS / notification-service in production */
  async send(_payload: Record<string, unknown>): Promise<void> {}

  async sendEmailVerification(_payload: Record<string, unknown>): Promise<void> {}

  async sendWelcomeEmail(_payload: Record<string, unknown>): Promise<void> {}

  async sendPasswordResetCode(_payload: Record<string, unknown>): Promise<void> {}
}
