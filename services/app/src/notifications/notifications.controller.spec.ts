import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  it('delegates health checks and event handling to NotificationsService', async () => {
    const notificationsService = {
      health: jest.fn().mockReturnValue({ status: 'ok' }),
      handleUserCreated: jest.fn().mockReturnValue({ accepted: true }),
      handleFileUploaded: jest.fn().mockReturnValue({ accepted: true }),
      handleFileDeleted: jest.fn().mockReturnValue({ accepted: true }),
      handleFileShared: jest.fn().mockReturnValue({ accepted: true }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: notificationsService }],
    }).compile();

    const controller = moduleRef.get(NotificationsController);

    // Test NATS health check
    expect(controller.healthNats({})).toEqual({ status: 'ok' });
    expect(notificationsService.health).toHaveBeenCalledTimes(1);

    // Test event handlers
    expect(controller.handleUserCreated({ userId: '1' })).toEqual({ accepted: true });
    expect(controller.handleFileUploaded({ fileId: '2' })).toEqual({ accepted: true });
    expect(controller.handleFileDeleted({ fileId: '3' })).toEqual({ accepted: true });
    expect(controller.handleFileShared({ fileId: '4' })).toEqual({ accepted: true });

    expect(notificationsService.handleUserCreated).toHaveBeenCalledWith({ userId: '1' });
    expect(notificationsService.handleFileUploaded).toHaveBeenCalledWith({ fileId: '2' });
    expect(notificationsService.handleFileDeleted).toHaveBeenCalledWith({ fileId: '3' });
    expect(notificationsService.handleFileShared).toHaveBeenCalledWith({ fileId: '4' });
  });
});
