import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const user = request.user;

        return next.handle().pipe(
            tap(() => {
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
                    // Activity is logged via SystemService if needed
                    console.log(`[Activity] ${user?.username || 'anonymous'} | ${method} ${url}`);
                }
            }),
        );
    }
}
