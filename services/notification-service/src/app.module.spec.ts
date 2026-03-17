import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';

describe('AppModule', () => {
  it('compiles with notification controllers and service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(AppController)).toBeDefined();
    expect(moduleRef.get(NotificationsController)).toBeDefined();
    expect(moduleRef.get(NotificationsService)).toBeDefined();
  });
});

