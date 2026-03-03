import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { WorkShift } from './entities/work-shift.entity';
import { Payroll } from './entities/payroll.entity';
import { EmployeeAsset } from './entities/employee-asset.entity';

@Injectable()
export class HrService {
    constructor(
        @InjectRepository(Employee) private empRepo: Repository<Employee>,
        @InjectRepository(Attendance) private attRepo: Repository<Attendance>,
        @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
        @InjectRepository(WorkShift) private shiftRepo: Repository<WorkShift>,
        @InjectRepository(Payroll) private payrollRepo: Repository<Payroll>,
        @InjectRepository(EmployeeAsset) private assetRepo: Repository<EmployeeAsset>,
    ) { }

    // ===================== Employees =====================
    async findAllEmployees(query: any = {}): Promise<Employee[]> {
        const qb = this.empRepo.createQueryBuilder('e')
            .leftJoinAndSelect('e.user', 'u');

        if (query.status) qb.andWhere('e.status = :status', { status: query.status });
        if (query.department) qb.andWhere('e.department = :dept', { dept: query.department });
        if (query.position) qb.andWhere('e.position = :pos', { pos: query.position });
        if (query.search) {
            qb.andWhere('(e.full_name ILIKE :s OR e.employee_code ILIKE :s)', { s: `%${query.search}%` });
        }

        return qb.orderBy('e.id', 'ASC').getMany();
    }

    async findEmployee(id: number): Promise<Employee> {
        return this.empRepo.findOne({ where: { id }, relations: ['user'] });
    }

    async createEmployee(data: any): Promise<Employee> {
        if (!data.employee_code) {
            const count = await this.empRepo.count();
            data.employee_code = `NV-${String(count + 1).padStart(5, '0')}`;
        }
        return this.empRepo.save(this.empRepo.create(data as Partial<Employee>));
    }

    async updateEmployee(id: number, data: any): Promise<Employee> {
        await this.empRepo.update(id, data);
        return this.findEmployee(id);
    }

    async deleteEmployee(id: number) {
        await this.empRepo.delete(id);
        return { success: true };
    }

    async getHrStats() {
        const total = await this.empRepo.count();
        const active = await this.empRepo.count({ where: { status: 'ACTIVE' } });
        const resigned = await this.empRepo.count({ where: { status: 'RESIGNED' } });
        const inactive = await this.empRepo.count({ where: { status: 'INACTIVE' } });

        // Current month payroll total
        const currentMonth = new Date().toISOString().slice(0, 7);
        const payrollResult = await this.payrollRepo
            .createQueryBuilder('p')
            .select('SUM(p.net_salary)', 'total')
            .where('p.month = :month', { month: currentMonth })
            .getRawOne();

        return {
            total,
            active,
            resigned,
            inactive,
            monthlyPayroll: parseFloat(payrollResult?.total || '0'),
            currentMonth,
        };
    }

