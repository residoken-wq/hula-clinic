import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../../../core/hr/entities/employee.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('doctor_schedules')
export class DoctorSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Employee, { eager: true })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column()
    employee_id: number;

    @Column({ type: 'smallint' })
    day_of_week: number; // 0=CN, 1=T2, 2=T3, ... 6=T7

    @Column({ type: 'time' })
    start_time: string;

    @Column({ type: 'time' })
    end_time: string;

    @ManyToOne(() => Room, { eager: true, nullable: true })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @Column({ nullable: true })
    room_id: number;

    @Column({ default: true })
    is_active: boolean;
}
