import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitlistService {
  /** Stub: waitlist logic can be implemented or delegated via NATS */
  async add(_email: string): Promise<void> {}

  async checkCouponCode(_payload: { email: string; couponCode: string }): Promise<{ valid: boolean }> {
    return { valid: true };
  }

  async markPromoCodeAsUsed(_email: string, _couponCode: string): Promise<void> {}
}
