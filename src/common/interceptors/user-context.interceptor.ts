import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../../core/users/users.service';

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
    constructor(private usersService: UsersService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        if (request.user?.userId) {
            try {
                await this.usersService.updateActivity(request.user.userId);
            } catch (e) { }
        }
        return next.handle();
    }
}
