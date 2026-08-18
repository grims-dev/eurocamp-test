import { Injectable } from "@nestjs/common";
import { HttpClientService } from "../http-client/http-client.service";
import { ListResponse } from "../http-client/list-response";
import { BookingDto, CreateBookingDto } from "./bookings.dto";

@Injectable()
export class BookingsService {
  constructor(private readonly http: HttpClientService) {}

  async getAll(): Promise<BookingDto[]> {
    const response = await this.http.request<ListResponse<BookingDto>>('/bookings');

    return response.data;
  }

  async get(id: string): Promise<BookingDto> {
    return this.http.request<BookingDto>(`/bookings/${encodeURIComponent(id)}`);
  }

  async create(booking: CreateBookingDto): Promise<BookingDto> {
    return this.http.request<BookingDto>('/bookings', {
      method: 'POST',
      body: booking,
    });
  }

  async remove(id: string): Promise<void> {
    await this.http.request<void>(`/bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
