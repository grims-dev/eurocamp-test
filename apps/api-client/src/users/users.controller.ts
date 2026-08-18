import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { CreateUserDto, UserDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async getAll(): Promise<UserDto[]> {
    return this.users.getAll();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<UserDto> {
    return this.users.get(id);
  }

  @Post()
  async create(@Body() user: CreateUserDto): Promise<UserDto> {
    return this.users.create(user);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.users.remove(id);
  }
}
