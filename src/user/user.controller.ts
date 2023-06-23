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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUserDto';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/updateUser.dto';
import { SerializeInterceptor } from 'src/interceptors/serialize.interceptor';

@Controller('auth')
export class UserController {
  constructor(private userService: UserService) {}


  @Post('/signup')
  async createUser(@Body() body: CreateUserDto) {
      const user = await this.userService.create(body.email, body.password)
      return user
  }

  @UseInterceptors(SerializeInterceptor)
  @Get('/:id')
  async findUser(@Param('id') id: string) {
      const user = await this.userService.findOne(+id)
      if (!user) {
          throw new NotFoundException('Not found')
      }
      return user
  }
  @UseInterceptors(SerializeInterceptor)
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
