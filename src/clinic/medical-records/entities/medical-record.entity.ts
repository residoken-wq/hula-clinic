import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Employee } from '../../../core/hr/entities/employee.entity';
import { Prescription } from './prescription.entity';

@Entity('medical_records')
export class MedicalRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    record_code: string;

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
    appointment_id: number;

    @Column({ type: 'date' })
    visit_date: Date;

    @Column('text', { nullable: true })
    symptoms: string;

    @Column('text', { nullable: true })
    diagnosis: string;

    @Column({ nullable: true })
    diagnosis_code: string;

    @Column('text', { nullable: true })
    treatment_plan: string;

    @Column('jsonb', { nullable: true })
    vital_signs: {
        blood_pressure?: string;
        heart_rate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
        spo2?: number;
    };

    @Column('text', { nullable: true })
    notes: string;

    @Column({ type: 'date', nullable: true })
    follow_up_date: Date;

    @Column('simple-array', { nullable: true })
    attachments: string[];

    @Column({ default: 'DRAFT' })
    status: string; // DRAFT, COMPLETED

    @OneToMany(() => Prescription, (p) => p.record, { cascade: true })
    prescriptions: Prescription[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
