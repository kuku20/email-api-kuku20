import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy';
import { UserServiceV2 } from './user.service';
import { UserAuth } from './userAuth.entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [JwtModule.register({}), TypeOrmModule.forFeature([UserAuth])],
  controllers: [AuthController],
  providers: [UserServiceV2, AuthService, JwtStrategy],
})
export class AuthModule {}
