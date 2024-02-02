import { ForbiddenException, Injectable, Res } from '@nestjs/common';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { UserServiceV2 } from './user.service';
import { BadRequestException } from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { NotFoundException } from '@nestjs/common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private usersService: UserServiceV2,
  ) {}

  async signUp(dto: AuthDto, @Res({ passthrough: true }) response?: Response) {
    //see if email is in use
    const users = await this.usersService.find(dto.email);
    if (users.length) {
      throw new BadRequestException('Email is use');
    }
    // generate the password hash
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.usersService.create(
        dto.email,
        dto.displayName,
        hash,
      );
      const token = await this.signToken(user.id, user.email,user.isAdmin);
      if (!token) throw new ForbiddenException('NOT Valid token');

      // response.cookie('token', token, { sameSite: 'none', secure: true });
      response.cookie('token', token);

      return {
        id: user.id,isAdmin: user.isAdmin,
        message: 'Logged in succefully',
      };
    } catch (error) {
      throw error;
    }
  }

  async signIn(dto: AuthDto, @Res({ passthrough: true }) response?: Response) {
    //check
    const [user] = await this.usersService.find(dto.email);
    if (!user) {
      throw new NotFoundException('Email not Found!!!');
    }
    // if user does not exist throw exception
    if (!user) throw new ForbiddenException('Credentials incorrect');
    // compare password
    const pwMatches = await argon.verify(user.password, dto.password);
    // if password incorrect throw exception
    if (!pwMatches) throw new ForbiddenException('Credentials incorrect');

    const token = await this.signToken(user.id, user.email, user.isAdmin);
    if (!token) throw new ForbiddenException('NOT Valid token');

    response.cookie('token', token);
    // response.cookie('token', token, { sameSite: 'none', secure: true });

    return {
      id: user.id,isAdmin: user.isAdmin,
      message: 'Logged in succefully',
    };
  }

  async signout(@Res({ passthrough: true }) response?: Response) {
    response.clearCookie('token');
    // response.clearCookie('token', { sameSite: 'none', secure: true });
    return { message: 'Logged out succefully' };
  }

  async signToken(userId: string, email: string,isAdmin:boolean): Promise<any> {
    const payload = {
      sub: userId,
      email,isAdmin,
      signature: 'LLC_LC',
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '30d',
      secret: secret,
    });

    return token;
  }
}
