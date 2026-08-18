import { Test, TestingModule } from '@nestjs/testing';
import { ApiError } from './api.error';
import { HttpClientService } from './http-client.service';

/**
 * Minimal stand-in for the parts of Response the client actually reads.
 * Omitting the body models an empty response.
 */
const respondWith = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response);

describe('HttpClientService', () => {
  let service: HttpClientService;
  let fetchMock: jest.Mock;

  // Retries are exercised with a zero base delay so the suite stays fast
  // without needing fake timers.
  const noWait = { retries: 2, retryDelayMs: 0 };
  // Caching is off by default here so each test opts in explicitly.
  const noCache = { ...noWait, cacheTtlMs: 0 };

  beforeEach(async () => {
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpClientService],
    }).compile();

    service = module.get<HttpClientService>(HttpClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requests', () => {
    it('returns the parsed body and calls upstream once on success', async () => {
      fetchMock.mockResolvedValue(respondWith(200, { data: ['parc'] }));

      await expect(service.request('/parcs', noCache)).resolves.toEqual({
        data: ['parc'],
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('prefixes the configured base url', async () => {
      fetchMock.mockResolvedValue(respondWith(200));

      await service.request('/parcs', noCache);

      expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3001/api/1/parcs');
    });

    it('returns undefined for a 204', async () => {
      fetchMock.mockResolvedValue(respondWith(204));

      await expect(
        service.request('/parcs/1', { ...noCache, method: 'DELETE' })
      ).resolves.toBeUndefined();
    });

    it('returns undefined for a 200 with an empty body, as upstream DELETE sends', async () => {
      fetchMock.mockResolvedValue(respondWith(200));

      await expect(
        service.request('/parcs/1', { ...noCache, method: 'DELETE' })
      ).resolves.toBeUndefined();
    });
  });

  describe('retries', () => {
    it('retries a 502 and returns the eventual success', async () => {
      fetchMock
        .mockResolvedValueOnce(respondWith(502))
        .mockResolvedValueOnce(respondWith(502))
        .mockResolvedValueOnce(respondWith(200, { name: 'Parc 1' }));

      await expect(service.request('/parcs/1', noCache)).resolves.toEqual({
        name: 'Parc 1',
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('gives up after the configured attempts and reports how many it made', async () => {
      fetchMock.mockResolvedValue(respondWith(502));

      const error = (await service
        .request('/parcs/1', noCache)
        .catch((err) => err)) as ApiError;

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(502);
      expect(error.attempts).toBe(3);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not retry a 404, which would fail identically', async () => {
      fetchMock.mockResolvedValue(respondWith(404));

      const error = (await service
        .request('/parcs/missing', noCache)
        .catch((err) => err)) as ApiError;

      expect(error.status).toBe(404);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries a network failure, which arrives with no status', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('socket hang up'))
        .mockResolvedValueOnce(respondWith(200, { ok: true }));

      await expect(service.request('/parcs', noCache)).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('never replays a POST, because the upstream write may have landed', async () => {
      fetchMock.mockResolvedValue(respondWith(502));

      await service
        .request('/users', { ...noCache, method: 'POST', body: { name: 'A' } })
        .catch(() => undefined);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching', () => {
    it('serves a repeat GET from cache within the ttl', async () => {
      fetchMock.mockResolvedValue(respondWith(200, { data: [] }));

      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });
      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('caches per url, so a different path is fetched', async () => {
      fetchMock.mockResolvedValue(respondWith(200));

      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });
      await service.request('/users', { ...noWait, cacheTtlMs: 1000 });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('collapses concurrent identical GETs into one request', async () => {
      fetchMock.mockResolvedValue(respondWith(200, { data: [] }));

      await Promise.all([
        service.request('/parcs', { ...noWait, cacheTtlMs: 1000 }),
        service.request('/parcs', { ...noWait, cacheTtlMs: 1000 }),
        service.request('/parcs', { ...noWait, cacheTtlMs: 1000 }),
      ]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('fetches again once the ttl has passed', async () => {
      // Expiry is compared against Date.now, so moving the clock is more
      // direct than faking timers (and avoids Jest 28 vs Node 22 friction).
      const now = jest.spyOn(Date, 'now');
      fetchMock.mockResolvedValue(respondWith(200, { data: [] }));

      try {
        now.mockReturnValue(1_000_000);
        await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });

        now.mockReturnValue(1_001_001);
        await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });
      } finally {
        now.mockRestore();
      }

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache a failure', async () => {
      fetchMock.mockResolvedValue(respondWith(404));

      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 }).catch(() => undefined);
      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 }).catch(() => undefined);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('drops cached reads after a write', async () => {
      fetchMock.mockResolvedValue(respondWith(200, { data: [] }));

      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });
      await service.request('/parcs', { ...noWait, method: 'POST', body: {} });
      await service.request('/parcs', { ...noWait, cacheTtlMs: 1000 });

      // GET, POST, then a fresh GET rather than a cache hit.
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
