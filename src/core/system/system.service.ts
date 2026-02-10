import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
        @InjectRepository(ActivityLog) private logRepo: Repository<ActivityLog>,
    ) { }

    // --- Config ---
    async getConfig(key: string): Promise<string | null> {
        const config = await this.configRepo.findOne({ where: { key } });
        return config?.value || null;
    }

    async setConfig(key: string, value: string, description?: string) {
        const existing = await this.configRepo.findOne({ where: { key } });
        if (existing) {
            existing.value = value;
            if (description) existing.description = description;
            return this.configRepo.save(existing);
        }
        return this.configRepo.save(this.configRepo.create({ key, value, description }));
    }

    async getAllConfigs(): Promise<SystemConfig[]> {
        return this.configRepo.find({ order: { key: 'ASC' } });
    }

    // --- Activity Logs ---
    async logAction(data: Partial<ActivityLog>) {
        return this.logRepo.save(this.logRepo.create(data));
    }

    async getLogs(query: any = {}): Promise<ActivityLog[]> {
        const take = query.limit || 100;
        return this.logRepo.find({
            order: { created_at: 'DESC' },
            take,
        });
    }

    async cleanupLogs(beforeDate: Date) {
        const result = await this.logRepo
            .createQueryBuilder()
            .delete()
            .where('created_at < :date', { date: beforeDate })
            .execute();
        return { deleted: result.affected };
    }
}
