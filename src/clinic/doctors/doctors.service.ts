import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not, In } from 'typeorm';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Employee } from '../../core/hr/entities/employee.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class DoctorsService {
    constructor(
        @InjectRepository(DoctorSchedule) private scheduleRepo: Repository<DoctorSchedule>,
        @InjectRepository(Employee) private empRepo: Repository<Employee>,
        @InjectRepository(Appointment) private apptRepo: Repository<Appointment>,
    ) { }

    // --- Doctor List (employees with position containing 'Bác sĩ') ---
    async findAllDoctors(): Promise<Employee[]> {
        return this.empRepo.find({
            where: { position: Like('%Bác sĩ%'), status: 'ACTIVE' },
            relations: ['user'],
            order: { full_name: 'ASC' },
        });
    }

    async findDoctor(id: number): Promise<Employee> {
        return this.empRepo.findOne({ where: { id }, relations: ['user'] });
    }

    // --- Doctor Schedules ---
    async getSchedules(employeeId: number): Promise<DoctorSchedule[]> {
        return this.scheduleRepo.find({
            where: { employee_id: employeeId },
            order: { day_of_week: 'ASC', start_time: 'ASC' },
        });
    }

    async getAllSchedules(): Promise<DoctorSchedule[]> {
        return this.scheduleRepo.find({
            relations: ['employee', 'room'],
            order: { employee_id: 'ASC', day_of_week: 'ASC', start_time: 'ASC' },
        });
    }

    async createSchedule(data: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
        return this.scheduleRepo.save(this.scheduleRepo.create(data));
    }

    async updateSchedule(id: number, data: Partial<DoctorSchedule>): Promise<DoctorSchedule> {
        await this.scheduleRepo.update(id, data);
        return this.scheduleRepo.findOne({ where: { id }, relations: ['employee', 'room'] });
    }

    async deleteSchedule(id: number) {
        const schedule = await this.scheduleRepo.findOne({ where: { id } });
        if (schedule) {
            const impact = await this.checkScheduleImpact(schedule.employee_id, schedule.day_of_week);
            await this.scheduleRepo.delete(id);
            return { success: true, impacted_appointments: impact.length, warning: impact.length > 0 ? `Có ${impact.length} lịch hẹn có thể bị ảnh hưởng` : null };
        }
        await this.scheduleRepo.delete(id);
        return { success: true };
    }

    /**
     * SD6: Check schedule impact — tìm appointments bị ảnh hưởng khi sửa/xóa lịch bác sĩ
     */
    async checkScheduleImpact(employeeId: number, dayOfWeek?: number): Promise<any[]> {
        const today = new Date().toISOString().split('T')[0];

        const qb = this.apptRepo.createQueryBuilder('a')
            .where('a.doctor_id = :doctorId', { doctorId: employeeId })
            .andWhere('a.appointment_date >= :today', { today })
            .andWhere('a.status IN (:...statuses)', { statuses: ['BOOKED', 'CONFIRMED'] });

        if (dayOfWeek !== undefined) {
            // Filter by day of week using EXTRACT
            qb.andWhere('EXTRACT(DOW FROM a.appointment_date) = :dow', { dow: dayOfWeek });
        }

        return qb.leftJoinAndSelect('a.patient', 'p')
            .orderBy('a.appointment_date', 'ASC')
            .getMany();
    }

    /**
     * Find doctors available for a given date + time range.
     * A doctor is "available" if:
     *   1. They have a schedule entry for that day_of_week covering the time range
     *   2. They don't have a conflicting (non-cancelled) appointment at that time
     */
    async findAvailable(date: string, startTime: string, endTime?: string): Promise<Employee[]> {
        const dayOfWeek = new Date(date).getDay(); // 0=Sunday

        // 1. Find doctors scheduled on this day of week
        const schedulesQb = this.scheduleRepo.createQueryBuilder('s')
            .select('DISTINCT s.employee_id', 'employee_id')
            .where('s.day_of_week = :dayOfWeek', { dayOfWeek })
            .andWhere('s.is_active = true')
            .andWhere('s.start_time <= :startTime', { startTime });

        if (endTime) {
            schedulesQb.andWhere('s.end_time >= :endTime', { endTime });
        }

        const scheduledDoctors = await schedulesQb.getRawMany();
        const scheduledIds = scheduledDoctors.map(s => s.employee_id);

        if (scheduledIds.length === 0) return [];

        // 2. Find doctors busy with existing appointments
        const busyQb = this.apptRepo.createQueryBuilder('a')
            .select('a.doctor_id')
            .where('a.doctor_id IN (:...ids)', { ids: scheduledIds })
            .andWhere('a.appointment_date = :date', { date })
            .andWhere('a.status NOT IN (:...excludedStatuses)', { excludedStatuses: ['CANCELLED', 'NO_SHOW'] });

        if (startTime && endTime) {
            busyQb.andWhere('a.start_time < :endTime', { endTime })
                .andWhere('(a.end_time IS NULL OR a.end_time > :startTime)', { startTime });
        } else if (startTime) {
            busyQb.andWhere('a.start_time = :startTime', { startTime });
        }

        const busyDoctors = await busyQb.getRawMany();
        const busyIds = busyDoctors.map(b => b.a_doctor_id).filter(Boolean);

        // 3. Get available doctors
        const availableIds = scheduledIds.filter(id => !busyIds.includes(id));
        if (availableIds.length === 0) return [];

        return this.empRepo.find({
            where: { id: In(availableIds) },
            relations: ['user'],
            order: { full_name: 'ASC' },
        });
    }
}
