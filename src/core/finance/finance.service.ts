import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(Transaction) private transRepo: Repository<Transaction>,
        @InjectRepository(TransactionCategory) private catRepo: Repository<TransactionCategory>,
    ) { }

    // --- Transactions ---
    async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
        if (!data.transaction_date) data.transaction_date = new Date();
        return this.transRepo.save(this.transRepo.create(data));
    }

    async findAll(query: any = {}): Promise<Transaction[]> {
        const where: any = {};
        if (query.type) where.type = query.type;
        if (query.category) where.category = query.category;
        return this.transRepo.find({ where, order: { created_at: 'DESC' }, take: 200 });
    }

    async getReport(year: number, month?: number) {
        const qb = this.transRepo.createQueryBuilder('t');
        qb.select('t.type', 'type');
        qb.addSelect('t.category', 'category');
        qb.addSelect('SUM(t.amount)', 'total');
        qb.where('EXTRACT(YEAR FROM t.transaction_date) = :year', { year });
        if (month) qb.andWhere('EXTRACT(MONTH FROM t.transaction_date) = :month', { month });
        qb.groupBy('t.type').addGroupBy('t.category');
        return qb.getRawMany();
    }

    async deleteTransaction(id: number) {
        await this.transRepo.delete(id);
        return { success: true };
    }

    // --- Categories ---
    async getCategories(): Promise<TransactionCategory[]> {
        return this.catRepo.find({ order: { type: 'ASC', sort_order: 'ASC' } });
    }

    async createCategory(data: Partial<TransactionCategory>) {
        return this.catRepo.save(this.catRepo.create(data));
    }

    async seedCategories() {
        const count = await this.catRepo.count();
        if (count > 0) return;
        const defaults = [
            { name: 'Viện phí', type: 'INCOME', sort_order: 1 },
            { name: 'Thuốc', type: 'INCOME', sort_order: 2 },
            { name: 'Dịch vụ xét nghiệm', type: 'INCOME', sort_order: 3 },
            { name: 'BHYT thanh toán', type: 'INCOME', sort_order: 4 },
            { name: 'Khác (Thu)', type: 'INCOME', sort_order: 9 },
            { name: 'Lương nhân viên', type: 'EXPENSE', sort_order: 1 },
            { name: 'Nhập thuốc / Vật tư', type: 'EXPENSE', sort_order: 2 },
            { name: 'Điện / Nước / Internet', type: 'EXPENSE', sort_order: 3 },
            { name: 'Thuê mặt bằng', type: 'EXPENSE', sort_order: 4 },
            { name: 'Bảo trì thiết bị', type: 'EXPENSE', sort_order: 5 },
            { name: 'Khác (Chi)', type: 'EXPENSE', sort_order: 9 },
        ];
        for (const cat of defaults) {
            await this.catRepo.save(this.catRepo.create(cat));
        }
        console.log('✅ Finance categories seeded');
    }
}
