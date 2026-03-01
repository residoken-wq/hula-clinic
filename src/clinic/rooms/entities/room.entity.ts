import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    room_code: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    floor: string;

    @Column({ default: 'KHAM' })
    type: string; // KHAM, THU_THUAT, XET_NGHIEM, TIEM, OTHER

    @Column({ default: 1 })
    capacity: number;

    @Column('text', { nullable: true })
    equipment: string;

    @Column({ default: 'ACTIVE' })
    status: string; // ACTIVE, INACTIVE, MAINTENANCE

    @CreateDateColumn()
    created_at: Date;
}
