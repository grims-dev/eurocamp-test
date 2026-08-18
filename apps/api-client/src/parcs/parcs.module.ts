import { Module } from '@nestjs/common';
import { ParcsController } from './parcs.controller';
import { ParcsService } from './parcs.service';

@Module({
  controllers: [ParcsController],
  providers: [ParcsService],
})
export class ParcsModule {}
