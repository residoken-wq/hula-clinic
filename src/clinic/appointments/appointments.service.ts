import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment) private repo: Repository<Appointment>,
        private notifService: NotificationsService,
    ) { }

    async create(data: Partial<Appointment>): Promise<Appointment> {
        // Auto-generate code
        const count = await this.repo.count();
        data.appointment_code = `LH-${String(count + 1).padStart(6, '0')}`;

        // Check conflict
        if (data.doctor_id && data.appointment_date && data.start_time) {
            const conflict = await this.repo.findOne({
                where: {
                    doctor_id: data.doctor_id,
                    appointment_date: data.appointment_date,
                    start_time: data.start_time,
                    status: 'BOOKED',
                },
            });
            if (conflict) throw new BadRequestException('Bác sĩ đã có lịch hẹn trong khung giờ này');
        }

        const appt = await this.repo.save(this.repo.create(data));

        // Notify doctor
        if (data.doctor_id) {
            // Find employee's user_id to send notification
            const full = await this.repo.findOne({ where: { id: appt.id }, relations: ['doctor'] });
            if (full?.doctor?.user_id) {
                await this.notifService.create({
                    user_id: full.doctor.user_id,
                    title: 'Lịch hẹn mới',
                    message: `Bệnh nhân đặt lịch ngày ${data.appointment_date} lúc ${data.start_time}`,
                    type: 'appointment',
                    link: '/appointments',
                });
            }
        }

        return this.findOne(appt.id);
    }

    async findAll(query: any = {}): Promise<Appointment[]> {
        const qb = this.repo.createQueryBuilder('a')
            .leftJoinAndSelect('a.patient', 'p')
            .leftJoinAndSelect('a.doctor', 'd');

        if (query.date) qb.andWhere('a.appointment_date = :date', { date: query.date });
        if (query.doctor_id) qb.andWhere('a.doctor_id = :did', { did: query.doctor_id });
        if (query.status) qb.andWhere('a.status = :status', { status: query.status });
        if (query.patient_id) qb.andWhere('a.patient_id = :pid', { pid: query.patient_id });

        return qb.orderBy('a.appointment_date', 'DESC')
            .addOrderBy('a.start_time', 'ASC')
            .take(200)
            .getMany();
    }

    async findOne(id: number): Promise<Appointment> {
        return this.repo.findOne({ where: { id }, relations: ['patient', 'doctor'] });
    }

    async findByDate(date: string): Promise<Appointment[]> {
        return this.findAll({ date });
    }

    async updateStatus(id: number, status: string, reason?: string): Promise<Appointment> {
        const update: any = { status };
        if (status === 'CANCELLED' && reason) update.cancel_reason = reason;
        await this.repo.update(id, update);
        return this.findOne(id);
    }

    async checkIn(id: number): Promise<Appointment> {
        return this.updateStatus(id, 'CHECKED_IN');
    }

    async getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const all = await this.repo.count({ where: { appointment_date: today as any } });
        const completed = await this.repo.count({ where: { appointment_date: today as any, status: 'COMPLETED' } });
        const waiting = await this.repo.count({ where: { appointment_date: today as any, status: 'CHECKED_IN' } });
        const booked = await this.repo.count({ where: { appointment_date: today as any, status: 'BOOKED' } });
        return { total: all, completed, waiting, booked };
    }

    async update(id: number, data: Partial<Appointment>): Promise<Appointment> {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async delete(id: number) {
        await this.repo.delete(id);
        return { success: true };
    }
}
