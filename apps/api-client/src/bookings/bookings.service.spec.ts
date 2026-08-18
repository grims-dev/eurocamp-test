import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientService } from '../http-client/http-client.service';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const http = { request: jest.fn() };

  const booking = {
    id: '1',
    user: 'user-id',
    parc: 'parc-id',
    bookingdate: '2026-01-01T00:00:00.000Z',
    comments: 'Seeded booking',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: HttpClientService, useValue: http },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('unwraps the data envelope from the collection endpoint', async () => {
    http.request.mockResolvedValue({ data: [booking] });

    await expect(service.getAll()).resolves.toEqual([booking]);
    expect(http.request).toHaveBeenCalledWith('/bookings');
  });

  it('returns a single booking, which upstream does not wrap', async () => {
    http.request.mockResolvedValue(booking);

    await expect(service.get('1')).resolves.toEqual(booking);
    expect(http.request).toHaveBeenCalledWith('/bookings/1');
  });

  it('posts the body when creating', async () => {
    const payload = {
      user: 'user-id',
      parc: 'parc-id',
      bookingdate: '2026-01-01T00:00:00.000Z',
    };
    http.request.mockResolvedValue({ id: '2', ...payload });

    await service.create(payload);

    expect(http.request).toHaveBeenCalledWith('/bookings', {
      method: 'POST',
      body: payload,
    });
  });

  it('deletes by id', async () => {
    http.request.mockResolvedValue(undefined);

    await service.remove('1');

    expect(http.request).toHaveBeenCalledWith('/bookings/1', {
      method: 'DELETE',
    });
  });
});
