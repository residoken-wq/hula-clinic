import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { WorkShift } from './entities/work-shift.entity';

@Injectable()
export class HrService {
    constructor(
        @InjectRepository(Employee) private empRepo: Repository<Employee>,
        @InjectRepository(Attendance) private attRepo: Repository<Attendance>,
        @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
        @InjectRepository(WorkShift) private shiftRepo: Repository<WorkShift>,
    ) { }

    // --- Employees ---
    async findAllEmployees(): Promise<Employee[]> {
        return this.empRepo.find({ relations: ['user'], order: { id: 'ASC' } });
    }

    async findEmployee(id: number): Promise<Employee> {
        return this.empRepo.findOne({ where: { id }, relations: ['user'] });
    }

    async createEmployee(data: any): Promise<Employee> {
        if (!data.employee_code) {
            const count = await this.empRepo.count();
            data.employee_code = `NV-${String(count + 1).padStart(5, '0')}`;
        }
        return this.empRepo.save(this.empRepo.create(data));
    }

    async updateEmployee(id: number, data: any): Promise<Employee> {
        await this.empRepo.update(id, data);
        return this.findEmployee(id);
    }

    async deleteEmployee(id: number) {
        await this.empRepo.delete(id);
        return { success: true };
    }

    // --- Attendance ---
    async checkIn(employeeId: number) {
        const today = new Date().toISOString().split('T')[0];
        const existing = await this.attRepo.findOne({
            where: { employee_id: employeeId, date: new Date(today) as any },
        });
        if (existing) return existing;
        return this.attRepo.save(this.attRepo.create({
            employee_id: employeeId,
            date: new Date(today) as any,
            check_in: new Date().toTimeString().split(' ')[0],
            status: 'PRESENT',
        }));
    }

    async checkOut(employeeId: number) {
        const today = new Date().toISOString().split('T')[0];
        const att = await this.attRepo.findOne({
            where: { employee_id: employeeId, date: new Date(today) as any },
        });
        if (!att) return null;
        att.check_out = new Date().toTimeString().split(' ')[0];
        // Calculate work hours
        const start = att.check_in.split(':').map(Number);
        const end = att.check_out.split(':').map(Number);
        att.work_hours = (end[0] + end[1] / 60) - (start[0] + start[1] / 60);
        return this.attRepo.save(att);
    }

    async getAttendance(date: string): Promise<Attendance[]> {
        return this.attRepo.find({ where: { date: new Date(date) as any }, order: { employee_id: 'ASC' } });
    }

    // --- Leave ---
    async createLeave(data: any): Promise<LeaveRequest> {
        return this.leaveRepo.save(this.leaveRepo.create(data));
    }

    async approveLeave(id: number, approvedById: number) {
        await this.leaveRepo.update(id, { status: 'APPROVED', approved_by_id: approvedById });
        return this.leaveRepo.findOne({ where: { id } });
    }

    async rejectLeave(id: number) {
        await this.leaveRepo.update(id, { status: 'REJECTED' });
        return this.leaveRepo.findOne({ where: { id } });
    }

    async getLeaves(employeeId?: number): Promise<LeaveRequest[]> {
        const where: any = {};
        if (employeeId) where.employee_id = employeeId;
        return this.leaveRepo.find({ where, order: { created_at: 'DESC' } });
    }

    // --- Shifts ---
    async getShifts(): Promise<WorkShift[]> {
        return this.shiftRepo.find();
    }

    async createShift(data: any): Promise<WorkShift> {
        return this.shiftRepo.save(this.shiftRepo.create(data));
    }
}
