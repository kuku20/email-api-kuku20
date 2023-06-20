import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';

@Controller('user')
export class UserController {
  @Get()
  findAll() {
    return 'all user';
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return {user: { id: id }};
  }

  @Post()
  CreateUser(@Body() createUser: CreateUserDto){
    return createUser
  }
}
