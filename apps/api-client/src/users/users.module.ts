import { Module } from '@nestjs/common';
import { HttpClientModule } from '../http-client/http-client.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [HttpClientModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
