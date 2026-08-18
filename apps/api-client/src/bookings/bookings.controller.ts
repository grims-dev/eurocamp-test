import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { BookingDto, CreateBookingDto } from "./bookings.dto";
import { BookingsService } from "./bookings.service";

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  async getAll(): Promise<BookingDto[]> {
    return this.bookings.getAll();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<BookingDto> {
    return this.bookings.get(id);
  }

  @Post()
  async create(@Body() booking: CreateBookingDto): Promise<BookingDto> {
    return this.bookings.create(booking);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.bookings.remove(id);
  }
}
