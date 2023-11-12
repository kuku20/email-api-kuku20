import {
  Body,
  Controller,
  HttpCode,
  Post,
  HttpStatus,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto'; // all in dto more code less import
import { Response } from 'express';
import { GetUser } from './decorator';
import { User } from './user.entity';
import { JwtGuard } from './guard';

@Controller('auth/v2')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(201)
  @Post('signup')
  signup(@Body() dto: AuthDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.signUp(dto, response);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: AuthDto, @Res({ passthrough: true }) response: Response) {
    const token = this.authService.signIn(dto, response);
    return token;
  }

  @Get('signout')
  signout(@Res({ passthrough: true }) response: Response) {
    return this.authService.signout(response);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: any) {
    return user.user;
  }
}
