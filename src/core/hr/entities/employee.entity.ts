import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EncryptedColumnTransformer } from '../../../common/encryption/encrypted-column.transformer';

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    employee_code: string;

    @Column()
    full_name: string;

    @Column({ nullable: true })
    position: string; // Bác sĩ, Y tá, Lễ tân, etc.

    @Column({ nullable: true })
    department: string; // Khoa Nội, Khoa Ngoại, etc.

    @Column({ nullable: true, transformer: EncryptedColumnTransformer })
    phone: string;

    @Column({ nullable: true, transformer: EncryptedColumnTransformer })
    email: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth: Date;

    @Column({ nullable: true })
    gender: string;

    @Column({ nullable: true, transformer: EncryptedColumnTransformer })
    address: string;

    @Column({ nullable: true, transformer: EncryptedColumnTransformer })
    id_number: string;

    @Column({ type: 'date', nullable: true })
    join_date: Date;

    @Column({ default: 'ACTIVE' })
    status: string; // ACTIVE, INACTIVE, RESIGNED

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    base_salary: number;

    @Column({ nullable: true })
    shift_id: number;

    @Column({ nullable: true, transformer: EncryptedColumnTransformer })
    bank_account: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    user_id: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
