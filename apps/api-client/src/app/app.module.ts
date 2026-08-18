import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BookingsModule } from "../bookings/bookings.module";
import { ParcsModule } from "../parcs/parcs.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [ParcsModule, UsersModule, BookingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
