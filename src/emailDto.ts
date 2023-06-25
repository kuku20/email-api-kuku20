
import { IsEmail, IsString,IsOptional  } from 'class-validator';
export class EmailDto{
    @IsString()
    message:string;
    @IsEmail()
    email:string;
    @IsString()
    name:string;
    @IsOptional()
    date:Date
}


