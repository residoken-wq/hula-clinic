import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    message: string;

    @Column({ nullable: true })
    link: string; // e.g., '/patients/123'

    @Column({ nullable: true })
    type: string; // 'appointment', 'task', 'system'

    @Column({ default: false })
    is_read: boolean;

    @CreateDateColumn()
    created_at: Date;
}
