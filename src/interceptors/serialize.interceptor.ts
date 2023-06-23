
import {
    UseInterceptors,
    NestInterceptor,
    ExecutionContext,
    CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';
import { UserDto } from 'src/user/dto/user.dto';



export class SerializeInterceptor implements NestInterceptor {
    constructor(private dto: UserDto) { }
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        // Run something before a request is handled by the request handler

        return next.handle().pipe(
            map((data: UserDto) => {
                // Run something before response is sent out
                console.log(data)
                return plainToInstance(UserDto, data, {
                    excludeExtraneousValues: true
                })
            })
        )
    }
}