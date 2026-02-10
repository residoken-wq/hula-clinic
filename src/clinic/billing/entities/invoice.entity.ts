import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    invoice_code: string;

    @ManyToOne(() => Patient, { eager: true })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @Column()
    patient_id: number;

    @Column({ nullable: true })
    record_id: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    total_amount: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    discount_amount: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    insurance_amount: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    patient_amount: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    paid_amount: number;

    @Column({ default: 'CASH' })
    payment_method: string; // CASH, CARD, TRANSFER, MIXED

    @Column({ default: 'UNPAID' })
    payment_status: string; // UNPAID, PARTIAL, PAID

    @Column({ default: 'DRAFT' })
    status: string; // DRAFT, CONFIRMED, PAID, CANCELLED

    @Column('text', { nullable: true })
    note: string;

    @Column({ type: 'date', nullable: true })
    invoice_date: Date;

    @Column({ nullable: true })
    created_by_id: number;

    @OneToMany(() => InvoiceItem, (i) => i.invoice, { cascade: true })
    items: InvoiceItem[];

    @CreateDateColumn()
    created_at: Date;
}
