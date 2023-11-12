import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserServiceV2 {
  constructor(@InjectRepository(User) private repo: Repository<User>) { }

    create(email: string, displayName:string, password: string) {
        const user = this.repo.create({ email,displayName, password }) // user entity instance
        return this.repo.save(user);
    }

    findOne(id: string) {
        if(!id) throw new NotFoundException('user not found');
        return this.repo.findOne({ where: { id } });
    }

    find(email: string) {
        return this.repo.find({ where: { email } })
    }

    async update(id: string, attrs: Partial<User>) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        Object.assign(user, attrs);
        return this.repo.save(user)
    }

    async remove(id: string) {
        const user = await this.findOne(id);
        if (!user) {
            throw new NotFoundException('user not found');
        }
        return this.repo.remove(user)
    }
}
