import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService){}
  @Get()
  findAll() {
    return 'all user';
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findOne(id)
  }

  @Post()
  CreateUser(@Body() createUser: CreateUserDto){
    return createUser
  }
}
