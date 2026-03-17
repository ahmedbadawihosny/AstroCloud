import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  it('should return files health payload', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);
    const res = controller.getFilesHealth() as any;

    expect(res).toEqual({
      status: 'Healthy!',
      service: 'Files Service',
      version: '1.0.0',
      timestamp: expect.any(String) as unknown as string,
    });
  });
});

