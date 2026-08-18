import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientService } from '../http-client/http-client.service';
import { ParcsService } from './parcs.service';

describe('ParcsService', () => {
  let service: ParcsService;

  // Stubbed so these tests cover the service's own mapping, not the network.
  const http = { request: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcsService, { provide: HttpClientService, useValue: http }],
    }).compile();

    service = module.get<ParcsService>(ParcsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('unwraps the data envelope returned by the collection endpoint', async () => {
    const parcs = [{ id: '1', name: 'Parc 1', description: 'First' }];
    http.request.mockResolvedValue({ data: parcs });

    await expect(service.getAll()).resolves.toEqual(parcs);
    expect(http.request).toHaveBeenCalledWith('/parcs');
  });

  it('returns a single parc, which upstream does not wrap', async () => {
    const parc = { id: '1', name: 'Parc 1', description: 'First' };
    http.request.mockResolvedValue(parc);

    await expect(service.get('1')).resolves.toEqual(parc);
  });

  it('encodes the id so an awkward value cannot alter the path', async () => {
    http.request.mockResolvedValue({});

    await service.get('a/../b');

    expect(http.request).toHaveBeenCalledWith('/parcs/a%2F..%2Fb');
  });
});
