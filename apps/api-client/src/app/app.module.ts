import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ParcsModule } from "../parcs/parcs.module";

@Module({
  imports: [ParcsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
