import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';

@Module({
  providers: [HttpClientService],
})
export class HttpClientModule {}
