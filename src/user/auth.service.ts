import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { NotFoundException } from '@nestjs/common/exceptions';
import { UserService } from './user.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
    constructor(private usersService: UserService) { }

    async signUp(email: string, password: string, displayName:string) {
        //see if email is in use
        const users = await this.usersService.find(email);
        if (users.length) {
            throw new BadRequestException('Email is use')
        }

        //Hash the users password
        //Generate a salt
        const salt = randomBytes(8).toString('hex');
        //Hash the salt and the password together
        const hash = (await scrypt(password, salt, 32)) as Buffer;
        //Join the hashed result and the salt together
        const result = salt + '.' + hash.toString('hex')

        //Create a new user and save it
        const user = await this.usersService.create(email,displayName, result);

        //Return the user
        return user
    }

    async signIn(email: string, password: string)  { 
        //check
        const [user] = await this.usersService.find(email);
        if(!user){
            throw new NotFoundException('Email not Found!!!')
        }
        //separate
        const [salt, storedHash]  = user.password.split('.')
        // hash input pass
        const hash = (await scrypt(password, salt, 32)) as Buffer;
        //compate
        if(storedHash !== hash.toString('hex')){
            throw new BadRequestException('wrong password')
        }
        return user
    }
}