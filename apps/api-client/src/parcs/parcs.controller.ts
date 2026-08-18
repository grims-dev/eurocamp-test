import { Controller, Get, Param } from "@nestjs/common";
import { ParcsService } from "./parcs.service";
import { ParcDto } from "./parcs.dto";

@Controller('parcs')
export class ParcsController {
  constructor(private readonly parcs: ParcsService) {}

  @Get()
  async getAll(): Promise<ParcDto[]> {
    return await this.parcs.getAll();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ParcDto> {
    return this.parcs.get(id);
  }
}
