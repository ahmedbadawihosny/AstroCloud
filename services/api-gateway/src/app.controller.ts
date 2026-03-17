import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Controller, Get } from '@nestjs/common';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

const HEALTH_TIMEOUT_MS = 4000;

function unreachableResponse(serviceName: string) {
  return {
    status: 'Unreachable',
    service: serviceName,
    message: 'Service did not respond. Ensure NATS is running and the service is started.',
    timestamp: new Date().toISOString(),
  };
}

@ApiTags('Gateway')
@Controller('api/v1')
export class AppController {
  constructor(@Inject('NATS_SERVICE') private natsClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get gateway status' })
  @ApiResponse({ status: 200, description: 'Gateway is running' })
  getHealth(): object {
    return {
      status: 'Healthy!',
      service: 'API Gateway Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  // Backend Services
  @Get('auth/health')
  @ApiOperation({ summary: 'Get auth service health' })
  @ApiResponse({ status: 200, description: 'Auth service is running or unreachable' })
  async getAuthHealth() {
    const response = this.natsClient.send({ cmd: 'getAuthHealth' }, {}).pipe(
      timeout(HEALTH_TIMEOUT_MS),
      catchError(() => of(unreachableResponse('Auth Service'))),
    );
    return firstValueFrom(response);
  }

  @Get('file/health')
  @ApiOperation({ summary: 'Get files service health' })
  @ApiResponse({ status: 200, description: 'Files service is running or unreachable' })
  async getFilesHealth() {
    const response = this.natsClient.send({ cmd: 'getFilesHealth' }, {}).pipe(
      timeout(HEALTH_TIMEOUT_MS),
      catchError(() => of(unreachableResponse('Files Service'))),
    );
    return firstValueFrom(response);
  }

  @Get('notification/health')
  @ApiOperation({ summary: 'Get notifications service health' })
  @ApiResponse({ status: 200, description: 'Notifications service is running or unreachable' })
  async getNotificationsHealth() {
    const response = this.natsClient
      .send({ cmd: 'getNotificationsHealth' }, {})
      .pipe(
        timeout(HEALTH_TIMEOUT_MS),
        catchError(() => of(unreachableResponse('Notifications Service'))),
      );
    return firstValueFrom(response);
  }
}
