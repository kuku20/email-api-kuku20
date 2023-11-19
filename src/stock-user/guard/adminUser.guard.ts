import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminUserAuthGuard implements CanActivate {
  constructor(private jwt: JwtService){}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const token = await this.jwt.decode(request.cookies.token);
    return token.isAdmin;
  }
}
