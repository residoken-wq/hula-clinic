import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    user_id: number;

    @Column({ nullable: true })
    username: string;

    @Column()
    action: string; // CREATE, UPDATE, DELETE, LOGIN

    @Column()
    module: string; // patients, appointments, etc.

    @Column({ nullable: true })
    entity_id: string;

    @Column('text', { nullable: true })
    details: string;

    @Column({ nullable: true })
    ip_address: string;

    @CreateDateColumn()
    created_at: Date;
}
