import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private svc: NotificationsService) { }

    @Get()
    findAll(@Request() req) { return this.svc.findByUser(req.user.userId); }

    @Get('unread-count')
    unreadCount(@Request() req) { return this.svc.getUnreadCount(req.user.userId); }

    @Post(':id/read')
    markAsRead(@Param('id') id: number) { return this.svc.markAsRead(id); }

    @Post('read-all')
    markAllRead(@Request() req) { return this.svc.markAllRead(req.user.userId); }
}
