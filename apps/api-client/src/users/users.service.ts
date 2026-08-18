import { Injectable } from "@nestjs/common";
import { HttpClientService } from "../http-client/http-client.service";
import { ListResponse } from "../http-client/list-response";
import { CreateUserDto, UserDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly http: HttpClientService) {}

  async getAll(): Promise<UserDto[]> {
    const response = await this.http.request<ListResponse<UserDto>>('/users');

    return response.data;
  }

  async get(id: string): Promise<UserDto> {
    return this.http.request<UserDto>(`/users/${encodeURIComponent(id)}`);
  }

  /**
   * Upstream fails this roughly 70% of the time, and does so *after* writing,
   * so the client deliberately does not replay it - see HttpClientService.
   */
  async create(user: CreateUserDto): Promise<UserDto> {
    return this.http.request<UserDto>('/users', { method: 'POST', body: user });
  }

  async remove(id: string): Promise<void> {
    await this.http.request<void>(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
