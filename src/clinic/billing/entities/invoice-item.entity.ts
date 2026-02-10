import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Invoice, (i) => i.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'invoice_id' })
    invoice: Invoice;

    @Column()
    invoice_id: number;

    @Column({ default: 'SERVICE' })
    item_type: string; // SERVICE, MEDICINE

    @Column({ nullable: true })
    item_id: number;

    @Column()
    item_name: string;

    @Column({ default: 1 })
    quantity: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    unit_price: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    amount: number;

    @Column({ default: false })
    insurance_covered: boolean;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    insurance_amount: number;
}
