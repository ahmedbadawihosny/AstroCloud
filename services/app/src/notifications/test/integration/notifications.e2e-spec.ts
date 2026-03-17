import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../../../notification-service/src/app.module';
import { AppController } from '../../../../../notification-service/src/app.controller';
import { NotificationsController } from '../../../../../notification-service/src/notifications/notifications.controller';
import { NotificationsService } from '../../../../../notification-service/src/notifications/notifications.service';

describe('Notification Service E2E', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('boots the app module and exposes health handlers', () => {
    const appController = moduleRef.get(AppController);
    const notificationsController = moduleRef.get(NotificationsController);
    const notificationsService = moduleRef.get(NotificationsService);
    const appHealth = appController.getNotificationsHealth() as {
      service: string;
    };

    expect(appHealth.service).toBe('Notifications Service');
    expect(notificationsController.healthHttp()).toEqual({ status: 'ok' });
    expect(notificationsService.health()).toEqual({ status: 'ok' });
  });
});

