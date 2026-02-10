import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
    constructor(private svc: HrService) { }

    // --- Employees ---
    @Get('employees')
    findAll() { return this.svc.findAllEmployees(); }

    @Get('employees/:id')
    findOne(@Param('id') id: number) { return this.svc.findEmployee(id); }

    @Post('employees')
    create(@Body() data: any) { return this.svc.createEmployee(data); }

    @Put('employees/:id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.updateEmployee(id, data); }

    @Delete('employees/:id')
    remove(@Param('id') id: number) { return this.svc.deleteEmployee(id); }

    // --- Attendance ---
    @Post('attendance/check-in')
    checkIn(@Body() body: { employee_id: number }) { return this.svc.checkIn(body.employee_id); }

    @Post('attendance/check-out')
    checkOut(@Body() body: { employee_id: number }) { return this.svc.checkOut(body.employee_id); }

    @Get('attendance')
    getAttendance(@Query('date') date: string) { return this.svc.getAttendance(date); }

    // --- Leave ---
    @Get('leaves')
    getLeaves(@Query('employee_id') employeeId?: number) { return this.svc.getLeaves(employeeId); }

    @Post('leaves')
    createLeave(@Body() data: any) { return this.svc.createLeave(data); }

    @Post('leaves/:id/approve')
    approveLeave(@Param('id') id: number, @Request() req) { return this.svc.approveLeave(id, req.user.userId); }

    @Post('leaves/:id/reject')
    rejectLeave(@Param('id') id: number) { return this.svc.rejectLeave(id); }

    // --- Shifts ---
    @Get('shifts')
    getShifts() { return this.svc.getShifts(); }

    @Post('shifts')
    createShift(@Body() data: any) { return this.svc.createShift(data); }
}
