import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>  ) {}

  async createUser(email: string, password: string): Promise<User> {
    const user = this.repo.create({email, password})
    return this.repo.save(user);
  }

  // async getAllUsers(): Promise<User[]> {
  //   return this.userRepository.find();
  // }
}
