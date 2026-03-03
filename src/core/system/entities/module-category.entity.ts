import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('module_categories')
export class ModuleCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    module: string; // HR, PHARMACY, SERVICES, BILLING, ROOMS, APPOINTMENTS, ASSETS, PATIENTS

    @Column()
    category_type: string; // DEPARTMENT, POSITION, LEAVE_TYPE, MEDICINE_CATEGORY, ROOM_TYPE, PAYMENT_METHOD, ASSET_CATEGORY, etc.

    @Column()
    code: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    sort_order: number;

    @Column({ default: true })
    is_active: boolean;

    @Column('jsonb', { nullable: true })
    metadata: any; // Extra config per category type

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
