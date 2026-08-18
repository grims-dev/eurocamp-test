import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { CreateParcDto, ParcDto } from "./parcs.dto";
import { ParcsService } from "./parcs.service";

@Controller('parcs')
export class ParcsController {
  constructor(private readonly parcs: ParcsService) {}

  @Get()
  async getAll(): Promise<ParcDto[]> {
    return this.parcs.getAll();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<ParcDto> {
    return this.parcs.get(id);
  }

  @Post()
  async create(@Body() parc: CreateParcDto): Promise<ParcDto> {
    return this.parcs.create(parc);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.parcs.remove(id);
  }
}
