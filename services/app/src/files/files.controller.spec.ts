import { Test } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  it('should delegate NATS patterns to FilesService', async () => {
    const filesService = {
      upload: jest.fn().mockResolvedValue({ ok: true }),
      list: jest.fn().mockResolvedValue({ ok: true }),
      get: jest.fn().mockResolvedValue({ ok: true }),
      delete: jest.fn().mockResolvedValue({ ok: true }),
      share: jest.fn().mockResolvedValue({ ok: true }),
      getShareDownload: jest.fn().mockResolvedValue({ data: {} }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: filesService }],
    }).compile();

    const controller = moduleRef.get(FilesController);

    await controller.upload({ userId: 'u', file: {} } as any);
    expect(filesService.upload).toHaveBeenCalled();

    await controller.list({ userId: 'u' } as any);
    expect(filesService.list).toHaveBeenCalledWith('u');

    await controller.get({ fileId: 'f', userId: 'u' } as any);
    expect(filesService.get).toHaveBeenCalledWith('f', 'u');

    await controller.delete({ fileId: 'f', userId: 'u' } as any);
    expect(filesService.delete).toHaveBeenCalledWith('f', 'u');

    await controller.share({
      fileId: 'f',
      userId: 'u',
      expiresInSeconds: 10,
    } as any);
    expect(filesService.share).toHaveBeenCalledWith('f', 'u', 10);

    await controller.getShareDownload({ token: 't' });
    expect(filesService.getShareDownload).toHaveBeenCalledWith('t');
  });
});
