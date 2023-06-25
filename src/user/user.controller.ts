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
  Session,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './createUserDto';
import { UserService } from './user.service';
import { UpdateUserDto } from './updateUser.dto';
import { Serialize } from 'src/serialize.interceptor';
import { UserDto } from './user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './user.entity';
import { AuthGuard } from 'src/user/auth.guard';


// @Serialize(UserDto)
@Controller('auth')
export class UserController {
  constructor(private userService: UserService, private authService: AuthService) {}

  @Get('/whoami')
//   @UseGuards(AuthGuard)
  whoAmI(@CurrentUser() user: User) {
    return user
  }

  @Post('/signout')
  signOut(@Session() session: any) {
      session.userId = null
  }

  @Post('/signup')
  async createUser(@Body() body:  CreateUserDto, @Session() session: any) {
      const user = await this.authService.signUp(body.email, body.password)
      session.userId = user.id
      return user
  }
  @Post('/signin')
  async signIn(@Body() body:  CreateUserDto, @Session() session: any) {
      const user = await this.authService.signIn(body.email, body.password)
      session.userId = user.id
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
//   @UseGuards(AuthGuard)
  removerUser(@Param('id') id: string) {
      return this.userService.remove(parseInt(id))
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
      return this.userService.update(+id, body)
  }
}
