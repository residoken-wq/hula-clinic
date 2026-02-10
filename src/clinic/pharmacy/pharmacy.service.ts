import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, ILike } from 'typeorm';
import { Medicine } from './entities/medicine.entity';
import { MedicineStock } from './entities/medicine-stock.entity';

@Injectable()
export class PharmacyService {
    constructor(
        @InjectRepository(Medicine) private medRepo: Repository<Medicine>,
        @InjectRepository(MedicineStock) private stockRepo: Repository<MedicineStock>,
    ) { }

    // --- Medicines ---
    async createMedicine(data: Partial<Medicine>): Promise<Medicine> {
        if (!data.code) {
            const count = await this.medRepo.count();
            data.code = `TH-${String(count + 1).padStart(5, '0')}`;
        }
        return this.medRepo.save(this.medRepo.create(data));
    }

    async findAllMedicines(query: any = {}): Promise<Medicine[]> {
        const qb = this.medRepo.createQueryBuilder('m');
        if (query.search) {
            qb.where('(m.name ILIKE :s OR m.code ILIKE :s OR m.generic_name ILIKE :s)', { s: `%${query.search}%` });
        }
        if (query.category) qb.andWhere('m.category = :cat', { cat: query.category });
        if (query.status) qb.andWhere('m.status = :status', { status: query.status });
        return qb.orderBy('m.name', 'ASC').getMany();
    }

    async findOneMedicine(id: number): Promise<Medicine> {
        return this.medRepo.findOne({ where: { id } });
    }

    async updateMedicine(id: number, data: Partial<Medicine>): Promise<Medicine> {
        await this.medRepo.update(id, data);
        return this.findOneMedicine(id);
    }

    // --- Stock ---
    async importStock(data: Partial<MedicineStock>): Promise<MedicineStock> {
        if (!data.import_date) data.import_date = new Date();
        return this.stockRepo.save(this.stockRepo.create(data));
    }

    async getStock(medicineId: number): Promise<MedicineStock[]> {
        return this.stockRepo.find({
            where: { medicine_id: medicineId },
            order: { expiry_date: 'ASC' },
        });
    }

    async getTotalStock(medicineId: number): Promise<number> {
        const result = await this.stockRepo.createQueryBuilder('s')
            .select('SUM(s.quantity)', 'total')
            .where('s.medicine_id = :mid', { mid: medicineId })
            .getRawOne();
        return parseInt(result?.total || '0');
    }

    async dispenseMedicine(medicineId: number, quantity: number): Promise<boolean> {
        // FIFO: deduct from oldest batches first
        const stocks = await this.stockRepo.find({
            where: { medicine_id: medicineId },
            order: { expiry_date: 'ASC' },
        });

        let remaining = quantity;
        for (const stock of stocks) {
            if (remaining <= 0) break;
            if (stock.quantity >= remaining) {
                stock.quantity -= remaining;
                remaining = 0;
            } else {
                remaining -= stock.quantity;
                stock.quantity = 0;
            }
            await this.stockRepo.save(stock);
        }

        return remaining === 0;
    }

    async getExpiringMedicines(days: number = 30): Promise<MedicineStock[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        return this.stockRepo.find({
            where: { expiry_date: LessThan(futureDate) },
            relations: ['medicine'],
            order: { expiry_date: 'ASC' },
        });
    }

    async getLowStockMedicines(threshold: number = 10) {
        const result = await this.stockRepo.createQueryBuilder('s')
            .select('s.medicine_id', 'medicine_id')
            .addSelect('SUM(s.quantity)', 'total')
            .groupBy('s.medicine_id')
            .having('SUM(s.quantity) <= :threshold', { threshold })
            .getRawMany();
        return result;
    }

    async getPharmacyStats() {
        const totalMedicines = await this.medRepo.count({ where: { status: 'ACTIVE' } });
        const expiring = await this.getExpiringMedicines(30);
        const lowStock = await this.getLowStockMedicines();
        return { totalMedicines, expiringCount: expiring.length, lowStockCount: lowStock.length };
    }
}
