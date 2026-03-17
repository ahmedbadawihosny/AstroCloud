import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NatsClient } from '@file-sharing-app/common';
import { STORAGE_PROVIDER } from '../storage/storage.interface';
import { File } from '../files/file.schema';
import { ShareLink } from './share-link.schema';
import { ShareService } from './share.service';

describe('ShareService', () => {
  const fileId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  const fileDoc = {
    _id: fileId,
    userId,
    originalName: 'a.txt',
    storageKey: 'k',
    deletedAt: null,
  };

  const shareDoc = {
    _id: new Types.ObjectId(),
    fileId,
    userId,
    tokenHash: 'hash',
    expiresAt: new Date('2026-12-31T00:00:00.000Z'),
  };

  const shareModel = {
    create: jest.fn().mockResolvedValue(shareDoc),
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(shareDoc),
    }),
  };

  const fileModel = {
    findById: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(fileDoc),
    }),
  };

  const storage = {
    getSignedUrl: jest.fn().mockResolvedValue('https://signed.share-url.test'),
  };

  const nats = { publish: jest.fn().mockResolvedValue(undefined) };

  async function createModule() {
    return Test.createTestingModule({
      providers: [
        ShareService,
        { provide: getModelToken(ShareLink.name), useValue: shareModel },
        { provide: getModelToken(File.name), useValue: fileModel },
        { provide: STORAGE_PROVIDER, useValue: storage },
        { provide: NatsClient, useValue: nats },
      ],
    }).compile();
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a share token and emits an event', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(ShareService);

    const result = await service.createShare(userId.toString(), fileId.toString(), 600);

    expect(shareModel.create).toHaveBeenCalled();
    expect(nats.publish).toHaveBeenCalledTimes(1);
    expect(result.token).toBeTruthy();
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('returns a signed download link for a valid token', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(ShareService);

    const result = await service.download('plain-token');

    expect(storage.getSignedUrl).toHaveBeenCalledTimes(1);
    expect(result.data.downloadUrl).toBe('https://signed.share-url.test');
    expect(result.data.fileId).toBe(fileId.toString());
  });
});

