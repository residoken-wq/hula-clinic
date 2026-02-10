import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../core/users/entities/user.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ default: 'TODO' })
    status: string; // TODO, IN_PROGRESS, REVIEW, DONE

    @Column({ default: 'MEDIUM' })
    priority: string; // LOW, MEDIUM, HIGH, URGENT

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigned_to_id' })
    assigned_to: User;

    @Column({ nullable: true })
    assigned_to_id: number;

    @Column({ nullable: true })
    created_by_id: number;

    @Column({ nullable: true })
    parent_id: number;

    @Column({ type: 'date', nullable: true })
    deadline: Date;

    @Column({ nullable: true })
    project: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
