import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('medicines')
export class Medicine {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    generic_name: string;

    @Column({ nullable: true })
    category: string;

    @Column({ default: 'viên' })
    unit: string;

    @Column({ nullable: true })
    manufacturer: string;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    import_price: number;

    @Column('decimal', { precision: 15, scale: 2, default: 0 })
    sell_price: number;

    @Column('text', { nullable: true })
    description: string;

    @Column('text', { nullable: true })
    side_effects: string;

    @Column({ nullable: true })
    storage_conditions: string;

    @Column({ default: true })
    requires_prescription: boolean;

    @Column({ default: 'ACTIVE' })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}
