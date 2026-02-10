import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag, FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('appointments')
export class AppointmentsController {
    constructor(private svc: AppointmentsService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Get('today')
    getTodayStats() { return this.svc.getTodayStats(); }

    @Get('by-date')
    findByDate(@Query('date') date: string) { return this.svc.findByDate(date); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.update(id, data); }

    @Put(':id/status')
    updateStatus(@Param('id') id: number, @Body() body: { status: string; reason?: string }) {
        return this.svc.updateStatus(id, body.status, body.reason);
    }

    @Post(':id/check-in')
    checkIn(@Param('id') id: number) { return this.svc.checkIn(id); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
