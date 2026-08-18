import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const users = {
    getAll: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: users }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the users the service provides', async () => {
    const all = [{ id: '1', name: 'User 1', email: 'user1@example.com' }];
    users.getAll.mockResolvedValue(all);

    await expect(controller.getAll()).resolves.toEqual(all);
  });

  it('passes a create payload straight through', async () => {
    const payload = { name: 'New', email: 'new@example.com' };
    users.create.mockResolvedValue({ id: '2', ...payload });

    await controller.create(payload);

    expect(users.create).toHaveBeenCalledWith(payload);
  });

  it('passes the id through when deleting', async () => {
    users.remove.mockResolvedValue(undefined);

    await controller.remove('1');

    expect(users.remove).toHaveBeenCalledWith('1');
  });
});
