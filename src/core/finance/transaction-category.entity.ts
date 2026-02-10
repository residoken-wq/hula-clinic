import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('transaction_categories')
export class TransactionCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    type: string; // INCOME, EXPENSE

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;
}
