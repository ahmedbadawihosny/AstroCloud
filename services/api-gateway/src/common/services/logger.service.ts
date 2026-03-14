import { Injectable, Logger, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger = new Logger('ApiGateway');

  log(message: string, context?: unknown): void {
    this.logger.log(message, context as string | undefined);
  }

  error(message: string, trace?: string, context?: unknown): void {
    this.logger.error(message, trace, context as string | undefined);
  }

  warn(message: string, context?: unknown): void {
    this.logger.warn(message, context as string | undefined);
  }

  debug(message: string, context?: unknown): void {
    this.logger.debug(message, context as string | undefined);
  }

  verbose(message: string, context?: unknown): void {
    this.logger.verbose(message, context as string | undefined);
  }

  // Convenience helpers for any existing call sites
  logRequest(message: string, meta?: Record<string, unknown>): void {
    this.logger.log(message, JSON.stringify(meta ?? {}));
  }

  logResponse(message: string, meta?: Record<string, unknown>): void {
    this.logger.log(message, JSON.stringify(meta ?? {}));
  }
}
