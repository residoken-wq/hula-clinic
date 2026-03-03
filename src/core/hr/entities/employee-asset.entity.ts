import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('employee_assets')
export class EmployeeAsset {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employee_id: number;

    @ManyToOne(() => Employee, { eager: false })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column()
    asset_name: string;

    @Column({ nullable: true })
    asset_code: string;

    @Column({ default: 'OTHER' })
    category: string; // LAPTOP, PHONE, UNIFORM, KEY, BADGE, TOOL, OTHER

    @Column({ type: 'date', nullable: true })
    assigned_date: Date;

    @Column({ type: 'date', nullable: true })
    return_date: Date;

    @Column({ default: 'ASSIGNED' })
    status: string; // ASSIGNED, RETURNED, LOST, DAMAGED

    @Column({ nullable: true })
    condition: string; // NEW, GOOD, FAIR, POOR

    @Column('text', { nullable: true })
    note: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
