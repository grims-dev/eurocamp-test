import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientService } from '../http-client/http-client.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const http = { request: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: HttpClientService, useValue: http }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('unwraps the data envelope from the collection endpoint', async () => {
    const users = [{ id: '1', name: 'User 1', email: 'user1@example.com' }];
    http.request.mockResolvedValue({ data: users });

    await expect(service.getAll()).resolves.toEqual(users);
    expect(http.request).toHaveBeenCalledWith('/users');
  });

  it('returns a single user, which upstream does not wrap', async () => {
    const user = { id: '1', name: 'User 1', email: 'user1@example.com' };
    http.request.mockResolvedValue(user);

    await expect(service.get('1')).resolves.toEqual(user);
    expect(http.request).toHaveBeenCalledWith('/users/1');
  });

  it('posts the body when creating', async () => {
    const payload = { name: 'New', email: 'new@example.com' };
    http.request.mockResolvedValue({ id: '2', ...payload });

    await service.create(payload);

    expect(http.request).toHaveBeenCalledWith('/users', {
      method: 'POST',
      body: payload,
    });
  });

  it('deletes by id', async () => {
    http.request.mockResolvedValue(undefined);

    await service.remove('1');

    expect(http.request).toHaveBeenCalledWith('/users/1', { method: 'DELETE' });
  });
});
