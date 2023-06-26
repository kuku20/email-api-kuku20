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
import { CreateUserDto } from '../dto/createUserDto';
import { UserService } from './user.service';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from '../dto/out/user.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './user.entity';
import { AuthGuard } from 'src/guard/auth.guard';

@Serialize(UserDto)
@Controller('account')
export class UserController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Get('')
  @UseGuards(AuthGuard)
  whoAmI(@CurrentUser() user: User) {
    return { ...user, token: user.id };
  }

  @Post('/signout')
  signOut(@Session() session: any) {
    session.userId = null;
  }

  @Get('/emailExists')
  async checkEmail(@Query('emailExists') emailExists: string) {
    const exist = await this.userService.find(emailExists);
    if (exist.length) {
      return true;
    }
    return false;
  }

  @Post('/register')
  async createUser(@Body() body: CreateUserDto, @Session() session: any) {
    const user = await this.authService.signUp(
      body.email,
      body.password,
      body.displayName,
    );
    session.userId = user.id;
    const matchOther = { ...user, token: user.id };
    return matchOther;
  }
  @Post('/login')
  async signIn(@Body() body: CreateUserDto, @Session() session: any) {
    const user = await this.authService.signIn(body.email, body.password);
    session.userId = user.id;
    const matchOther = { ...user, token: user.id };
    return matchOther;
  }

  @Get('/:id')
  async findUser(@Param('id') id: string) {
    const user = await this.userService.findOne(+id);
    if (!user) {
      throw new NotFoundException('Not found');
    }
    return user;
  }
  @Get()
  findAllUsers(@Query('email') email: string) {
    return this.userService.find(email);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  removerUser(@Param('id') id: string) {
    return this.userService.remove(parseInt(id));
  }

  @Patch('/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.update(+id, body);
  }
}
