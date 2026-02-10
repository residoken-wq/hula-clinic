import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('service_categories')
export class ServiceCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    code: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    sort_order: number;
}
