import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserDto{
    @IsString()
    password:string;
    @IsEmail()
    email:string;
    @IsOptional()
    @IsString()
    displayName:string;
}