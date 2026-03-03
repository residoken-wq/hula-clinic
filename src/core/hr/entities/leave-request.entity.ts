import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('leave_requests')
export class LeaveRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employee_id: number;

    @ManyToOne(() => Employee, emp => emp.leaveRequests)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column()
    leave_type: string; // ANNUAL, SICK, PERSONAL, MATERNITY

    @Column({ type: 'date' })
    start_date: Date;

    @Column({ type: 'date' })
    end_date: Date;

    @Column('float', { default: 1 })
    days: number;

    @Column('text', { nullable: true })
    reason: string;

    @Column({ default: 'PENDING' })
    status: string; // PENDING, APPROVED, REJECTED

    @Column({ nullable: true })
    approved_by_id: number;

    @CreateDateColumn()
    created_at: Date;
}

