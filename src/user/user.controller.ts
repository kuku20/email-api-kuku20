import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dto/user.dto';
import { AuthService } from './auth.service';

@Serialize(UserDto)
@Controller('auth')
export class UserController {
  constructor(private userService: UserService, private authService: AuthService) {}


  @Post('/signup')
  async createUser(@Body() body: CreateUserDto) {
      const user = await this.authService.signUp(body.email, body.password)
      return user
  }
  @Post('/signin')
  async signIn(@Body() body: CreateUserDto) {
      const user = await this.authService.signIn(body.email, body.password)
      return user
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
      const user = await this.userService.findOne(+id)
      if (!user) {
          throw new NotFoundException('Not found')
      }
      return user
  }
  @Get()
  findAllUsers(@Query('email') email: string) {
      return this.userService.find(email);
  }

  @Delete('/:id')
  removerUser(@Param('id') id: string) {
      return this.userService.remove(parseInt(id))
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
      return this.userService.update(+id, body)
  }
}
