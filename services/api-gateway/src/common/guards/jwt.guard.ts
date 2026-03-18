import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    const cookieToken: string | undefined = request.cookies?.accessToken;
    console.log('[JwtGuard] request.cookies:', request.cookies);
    console.log('[JwtGuard] request.headers.authorization:', authHeader);

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : cookieToken?.trim();
    console.log('[JwtGuard] extracted token:', {
      source: authHeader?.startsWith('Bearer ') ? 'header' : 'cookie',
      tokenLength: token?.length ?? 0,
    });

    if (!token) {
      throw new UnauthorizedException(
        'Missing access token in Authorization header or cookies',
      );
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret:
          process.env.JWT_ACCESS_SECRET ||
          process.env.JWT_SECRET ||
          'supersecret',
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

