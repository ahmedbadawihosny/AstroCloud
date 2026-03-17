import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('health returns ok', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    const service = moduleRef.get(NotificationsService);
    expect(service.health()).toEqual({ status: 'ok' });
  });
});

