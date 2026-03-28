import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  it('health returns ok', () => {
    expect(service.health()).toEqual({ status: 'ok' });
  });

  it('handles user created events', () => {
    const payload = { userId: 'user123', email: 'test@example.com' };
    const result = service.handleUserCreated(payload);
    expect(result).toEqual({ accepted: true });
  });

  it('handles file uploaded events', () => {
    const payload = { fileId: 'file123', userId: 'user123', filename: 'test.txt' };
    const result = service.handleFileUploaded(payload);
    expect(result).toEqual({ accepted: true });
  });

  it('handles file deleted events', () => {
    const payload = { fileId: 'file123', userId: 'user123' };
    const result = service.handleFileDeleted(payload);
    expect(result).toEqual({ accepted: true });
  });

  it('handles file shared events', () => {
    const payload = {
      fileId: 'file123',
      userId: 'user123',
      shareId: 'share-uuid',
      expiresAt: new Date().toISOString(),
    };
    const result = service.handleFileShared(payload);
    expect(result).toEqual({ accepted: true });
  });
});
