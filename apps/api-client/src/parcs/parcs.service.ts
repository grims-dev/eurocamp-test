import { Injectable } from "@nestjs/common";
import { HttpClientService } from "../http-client/http-client.service";
import { ParcDto } from "./parcs.dto";

@Injectable()
export class ParcsService {
  constructor(private readonly http: HttpClientService) {}

  async getAll(): Promise<ParcDto[]> {
    const response = await this.http.request<{ data: ParcDto[] }>('/parcs');

    return response.data;
  }

  async get(id: string): Promise<ParcDto> {
    return this.http.request<ParcDto>(`/parcs/${encodeURIComponent(id)}`);
  }
}
