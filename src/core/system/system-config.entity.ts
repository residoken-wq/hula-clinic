import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    key: string;

    @Column('text', { nullable: true })
    value: string;

    @Column({ nullable: true })
    description: string;
}
