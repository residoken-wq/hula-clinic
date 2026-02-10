import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification) private repo: Repository<Notification>,
    ) { }

    async create(data: Partial<Notification>): Promise<Notification> {
        return this.repo.save(this.repo.create(data));
    }

    async findByUser(userId: number): Promise<Notification[]> {
        return this.repo.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    async getUnreadCount(userId: number): Promise<number> {
        return this.repo.count({ where: { user_id: userId, is_read: false } });
    }

    async markAsRead(id: number) {
        await this.repo.update(id, { is_read: true });
        return { success: true };
    }

    async markAllRead(userId: number) {
        await this.repo.update({ user_id: userId, is_read: false }, { is_read: true });
        return { success: true };
    }
}
