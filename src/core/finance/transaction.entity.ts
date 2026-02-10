import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string; // INCOME, EXPENSE

    @Column({ nullable: true })
    category: string; // Viện phí, Thuốc, Lương, etc.

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    amount: number;

    @Column('text', { nullable: true })
    description: string;

    @Column({ nullable: true })
    reference_type: string; // INVOICE, PAYSLIP, MANUAL

    @Column({ nullable: true })
    reference_id: number;

    @Column({ nullable: true })
    reference_code: string;

    @Column({ nullable: true })
    payment_method: string; // CASH, CARD, TRANSFER

    @Column({ nullable: true })
    created_by_id: number;

    @Column({ nullable: true })
    created_by_name: string;

    @Column({ type: 'date', nullable: true })
    transaction_date: Date;

    @CreateDateColumn()
    created_at: Date;
}
