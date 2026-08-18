import { Injectable } from "@nestjs/common";
import { HttpClientService } from "../http-client/http-client.service";
import { ListResponse } from "../http-client/list-response";
import { CreateParcDto, ParcDto } from "./parcs.dto";

@Injectable()
export class ParcsService {
  constructor(private readonly http: HttpClientService) {}

  async getAll(): Promise<ParcDto[]> {
    const response = await this.http.request<ListResponse<ParcDto>>('/parcs');

    return response.data;
  }

  async get(id: string): Promise<ParcDto> {
    // Unlike the collection endpoint, upstream returns a single parc unwrapped.
    return this.http.request<ParcDto>(`/parcs/${encodeURIComponent(id)}`);
  }

  async create(parc: CreateParcDto): Promise<ParcDto> {
    return this.http.request<ParcDto>('/parcs', { method: 'POST', body: parc });
  }

  async remove(id: string): Promise<void> {
    await this.http.request<void>(`/parcs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
