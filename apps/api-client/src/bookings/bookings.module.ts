import { Module } from '@nestjs/common';
import { HttpClientModule } from '../http-client/http-client.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [HttpClientModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
