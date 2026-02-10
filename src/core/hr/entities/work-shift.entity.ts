import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('work_shifts')
export class WorkShift {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; // Ca sáng, Ca chiều, Ca trực

    @Column({ type: 'time' })
    start_time: string;

    @Column({ type: 'time' })
    end_time: string;

    @Column({ default: 'FIXED' })
    type: string; // FIXED, FLEXIBLE

    @Column({ nullable: true })
    description: string;
}
