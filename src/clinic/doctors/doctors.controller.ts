import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';

@Controller('doctors')
@UseGuards(JwtAuthGuard)
export class DoctorsController {
    constructor(private svc: DoctorsService) { }

    // --- Doctor List ---
    @Get()
    findAll() { return this.svc.findAllDoctors(); }

    @Get('available')
    findAvailable(
        @Query('date') date: string,
        @Query('start_time') startTime: string,
        @Query('end_time') endTime?: string,
    ) {
        return this.svc.findAvailable(date, startTime, endTime);
    }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findDoctor(id); }

    // --- Schedules ---
    @Get('schedules/all')
    getAllSchedules() { return this.svc.getAllSchedules(); }

    @Get(':id/schedules')
    getSchedules(@Param('id') id: number) { return this.svc.getSchedules(id); }

    @Get(':id/schedule-impact')
    checkScheduleImpact(
        @Param('id') id: number,
        @Query('day_of_week') dayOfWeek?: number,
    ) {
        return this.svc.checkScheduleImpact(id, dayOfWeek !== undefined ? Number(dayOfWeek) : undefined);
    }

    @Post('schedules')
    createSchedule(@Body() data: any) { return this.svc.createSchedule(data); }

    @Put('schedules/:id')
    updateSchedule(@Param('id') id: number, @Body() data: any) { return this.svc.updateSchedule(id, data); }

    @Delete('schedules/:id')
    deleteSchedule(@Param('id') id: number) { return this.svc.deleteSchedule(id); }
}
