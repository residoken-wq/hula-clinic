import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../core/users/entities/user.entity';

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

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ type: 'date', nullable: true })
    date_of_birth: Date;

    @Column({ nullable: true })
    gender: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    id_number: string;

    @Column({ type: 'date', nullable: true })
    join_date: Date;

    @Column({ default: 'ACTIVE' })
    status: string; // ACTIVE, INACTIVE, RESIGNED

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    base_salary: number;

    @Column({ nullable: true })
    shift_id: number;

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
