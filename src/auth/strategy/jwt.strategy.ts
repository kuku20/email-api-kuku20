import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Request as RequestType } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuth } from '../userAuth.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, @InjectRepository(UserAuth) private repo: Repository<UserAuth>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        // ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.repo.findOne({
      where: {
        email: payload.email,
      },
    });
    delete user.password
    return user;
  }

  private static extractJWT(req: RequestType): string | null {
    if (req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
    
    return null;
  }
}
