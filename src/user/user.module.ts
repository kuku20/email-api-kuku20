import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthService } from './auth.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthService],
  imports:[
    TypeOrmModule.forFeature([User])
  ]
})
export class UserModule {}
