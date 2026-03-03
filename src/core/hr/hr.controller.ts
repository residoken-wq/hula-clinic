import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
    constructor(private svc: HrService) { }

    // ===================== Stats =====================
    @Get('stats')
    getStats() { return this.svc.getHrStats(); }

    // ===================== Employees =====================
    @Get('employees')
    findAll(@Query() query: any) { return this.svc.findAllEmployees(query); }

    @Get('employees/:id')
    findOne(@Param('id') id: number) { return this.svc.findEmployee(id); }

    @Post('employees')
    create(@Body() data: any) { return this.svc.createEmployee(data); }

    @Put('employees/:id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.updateEmployee(id, data); }

    @Delete('employees/:id')
    remove(@Param('id') id: number) { return this.svc.deleteEmployee(id); }

    // ===================== Attendance =====================
    @Post('attendance/check-in')
    checkIn(@Body() body: { employee_id: number }) { return this.svc.checkIn(body.employee_id); }

    @Post('attendance/check-out')
    checkOut(@Body() body: { employee_id: number }) { return this.svc.checkOut(body.employee_id); }

    @Get('attendance')
    getAttendance(@Query('date') date: string) { return this.svc.getAttendance(date); }

    @Get('attendance/monthly')
    getMonthlyAttendance(@Query('month') month: string) { return this.svc.getMonthlyAttendance(month); }

    // ===================== Leave =====================
    @Get('leaves')
    getLeaves(@Query() query: any) { return this.svc.getLeaves(query); }

    @Post('leaves')
    createLeave(@Body() data: any) { return this.svc.createLeave(data); }

    @Post('leaves/:id/approve')
    approveLeave(@Param('id') id: number, @Request() req) { return this.svc.approveLeave(id, req.user.userId); }

    @Post('leaves/:id/reject')
    rejectLeave(@Param('id') id: number) { return this.svc.rejectLeave(id); }

    // ===================== Shifts =====================
    @Get('shifts')
    getShifts() { return this.svc.getShifts(); }

    @Post('shifts')
    createShift(@Body() data: any) { return this.svc.createShift(data); }

    @Put('shifts/:id')
    updateShift(@Param('id') id: number, @Body() data: any) { return this.svc.updateShift(id, data); }

    @Delete('shifts/:id')
    deleteShift(@Param('id') id: number) { return this.svc.deleteShift(id); }

    // ===================== Payroll =====================
    @Get('payrolls')
    getPayrolls(@Query() query: any) { return this.svc.getPayrolls(query); }

    @Post('payrolls')
    createPayroll(@Body() data: any) { return this.svc.createPayroll(data); }

    @Post('payrolls/generate')
    generatePayroll(@Body() body: { month: string }) { return this.svc.generateMonthlyPayroll(body.month); }

    @Put('payrolls/:id')
    updatePayroll(@Param('id') id: number, @Body() data: any) { return this.svc.updatePayroll(id, data); }

    @Delete('payrolls/:id')
    deletePayroll(@Param('id') id: number) { return this.svc.deletePayroll(id); }

    // ===================== Assets =====================
    @Get('assets')
    getAssets(@Query() query: any) { return this.svc.getAssets(query); }

    @Post('assets')
    createAsset(@Body() data: any) { return this.svc.createAsset(data); }

    @Put('assets/:id')
    updateAsset(@Param('id') id: number, @Body() data: any) { return this.svc.updateAsset(id, data); }

    @Delete('assets/:id')
    deleteAsset(@Param('id') id: number) { return this.svc.deleteAsset(id); }
}
