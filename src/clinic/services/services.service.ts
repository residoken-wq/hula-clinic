import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalService } from './entities/medical-service.entity';
import { ServiceCategory } from './entities/service-category.entity';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(MedicalService) private svcRepo: Repository<MedicalService>,
        @InjectRepository(ServiceCategory) private catRepo: Repository<ServiceCategory>,
    ) { }

    async createService(data: Partial<MedicalService>): Promise<MedicalService> {
        if (!data.code) {
            const count = await this.svcRepo.count();
            data.code = `DV-${String(count + 1).padStart(4, '0')}`;
        }
        return this.svcRepo.save(this.svcRepo.create(data));
    }

    async findAllServices(query: any = {}): Promise<MedicalService[]> {
        const qb = this.svcRepo.createQueryBuilder('s').leftJoinAndSelect('s.category', 'c');
        if (query.category_id) qb.andWhere('s.category_id = :cid', { cid: query.category_id });
        if (query.status) qb.andWhere('s.status = :status', { status: query.status });
        if (query.search) qb.andWhere('(s.name ILIKE :q OR s.code ILIKE :q)', { q: `%${query.search}%` });
        return qb.orderBy('s.name', 'ASC').getMany();
    }

    async findOneService(id: number): Promise<MedicalService> {
        return this.svcRepo.findOne({ where: { id }, relations: ['category'] });
    }

    async updateService(id: number, data: Partial<MedicalService>): Promise<MedicalService> {
        await this.svcRepo.update(id, data);
        return this.findOneService(id);
    }

    async deleteService(id: number) {
        await this.svcRepo.update(id, { status: 'INACTIVE' });
        return { success: true };
    }

    // --- Categories ---
    async getCategories(): Promise<ServiceCategory[]> {
        return this.catRepo.find({ order: { sort_order: 'ASC' } });
    }

    async createCategory(data: Partial<ServiceCategory>): Promise<ServiceCategory> {
        return this.catRepo.save(this.catRepo.create(data));
    }

    async seedCategories() {
        const count = await this.catRepo.count();
        if (count > 0) return;
        const defaults = [
            { code: 'KHAM', name: 'Khám bệnh', sort_order: 1 },
            { code: 'XN', name: 'Xét nghiệm', sort_order: 2 },
            { code: 'CDHA', name: 'Chuẩn đoán hình ảnh', sort_order: 3 },
            { code: 'TT', name: 'Thủ thuật', sort_order: 4 },
            { code: 'KHAC', name: 'Khác', sort_order: 9 },
        ];
        for (const cat of defaults) {
            await this.catRepo.save(this.catRepo.create(cat));
        }
        console.log('✅ Service categories seeded');
    }
}
