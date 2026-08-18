import { ArgumentsHost } from '@nestjs/common';
import { ApiError } from './api.error';
import { ApiErrorFilter } from './api-error.filter';

describe('ApiErrorFilter', () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));

  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  const filter = new ApiErrorFilter();

  beforeEach(() => jest.clearAllMocks());

  it('passes an upstream 404 through to the caller', () => {
    filter.catch(
      new ApiError({ method: 'GET', url: '/parcs/1', status: 404 }),
      host
    );

    expect(status).toHaveBeenCalledWith(404);
  });

  it('reports an exhausted 502 as a bad gateway', () => {
    filter.catch(
      new ApiError({ method: 'GET', url: '/parcs', status: 502, attempts: 4 }),
      host
    );

    expect(status).toHaveBeenCalledWith(502);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 502, attempts: 4 })
    );
  });

  it('reports a request that never landed as a bad gateway', () => {
    filter.catch(new ApiError({ method: 'GET', url: '/parcs' }), host);

    expect(status).toHaveBeenCalledWith(502);
  });
});
