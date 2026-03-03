import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ModuleCategory } from './entities/module-category.entity';

@Injectable()
export class SystemService {
    constructor(
        @InjectRepository(SystemConfig) private configRepo: Repository<SystemConfig>,
        @InjectRepository(ActivityLog) private logRepo: Repository<ActivityLog>,
        @InjectRepository(ModuleCategory) private catRepo: Repository<ModuleCategory>,
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

    async deleteConfig(id: number) {
        await this.configRepo.delete(id);
        return { success: true };
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

    // --- Module Categories ---
    async getCategories(query: any = {}): Promise<ModuleCategory[]> {
        const qb = this.catRepo.createQueryBuilder('c');
        if (query.module) qb.andWhere('c.module = :module', { module: query.module });
        if (query.category_type) qb.andWhere('c.category_type = :type', { type: query.category_type });
        if (query.is_active !== undefined) qb.andWhere('c.is_active = :active', { active: query.is_active === 'true' });
        return qb.orderBy('c.module', 'ASC').addOrderBy('c.category_type', 'ASC').addOrderBy('c.sort_order', 'ASC').getMany();
    }

    async createCategory(data: any): Promise<ModuleCategory> {
        return this.catRepo.save(this.catRepo.create(data as Partial<ModuleCategory>));
    }

    async updateCategory(id: number, data: any): Promise<ModuleCategory> {
        await this.catRepo.update(id, data);
        return this.catRepo.findOne({ where: { id } });
    }

    async deleteCategory(id: number) {
        await this.catRepo.delete(id);
        return { success: true };
    }

    async seedDefaultCategories() {
        const defaults = [
            // HR - Phòng ban
            { module: 'HR', category_type: 'DEPARTMENT', code: 'KHOA_NOI', name: 'Khoa Nội', sort_order: 1 },
            { module: 'HR', category_type: 'DEPARTMENT', code: 'KHOA_NGOAI', name: 'Khoa Ngoại', sort_order: 2 },
            { module: 'HR', category_type: 'DEPARTMENT', code: 'HANH_CHINH', name: 'Hành chính', sort_order: 3 },
            { module: 'HR', category_type: 'DEPARTMENT', code: 'DUOC', name: 'Dược', sort_order: 4 },
            { module: 'HR', category_type: 'DEPARTMENT', code: 'XET_NGHIEM', name: 'Xét nghiệm', sort_order: 5 },
            // HR - Chức vụ
            { module: 'HR', category_type: 'POSITION', code: 'BAC_SI', name: 'Bác sĩ', sort_order: 1 },
            { module: 'HR', category_type: 'POSITION', code: 'Y_TA', name: 'Y tá', sort_order: 2 },
            { module: 'HR', category_type: 'POSITION', code: 'LE_TAN', name: 'Lễ tân', sort_order: 3 },
            { module: 'HR', category_type: 'POSITION', code: 'DUOC_SI', name: 'Dược sĩ', sort_order: 4 },
            { module: 'HR', category_type: 'POSITION', code: 'KE_TOAN', name: 'Kế toán', sort_order: 5 },
            // HR - Loại nghỉ
            { module: 'HR', category_type: 'LEAVE_TYPE', code: 'ANNUAL', name: 'Phép năm', sort_order: 1 },
            { module: 'HR', category_type: 'LEAVE_TYPE', code: 'SICK', name: 'Ốm đau', sort_order: 2 },
            { module: 'HR', category_type: 'LEAVE_TYPE', code: 'PERSONAL', name: 'Việc riêng', sort_order: 3 },
            { module: 'HR', category_type: 'LEAVE_TYPE', code: 'MATERNITY', name: 'Thai sản', sort_order: 4 },
            // Pharmacy - Nhóm thuốc
            { module: 'PHARMACY', category_type: 'MEDICINE_CATEGORY', code: 'KHANG_SINH', name: 'Kháng sinh', sort_order: 1 },
            { module: 'PHARMACY', category_type: 'MEDICINE_CATEGORY', code: 'GIAM_DAU', name: 'Giảm đau', sort_order: 2 },
            { module: 'PHARMACY', category_type: 'MEDICINE_CATEGORY', code: 'VITAMIN', name: 'Vitamin & Bổ sung', sort_order: 3 },
            { module: 'PHARMACY', category_type: 'MEDICINE_CATEGORY', code: 'TIM_MACH', name: 'Tim mạch', sort_order: 4 },
            { module: 'PHARMACY', category_type: 'MEDICINE_CATEGORY', code: 'TIEU_HOA', name: 'Tiêu hóa', sort_order: 5 },
            // Rooms - Loại phòng
            { module: 'ROOMS', category_type: 'ROOM_TYPE', code: 'KHAM', name: 'Phòng khám', sort_order: 1 },
            { module: 'ROOMS', category_type: 'ROOM_TYPE', code: 'THU_THUAT', name: 'Phòng thủ thuật', sort_order: 2 },
            { module: 'ROOMS', category_type: 'ROOM_TYPE', code: 'XET_NGHIEM', name: 'Phòng xét nghiệm', sort_order: 3 },
            { module: 'ROOMS', category_type: 'ROOM_TYPE', code: 'TIEM', name: 'Phòng tiêm', sort_order: 4 },
            // Billing - PT thanh toán
            { module: 'BILLING', category_type: 'PAYMENT_METHOD', code: 'CASH', name: 'Tiền mặt', sort_order: 1 },
            { module: 'BILLING', category_type: 'PAYMENT_METHOD', code: 'TRANSFER', name: 'Chuyển khoản', sort_order: 2 },
            { module: 'BILLING', category_type: 'PAYMENT_METHOD', code: 'CARD', name: 'Thẻ', sort_order: 3 },
            { module: 'BILLING', category_type: 'PAYMENT_METHOD', code: 'MIXED', name: 'Hỗn hợp', sort_order: 4 },
            // Assets - Loại tài sản
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'LAPTOP', name: 'Laptop', sort_order: 1 },
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'PHONE', name: 'Điện thoại', sort_order: 2 },
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'UNIFORM', name: 'Đồng phục', sort_order: 3 },
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'KEY', name: 'Chìa khóa', sort_order: 4 },
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'BADGE', name: 'Thẻ nhân viên', sort_order: 5 },
            { module: 'ASSETS', category_type: 'ASSET_CATEGORY', code: 'TOOL', name: 'Dụng cụ y tế', sort_order: 6 },
        ];

        let created = 0;
        for (const item of defaults) {
            const existing = await this.catRepo.findOne({
                where: { module: item.module, category_type: item.category_type, code: item.code },
            });
            if (!existing) {
                await this.catRepo.save(this.catRepo.create(item as Partial<ModuleCategory>));
                created++;
            }
        }
        return { created, total: defaults.length };
    }
}
