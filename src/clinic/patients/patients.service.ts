import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientsService {
    constructor(
        @InjectRepository(Patient) private repo: Repository<Patient>,
    ) { }

    async create(data: Partial<Patient>): Promise<Patient> {
        if (!data.patient_code) {
            const count = await this.repo.count();
            data.patient_code = `BN-${String(count + 1).padStart(6, '0')}`;
        }
        return this.repo.save(this.repo.create(data));
    }

    async findAll(query: any = {}): Promise<{ data: Patient[]; total: number }> {
        const take = query.limit || 50;
        const skip = query.offset || 0;
        const where: any = {};
        if (query.status) where.status = query.status;

        const qb = this.repo.createQueryBuilder('p');
        if (query.search) {
            qb.where('(p.full_name ILIKE :s OR p.patient_code ILIKE :s)', { s: `%${query.search}%` });
        }
        if (query.status) qb.andWhere('p.status = :status', { status: query.status });

        const [data, total] = await qb.orderBy('p.id', 'DESC').take(take).skip(skip).getManyAndCount();
        return { data, total };
    }

    async findOne(id: number): Promise<Patient> {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, data: Partial<Patient>): Promise<Patient> {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.repo.update(id, { status: 'INACTIVE' });
        return { success: true };
    }

    async searchByPhone(phone: string): Promise<Patient[]> {
        return this.repo.find({ where: { phone: ILike(`%${phone}%`) }, take: 10 });
    }

    async getStats() {
        const total = await this.repo.count();
        const active = await this.repo.count({ where: { status: 'ACTIVE' } });
        const today = new Date().toISOString().split('T')[0];
        const newToday = await this.repo.createQueryBuilder('p')
            .where('DATE(p.created_at) = :today', { today })
            .getCount();
        return { total, active, newToday };
    }
}
