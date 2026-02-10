import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('patients')
export class Patient {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    patient_code: string;

    @Column()
    full_name: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth: Date;

    @Column({ default: 'NAM' })
    gender: string; // NAM, NU, KHAC

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    id_number: string;

    @Column({ nullable: true })
    blood_type: string;

    @Column('text', { nullable: true })
    allergies: string;

    @Column('text', { nullable: true })
    medical_history: string;

    @Column({ nullable: true })
    insurance_number: string;

    @Column({ nullable: true })
    insurance_provider: string;

    @Column({ type: 'date', nullable: true })
    insurance_expiry: Date;

    @Column({ nullable: true })
    emergency_contact_name: string;

    @Column({ nullable: true })
    emergency_contact_phone: string;

    @Column({ nullable: true })
    emergency_contact_relation: string;

    @Column('text', { nullable: true })
    note: string;

    @Column({ default: 'ACTIVE' })
    status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
