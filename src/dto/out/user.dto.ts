import {Expose} from 'class-transformer'

export class UserDto {
    @Expose()
    displayName: string;

    @Expose()
    email: string;

    @Expose()
    token:string;    
}