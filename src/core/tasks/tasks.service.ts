import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task) private taskRepo: Repository<Task>,
        private notifService: NotificationsService,
    ) { }

    async findAll(query: any = {}): Promise<Task[]> {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.assigned_to_id) where.assigned_to_id = query.assigned_to_id;
        if (query.project) where.project = query.project;
        return this.taskRepo.find({
            where,
            relations: ['assigned_to'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: number): Promise<Task> {
        return this.taskRepo.findOne({ where: { id }, relations: ['assigned_to'] });
    }

    async create(data: any): Promise<Task> {
        const task = await this.taskRepo.save(this.taskRepo.create(data as Partial<Task>));
        if (task.assigned_to_id) {
            await this.notifService.create({
                user_id: task.assigned_to_id,
                title: 'Công việc mới',
                message: `Bạn được giao task: ${task.title}`,
                type: 'task',
                link: `/tasks`,
            });
        }
        return task;
    }

    async update(id: number, data: any): Promise<Task> {
        await this.taskRepo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.taskRepo.delete(id);
        return { success: true };
    }

    async updateStatus(id: number, status: string) {
        await this.taskRepo.update(id, { status });
        return this.findOne(id);
    }
}
