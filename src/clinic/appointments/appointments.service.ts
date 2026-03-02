import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { NotificationsService } from '../../core/notifications/notifications.service';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment) private repo: Repository<Appointment>,
        @InjectRepository(MedicalRecord) private recordRepo: Repository<MedicalRecord>,
        private notifService: NotificationsService,
    ) { }

    async create(data: Partial<Appointment>): Promise<Appointment> {
        // Auto-generate code
        const count = await this.repo.count();
        data.appointment_code = `LH-${String(count + 1).padStart(6, '0')}`;

        // Check doctor conflict
        if (data.doctor_id && data.appointment_date && data.start_time) {
            const doctorConflict = await this.repo.findOne({
                where: {
                    doctor_id: data.doctor_id,
                    appointment_date: data.appointment_date,
                    start_time: data.start_time,
                    status: 'BOOKED',
                },
            });
            if (doctorConflict) throw new BadRequestException('Bác sĩ đã có lịch hẹn trong khung giờ này');
        }

        // Check room conflict
        if (data.room_id && data.appointment_date && data.start_time) {
            const roomConflict = await this.repo.findOne({
                where: {
                    room_id: data.room_id,
                    appointment_date: data.appointment_date,
                    start_time: data.start_time,
                    status: 'BOOKED',
                },
            });
            if (roomConflict) throw new BadRequestException('Phòng đã được đặt trong khung giờ này');
        }

        const appt = await this.repo.save(this.repo.create(data));

        // Notify doctor
        if (data.doctor_id) {
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
            .leftJoinAndSelect('a.doctor', 'd')
            .leftJoinAndSelect('a.room', 'r');

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
        return this.repo.findOne({ where: { id }, relations: ['patient', 'doctor', 'room'] });
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

    /**
     * SD2: Check-in — ghi thời gian đến, notify bác sĩ
     */
    async checkIn(id: number): Promise<Appointment> {
        await this.repo.update(id, { status: 'CHECKED_IN', checked_in_at: new Date() });
        const appt = await this.findOne(id);

        // Notify doctor: BN đã đến
        if (appt?.doctor?.user_id) {
            await this.notifService.create({
                user_id: appt.doctor.user_id,
                title: 'Bệnh nhân đã đến',
                message: `${appt.patient?.full_name || 'Bệnh nhân'} đã check-in, lịch hẹn ${appt.start_time}`,
                type: 'appointment',
                link: '/appointments',
            });
        }

        return appt;
    }

    /**
     * SD2: Start consultation — IN_PROGRESS + auto-create draft MedicalRecord
     */
    async startConsultation(id: number): Promise<Appointment> {
        const appt = await this.findOne(id);
        if (!appt) throw new BadRequestException('Không tìm thấy lịch hẹn');

        // Set IN_PROGRESS
        await this.repo.update(id, { status: 'IN_PROGRESS' });

        // Auto-create draft MedicalRecord if not exists
        if (!appt.medical_record_id) {
            const recordCount = await this.recordRepo.count();
            const newRecord = this.recordRepo.create({
                record_code: `BA-${String(recordCount + 1).padStart(6, '0')}`,
                patient_id: appt.patient_id,
                doctor_id: appt.doctor_id,
                visit_date: new Date(),
                status: 'DRAFT',
                symptoms: appt.reason || '',
            } as any);
            const record = await this.recordRepo.save(newRecord) as unknown as MedicalRecord;

            await this.repo.update(id, { medical_record_id: record.id });
        }

        return this.findOne(id);
    }

    /**
     * SD2: Complete consultation — COMPLETED
     */
    async completeAppointment(id: number): Promise<Appointment> {
        const appt = await this.findOne(id);
        if (!appt) throw new BadRequestException('Không tìm thấy lịch hẹn');

        await this.repo.update(id, { status: 'COMPLETED' });

        // Auto-complete linked MedicalRecord
        if (appt.medical_record_id) {
            await this.recordRepo.update(appt.medical_record_id, { status: 'COMPLETED' });
        }

        return this.findOne(id);
    }

    /**
     * SD5: Cancel — notify doctor
     */
    async cancelAppointment(id: number, reason?: string): Promise<Appointment> {
        const appt = await this.findOne(id);
        if (!appt) throw new BadRequestException('Không tìm thấy lịch hẹn');

        const update: any = { status: 'CANCELLED' };
        if (reason) update.cancel_reason = reason;
        await this.repo.update(id, update);

        // Notify doctor
        if (appt.doctor?.user_id) {
            await this.notifService.create({
                user_id: appt.doctor.user_id,
                title: 'Lịch hẹn bị hủy',
                message: `Lịch hẹn ${appt.appointment_code} (${appt.patient?.full_name}) đã bị hủy. Lý do: ${reason || 'Không rõ'}`,
                type: 'appointment',
                link: '/appointments',
            });
        }

        return this.findOne(id);
    }

    async getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const all = await this.repo.count({ where: { appointment_date: today as any } });
        const completed = await this.repo.count({ where: { appointment_date: today as any, status: 'COMPLETED' } });
        const waiting = await this.repo.count({ where: { appointment_date: today as any, status: 'CHECKED_IN' } });
        const booked = await this.repo.count({ where: { appointment_date: today as any, status: 'BOOKED' } });
        const inProgress = await this.repo.count({ where: { appointment_date: today as any, status: 'IN_PROGRESS' } });
        return { total: all, completed, waiting, booked, inProgress };
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
