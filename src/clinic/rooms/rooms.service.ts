import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Room } from './entities/room.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room) private roomRepo: Repository<Room>,
        @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
    ) { }

    async create(data: Partial<Room>): Promise<Room> {
        if (!data.room_code) {
            const count = await this.roomRepo.count();
            data.room_code = `P-${String(count + 1).padStart(3, '0')}`;
        }
        return this.roomRepo.save(this.roomRepo.create(data));
    }

    async findAll(): Promise<Room[]> {
        return this.roomRepo.find({ order: { room_code: 'ASC' } });
    }

    async findOne(id: number): Promise<Room> {
        return this.roomRepo.findOne({ where: { id } });
    }

    async update(id: number, data: Partial<Room>): Promise<Room> {
        await this.roomRepo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.roomRepo.delete(id);
        return { success: true };
    }

    /**
     * Find rooms that are available (not booked) for a given date + time range.
     * A room is "busy" if there exists a non-cancelled appointment using it
     * whose time overlaps with the requested slot.
     */
    async findAvailable(date: string, startTime: string, endTime?: string): Promise<Room[]> {
        // Find room IDs that are occupied
        const qb = this.apptRepo.createQueryBuilder('a')
            .select('a.room_id')
            .where('a.room_id IS NOT NULL')
            .andWhere('a.appointment_date = :date', { date })
            .andWhere('a.status NOT IN (:...excludedStatuses)', { excludedStatuses: ['CANCELLED', 'NO_SHOW'] });

        if (startTime && endTime) {
            // Overlap check: existing.start < requested.end AND existing.end > requested.start
            qb.andWhere('a.start_time < :endTime', { endTime })
                .andWhere('(a.end_time IS NULL OR a.end_time > :startTime)', { startTime });
        } else if (startTime) {
            qb.andWhere('a.start_time = :startTime', { startTime });
        }

        const busyRooms = await qb.getRawMany();
        const busyIds = busyRooms.map(r => r.a_room_id).filter(Boolean);

        const where: any = { status: 'ACTIVE' };
        if (busyIds.length > 0) {
            where.id = Not(In(busyIds));
        }

        return this.roomRepo.find({ where, order: { room_code: 'ASC' } });
    }
}
