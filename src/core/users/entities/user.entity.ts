import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserGroup } from './user-group.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    full_name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    avatar_url: string;

    @ManyToOne(() => UserGroup, { nullable: true, eager: true })
    @JoinColumn({ name: 'group_id' })
    group: UserGroup;

    @Column({ nullable: true })
    group_id: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    last_activity_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
