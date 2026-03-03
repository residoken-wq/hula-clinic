import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity('attendances')
export class Attendance {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    employee_id: number;

    @ManyToOne(() => Employee, emp => emp.attendances)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'time', nullable: true })
    check_in: string;

    @Column({ type: 'time', nullable: true })
    check_out: string;

    @Column('float', { default: 0 })
    work_hours: number;

    @Column({ nullable: true })
    note: string;

    @Column({ default: 'PRESENT' })
    status: string; // PRESENT, ABSENT, LATE, HALF_DAY

    @CreateDateColumn()
    created_at: Date;
}

