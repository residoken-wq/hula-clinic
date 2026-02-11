import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { FinanceService } from '../../core/finance/finance.service';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
        @InjectRepository(InvoiceItem) private itemRepo: Repository<InvoiceItem>,
        private financeService: FinanceService,
    ) { }

    async create(data: any): Promise<Invoice> {
        const count = await this.invoiceRepo.count();
        data.invoice_code = `HD-${String(count + 1).padStart(6, '0')}`;
        if (!data.invoice_date) data.invoice_date = new Date();

        const { items, ...invoiceData } = data;

        // Calculate totals
        let totalAmount = 0;
        let insuranceAmount = 0;
        if (items?.length) {
            for (const item of items) {
                item.amount = (item.unit_price || 0) * (item.quantity || 1);
                totalAmount += item.amount;
                if (item.insurance_covered) {
                    insuranceAmount += item.insurance_amount || 0;
                }
            }
        }
        invoiceData.total_amount = totalAmount;
        invoiceData.insurance_amount = insuranceAmount;
        invoiceData.patient_amount = totalAmount - (invoiceData.discount_amount || 0) - insuranceAmount;

        const invoice = await this.invoiceRepo.save(this.invoiceRepo.create(invoiceData as Partial<Invoice>));

        if (items?.length) {
            for (const item of items) {
                await this.itemRepo.save(this.itemRepo.create({ ...item, invoice_id: invoice.id }));
            }
        }

        return this.findOne(invoice.id);
    }

    async findAll(query: any = {}): Promise<Invoice[]> {
        const qb = this.invoiceRepo.createQueryBuilder('i')
            .leftJoinAndSelect('i.patient', 'p')
            .leftJoinAndSelect('i.items', 'it');

        if (query.patient_id) qb.andWhere('i.patient_id = :pid', { pid: query.patient_id });
        if (query.status) qb.andWhere('i.status = :status', { status: query.status });
        if (query.payment_status) qb.andWhere('i.payment_status = :ps', { ps: query.payment_status });

        return qb.orderBy('i.created_at', 'DESC').take(200).getMany();
    }

    async findOne(id: number): Promise<Invoice> {
        return this.invoiceRepo.findOne({
            where: { id },
            relations: ['patient', 'items'],
        });
    }

    async pay(id: number, amount: number, method: string): Promise<Invoice> {
        const invoice = await this.findOne(id);
        if (!invoice) return null;

        invoice.paid_amount = Number(invoice.paid_amount) + amount;
        invoice.payment_method = method;

        if (invoice.paid_amount >= invoice.patient_amount) {
            invoice.payment_status = 'PAID';
            invoice.status = 'PAID';
        } else {
            invoice.payment_status = 'PARTIAL';
        }

        await this.invoiceRepo.save(invoice);

        // Auto-create finance transaction
        await this.financeService.createTransaction({
            type: 'INCOME',
            category: 'Viện phí',
            amount,
            description: `Thanh toán hóa đơn ${invoice.invoice_code} - ${invoice.patient?.full_name}`,
            reference_type: 'INVOICE',
            reference_id: invoice.id,
            reference_code: invoice.invoice_code,
            payment_method: method,
            transaction_date: new Date(),
        });

        return this.findOne(id);
    }

    async cancel(id: number): Promise<Invoice> {
        await this.invoiceRepo.update(id, { status: 'CANCELLED' });
        return this.findOne(id);
    }

    async getRevenueStats(year: number, month?: number) {
        const qb = this.invoiceRepo.createQueryBuilder('i')
            .select('SUM(i.paid_amount)', 'totalRevenue')
            .addSelect('COUNT(i.id)', 'totalInvoices')
            .where('i.status != :cancelled', { cancelled: 'CANCELLED' })
            .andWhere('EXTRACT(YEAR FROM i.invoice_date) = :year', { year });

        if (month) qb.andWhere('EXTRACT(MONTH FROM i.invoice_date) = :month', { month });

        return qb.getRawOne();
    }

    async delete(id: number) {
        await this.itemRepo.delete({ invoice_id: id });
        await this.invoiceRepo.delete(id);
        return { success: true };
    }
}
