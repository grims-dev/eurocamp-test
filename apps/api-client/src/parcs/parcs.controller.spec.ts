import { Test, TestingModule } from '@nestjs/testing';
import { ParcsController } from './parcs.controller';
import { ParcsService } from './parcs.service';

describe('ParcsController', () => {
  let controller: ParcsController;

  const parcs = { getAll: jest.fn(), get: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParcsController],
      providers: [{ provide: ParcsService, useValue: parcs }],
    }).compile();

    controller = module.get<ParcsController>(ParcsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the parcs the service provides', async () => {
    const all = [{ id: '1', name: 'Parc 1', description: 'First' }];
    parcs.getAll.mockResolvedValue(all);

    await expect(controller.getAll()).resolves.toEqual(all);
  });

  it('passes the requested id through to the service', async () => {
    parcs.get.mockResolvedValue({ id: '42' });

    await controller.get('42');

    expect(parcs.get).toHaveBeenCalledWith('42');
  });
});
