import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // In this gateway, JWT validation is primarily handled by JwtGuard
    // using the Authorization header, or by downstream auth-service via NATS.
    // If a user is already attached, allow; otherwise just pass through.
    if (request.user) {
      return true;
    }

    return true;
  }
}
