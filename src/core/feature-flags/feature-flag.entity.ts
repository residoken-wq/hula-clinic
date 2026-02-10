import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('feature_flags')
export class FeatureFlag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string; // 'patients', 'appointments', 'emr', 'pharmacy', 'services', 'billing'

    @Column()
    name: string; // 'Quản lý bệnh nhân'

    @Column({ default: '' })
    description: string;

    @Column({ default: false })
    enabled: boolean;

    @Column({ nullable: true })
    category: string; // 'clinic', 'core'

    @Column({ nullable: true })
    depends_on: string; // 'patients' (requires patients module)

    @Column('jsonb', { nullable: true })
    config: any; // Feature-specific config

    @UpdateDateColumn()
    updated_at: Date;
}
