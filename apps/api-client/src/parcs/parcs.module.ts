import { Module } from '@nestjs/common';
import { HttpClientModule } from '../http-client/http-client.module';
import { ParcsController } from './parcs.controller';
import { ParcsService } from './parcs.service';

@Module({
  imports: [HttpClientModule],
  controllers: [ParcsController],
  providers: [ParcsService],
})
export class ParcsModule {}
