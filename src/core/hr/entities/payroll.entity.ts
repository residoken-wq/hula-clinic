import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('payrolls')
export class Payroll {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employee_id: number;

    @ManyToOne(() => Employee, { eager: false })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ length: 7 })
    month: string; // YYYY-MM

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    base_salary: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    allowance: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    overtime_pay: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    bonus: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    deduction: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    insurance: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    tax: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    net_salary: number;

    @Column({ default: 'DRAFT' })
    status: string; // DRAFT, CONFIRMED, PAID

    @Column('text', { nullable: true })
    note: string;

    @Column({ type: 'date', nullable: true })
    paid_date: Date;

    @Column('float', { default: 0 })
    work_days: number;

    @Column('float', { default: 0 })
    overtime_hours: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
