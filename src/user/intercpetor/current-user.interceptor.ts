import {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
    Injectable,
} from '@nestjs/common';
import { UserService } from '../user.service';


@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
    constructor(private usersService: UserService) { }
    async intercept(context: ExecutionContext, next: CallHandler<any>) {
        const request = context.switchToHttp().getRequest();
        const { userId } = request.session;
        if (userId) {
            const user = await this.usersService.findOne(userId);
            request.currentUser = user
        }
        return next.handle()
    }

}