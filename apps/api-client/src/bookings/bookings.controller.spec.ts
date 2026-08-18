import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;

  const bookings = {
    getAll: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookings }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the bookings the service provides', async () => {
    bookings.getAll.mockResolvedValue([]);

    await expect(controller.getAll()).resolves.toEqual([]);
  });

  it('passes a create payload straight through', async () => {
    const payload = {
      user: 'user-id',
      parc: 'parc-id',
      bookingdate: '2026-01-01T00:00:00.000Z',
    };
    bookings.create.mockResolvedValue({ id: '2', ...payload });

    await controller.create(payload);

    expect(bookings.create).toHaveBeenCalledWith(payload);
  });
});
