import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns notification health payload', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);
    const result = controller.getNotificationsHealth() as any;

    expect(result).toEqual({
      status: 'Healthy!',
      service: 'Notifications Service',
      version: '1.0.0',
      timestamp: expect.any(String) as unknown as string,
    });
  });
});

