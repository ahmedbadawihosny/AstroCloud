import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NatsClient } from '@file-sharing-app/common';
import { STORAGE_PROVIDER } from '../storage/storage.interface';
import { ShareService } from '../share/share.service';
import { File } from './file.schema';
import { FilesService } from './files.service';

describe('FilesService', () => {
  const fileDoc = {
    _id: new Types.ObjectId(),
    originalName: 'a.txt',
    storageKey: 'u/1-a.txt',
    size: 3,
    mimeType: 'text/plain',
    checksumSha256: 'checksum',
    metadata: { folder: 'docs' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    save: jest.fn().mockResolvedValue(undefined),
  };

  const fileModel = {
    create: jest.fn().mockResolvedValue(fileDoc),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([fileDoc]),
      }),
    }),
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(fileDoc),
    }),
  };

  const storage = {
    putObject: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.test'),
    deleteObject: jest.fn().mockResolvedValue(undefined),
  };

  const nats = { publish: jest.fn().mockResolvedValue(undefined) };
  const shareService = {
    createShare: jest.fn().mockResolvedValue({
      token: 'share-token',
      expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    }),
  };

  async function createModule() {
    return Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getModelToken(File.name), useValue: fileModel },
        { provide: STORAGE_PROVIDER, useValue: storage },
        { provide: NatsClient, useValue: nats },
        { provide: ShareService, useValue: shareService },
      ],
    }).compile();
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads files with metadata and emits an event', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(FilesService);

    const result = await service.upload({
      userId: new Types.ObjectId().toString(),
      file: {
        buffer: Buffer.from('hey'),
        originalname: 'a.txt',
        mimetype: 'text/plain',
      },
      metadata: { folder: 'docs' },
    });

    expect(storage.putObject).toHaveBeenCalledTimes(1);
    expect(fileModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: 'a.txt',
        metadata: { folder: 'docs' },
      }),
    );
    expect(storage.getSignedUrl).toHaveBeenCalledTimes(1);
    expect(nats.publish).toHaveBeenCalledTimes(1);
    expect(result.data.downloadUrl).toBe('https://signed-url.test');
  });

  it('rejects uploads larger than 100MB', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(FilesService);

    await expect(
      service.upload({
        userId: new Types.ObjectId().toString(),
        file: {
          buffer: Buffer.alloc(100 * 1024 * 1024 + 1),
          originalname: 'huge.bin',
          mimetype: 'application/octet-stream',
        },
      }),
    ).rejects.toThrow('File exceeds the maximum upload size of 100MB');
  });

  it('returns metadata and a signed download url for file details', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(FilesService);

    const result = await service.get(fileDoc._id.toString(), new Types.ObjectId().toString());

    expect(result.data.downloadUrl).toBe('https://signed-url.test');
    expect(result.data.metadata).toEqual({ folder: 'docs' });
  });

  it('creates share links with the public gateway path', async () => {
    const moduleRef = await createModule();
    const service = moduleRef.get(FilesService);

    const result = await service.share(
      fileDoc._id.toString(),
      new Types.ObjectId().toString(),
      600,
    );

    expect(shareService.createShare).toHaveBeenCalledWith(
      expect.any(String),
      fileDoc._id.toString(),
      600,
    );
    expect(result.data.shareUrl).toBe(`/api/v1/share/share-token`);
  });
});

