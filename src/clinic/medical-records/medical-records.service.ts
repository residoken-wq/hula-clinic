import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Prescription } from './entities/prescription.entity';

@Injectable()
export class MedicalRecordsService {
    constructor(
        @InjectRepository(MedicalRecord) private recordRepo: Repository<MedicalRecord>,
        @InjectRepository(Prescription) private prescRepo: Repository<Prescription>,
    ) { }

    async create(data: any): Promise<MedicalRecord> {
        const count = await this.recordRepo.count();
        data.record_code = `BA-${String(count + 1).padStart(6, '0')}`;
        if (!data.visit_date) data.visit_date = new Date();

        const { prescriptions, ...recordData } = data;
        const record = await this.recordRepo.save(this.recordRepo.create(recordData));

        if (prescriptions?.length) {
            for (const p of prescriptions) {
                await this.prescRepo.save(this.prescRepo.create({ ...p, record_id: record.id }));
            }
        }

        return this.findOne(record.id);
    }

    async findAll(query: any = {}): Promise<MedicalRecord[]> {
        const qb = this.recordRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.patient', 'p')
            .leftJoinAndSelect('r.doctor', 'd')
            .leftJoinAndSelect('r.prescriptions', 'pr');

        if (query.patient_id) qb.andWhere('r.patient_id = :pid', { pid: query.patient_id });
        if (query.doctor_id) qb.andWhere('r.doctor_id = :did', { did: query.doctor_id });
        if (query.status) qb.andWhere('r.status = :status', { status: query.status });

        return qb.orderBy('r.visit_date', 'DESC').take(100).getMany();
    }

    async findOne(id: number): Promise<MedicalRecord> {
        return this.recordRepo.findOne({
            where: { id },
            relations: ['patient', 'doctor', 'prescriptions'],
        });
    }

    async update(id: number, data: any): Promise<MedicalRecord> {
        const { prescriptions, ...recordData } = data;
        await this.recordRepo.update(id, recordData);

        if (prescriptions) {
            await this.prescRepo.delete({ record_id: id });
            for (const p of prescriptions) {
                await this.prescRepo.save(this.prescRepo.create({ ...p, record_id: id }));
            }
        }

        return this.findOne(id);
    }

    async complete(id: number): Promise<MedicalRecord> {
        await this.recordRepo.update(id, { status: 'COMPLETED' });
        return this.findOne(id);
    }

    async getPatientHistory(patientId: number): Promise<MedicalRecord[]> {
        return this.findAll({ patient_id: patientId });
    }

    async delete(id: number) {
        await this.prescRepo.delete({ record_id: id });
        await this.recordRepo.delete(id);
        return { success: true };
    }
}
