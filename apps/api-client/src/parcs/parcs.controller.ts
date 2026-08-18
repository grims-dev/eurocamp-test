import { Controller, Get } from "@nestjs/common";
import { ParcsService } from "./parcs.service";
import { ParcDto } from "./parcs.dto";

@Controller('parcs')
export class ParcsController {
  constructor(private readonly parcs: ParcsService) {}

  @Get()
  async getAll(): Promise<ParcDto[]> {
    return await this.parcs.getAll();
  }
}
