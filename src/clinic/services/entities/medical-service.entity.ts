import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ServiceCategory } from './service-category.entity';

@Entity('medical_services')
export class MedicalService {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @ManyToOne(() => ServiceCategory, { eager: true, nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: ServiceCategory;

    @Column({ nullable: true })
    category_id: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    price: number;

    @Column({ default: false })
    insurance_covered: boolean;

    @Column('float', { default: 0 })
    insurance_rate: number;

    @Column({ default: 30 })
    duration_minutes: number;

    @Column('text', { nullable: true })
    description: string;

    @Column({ default: 'ACTIVE' })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}
