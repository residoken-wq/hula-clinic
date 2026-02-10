import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';

@Entity('prescriptions')
export class Prescription {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => MedicalRecord, (r) => r.prescriptions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'record_id' })
    record: MedicalRecord;

    @Column()
    record_id: number;

    @Column({ nullable: true })
    medicine_id: number;

    @Column()
    medicine_name: string;

    @Column({ nullable: true })
    dosage: string; // "1 viên"

    @Column({ nullable: true })
    frequency: string; // "3 lần/ngày"

    @Column({ nullable: true })
    duration: string; // "7 ngày"

    @Column({ default: 1 })
    quantity: number;

    @Column({ default: 'viên' })
    unit: string;

    @Column('text', { nullable: true })
    instructions: string;

    @Column({ default: false })
    dispensed: boolean;
}
