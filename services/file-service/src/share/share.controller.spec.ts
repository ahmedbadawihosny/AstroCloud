import { Test } from '@nestjs/testing';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';

describe('ShareController', () => {
  it('should delegate download to ShareService', async () => {
    const shareService = {
      download: jest.fn().mockResolvedValue({ ok: true }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ShareController],
      providers: [{ provide: ShareService, useValue: shareService }],
    }).compile();

    const controller = moduleRef.get(ShareController);
    await controller.download({ token: 't' } as any);

    expect(shareService.download).toHaveBeenCalledWith('t');
  });
});

