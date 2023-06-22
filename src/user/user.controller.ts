import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private userService: UserService){}
  @Get()
  findAll() {
    return 'all user';
  }


  // @Get()
  // async getUsers(): Promise<User[]> {
  //   return this.userService.getAllUsers();
  // }

  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<User> {
    return this.userService.createUser(body.email, body.password);
  }
}
