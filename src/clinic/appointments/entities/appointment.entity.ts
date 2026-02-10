import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Employee } from '../../../core/hr/entities/employee.entity';

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    appointment_code: string;

    @ManyToOne(() => Patient, { eager: true })
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @Column()
    patient_id: number;

    @ManyToOne(() => Employee, { eager: true, nullable: true })
    @JoinColumn({ name: 'doctor_id' })
    doctor: Employee;

    @Column({ nullable: true })
    doctor_id: number;

    @Column({ nullable: true })
    service_name: string;

    @Column({ type: 'date' })
    appointment_date: Date;

    @Column({ type: 'time' })
    start_time: string;

    @Column({ type: 'time', nullable: true })
    end_time: string;

    @Column({ default: 'BOOKED' })
    status: string; // BOOKED, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

    @Column('text', { nullable: true })
    reason: string;

    @Column('text', { nullable: true })
    note: string;

    @Column('text', { nullable: true })
    cancel_reason: string;

    @Column({ nullable: true })
    created_by_id: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