    // ===================== Attendance =====================
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
        return this.attRepo.find({
            where: { date: new Date(date) as any },
            relations: ['employee'],
            order: { employee_id: 'ASC' },
        });
    }

    async getMonthlyAttendance(month: string): Promise<any[]> {
        const [year, mon] = month.split('-').map(Number);
        const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(mon).padStart(2, '0')}-31`;

        return this.attRepo.createQueryBuilder('a')
            .leftJoinAndSelect('a.employee', 'e')
            .where('a.date >= :start AND a.date <= :end', { start: startDate, end: endDate })
            .orderBy('a.date', 'ASC')
            .addOrderBy('e.full_name', 'ASC')
            .getMany();
    }

    // ===================== Leave =====================
    async createLeave(data: any): Promise<LeaveRequest> {
        return this.leaveRepo.save(this.leaveRepo.create(data as Partial<LeaveRequest>));
    }

    async approveLeave(id: number, approvedById: number) {
        await this.leaveRepo.update(id, { status: 'APPROVED', approved_by_id: approvedById });
        return this.leaveRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async rejectLeave(id: number) {
        await this.leaveRepo.update(id, { status: 'REJECTED' });
        return this.leaveRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async getLeaves(query: any = {}): Promise<LeaveRequest[]> {
        const where: any = {};
        if (query.employee_id) where.employee_id = query.employee_id;
        if (query.status) where.status = query.status;
        return this.leaveRepo.find({ where, relations: ['employee'], order: { created_at: 'DESC' } });
    }

    // ===================== Shifts =====================
    async getShifts(): Promise<WorkShift[]> {
        return this.shiftRepo.find();
    }

    async createShift(data: any): Promise<WorkShift> {
        return this.shiftRepo.save(this.shiftRepo.create(data as Partial<WorkShift>));
    }

    async updateShift(id: number, data: any): Promise<WorkShift> {
        await this.shiftRepo.update(id, data);
        return this.shiftRepo.findOne({ where: { id } });
    }

    async deleteShift(id: number) {
        await this.shiftRepo.delete(id);
        return { success: true };
    }

    // ===================== Payroll =====================
    async getPayrolls(query: any = {}): Promise<Payroll[]> {
        const qb = this.payrollRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.employee', 'e');
        if (query.month) qb.andWhere('p.month = :month', { month: query.month });
        if (query.status) qb.andWhere('p.status = :status', { status: query.status });
        if (query.employee_id) qb.andWhere('p.employee_id = :eid', { eid: query.employee_id });
        return qb.orderBy('e.full_name', 'ASC').getMany();
    }

    async createPayroll(data: any): Promise<Payroll> {
        // Auto-calculate net_salary
        data.net_salary = (
            parseFloat(data.base_salary || 0) +
            parseFloat(data.allowance || 0) +
            parseFloat(data.overtime_pay || 0) +
            parseFloat(data.bonus || 0) -
            parseFloat(data.deduction || 0) -
            parseFloat(data.insurance || 0) -
            parseFloat(data.tax || 0)
        );
        return this.payrollRepo.save(this.payrollRepo.create(data as Partial<Payroll>));
    }

    async updatePayroll(id: number, data: any): Promise<Payroll> {
        // Recalculate net_salary
        data.net_salary = (
            parseFloat(data.base_salary || 0) +
            parseFloat(data.allowance || 0) +
            parseFloat(data.overtime_pay || 0) +
            parseFloat(data.bonus || 0) -
            parseFloat(data.deduction || 0) -
            parseFloat(data.insurance || 0) -
            parseFloat(data.tax || 0)
        );
        await this.payrollRepo.update(id, data);
        return this.payrollRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deletePayroll(id: number) {
        await this.payrollRepo.delete(id);
        return { success: true };
    }

    async generateMonthlyPayroll(month: string) {
        // Auto-generate payroll for all ACTIVE employees
        const employees = await this.empRepo.find({ where: { status: 'ACTIVE' } });
        const existing = await this.payrollRepo.find({ where: { month } });
        const existingIds = new Set(existing.map(p => p.employee_id));

        const created: Payroll[] = [];
        for (const emp of employees) {
            if (existingIds.has(emp.id)) continue; // Skip if already exists

            // Count work days in month
            const attendances = await this.attRepo.createQueryBuilder('a')
                .where('a.employee_id = :eid', { eid: emp.id })
                .andWhere('a.date >= :start AND a.date <= :end', {
                    start: `${month}-01`,
                    end: `${month}-31`,
                })
                .getMany();

            const workDays = attendances.length;
            const totalHours = attendances.reduce((sum, a) => sum + (a.work_hours || 0), 0);
            const overtimeHours = Math.max(0, totalHours - workDays * 8);
            const overtimePay = overtimeHours * (Number(emp.base_salary) / 26 / 8) * 1.5;

            const baseSalary = Number(emp.base_salary);
            const insurance = baseSalary * 0.105; // 10.5% BHXH+BHYT+BHTN
            const taxableIncome = baseSalary - insurance - 11000000; // Giảm trừ gia cảnh
            const tax = taxableIncome > 0 ? taxableIncome * 0.1 : 0;
            const netSalary = baseSalary + overtimePay - insurance - tax;

            const payroll = await this.payrollRepo.save(this.payrollRepo.create({
                employee_id: emp.id,
                month,
                base_salary: baseSalary,
                allowance: 0,
                overtime_pay: Math.round(overtimePay),
                bonus: 0,
                deduction: 0,
                insurance: Math.round(insurance),
                tax: Math.round(Math.max(0, tax)),
                net_salary: Math.round(netSalary),
                work_days: workDays,
                overtime_hours: Math.round(overtimeHours * 10) / 10,
                status: 'DRAFT',
            } as Partial<Payroll>));
            created.push(payroll);
        }

        return { created: created.length, skipped: existingIds.size, total: employees.length };
    }

    // ===================== Assets =====================
    async getAssets(query: any = {}): Promise<EmployeeAsset[]> {
        const qb = this.assetRepo.createQueryBuilder('a')
            .leftJoinAndSelect('a.employee', 'e');
        if (query.employee_id) qb.andWhere('a.employee_id = :eid', { eid: query.employee_id });
        if (query.status) qb.andWhere('a.status = :status', { status: query.status });
        if (query.category) qb.andWhere('a.category = :cat', { cat: query.category });
        return qb.orderBy('a.created_at', 'DESC').getMany();
    }

    async createAsset(data: any): Promise<EmployeeAsset> {
        if (!data.asset_code) {
            const count = await this.assetRepo.count();
            data.asset_code = `TS-${String(count + 1).padStart(5, '0')}`;
        }
        return this.assetRepo.save(this.assetRepo.create(data as Partial<EmployeeAsset>));
    }

    async updateAsset(id: number, data: any): Promise<EmployeeAsset> {
        await this.assetRepo.update(id, data);
        return this.assetRepo.findOne({ where: { id }, relations: ['employee'] });
    }

    async deleteAsset(id: number) {
        await this.assetRepo.delete(id);
        return { success: true };
    }
}
