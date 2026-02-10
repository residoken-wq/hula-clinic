import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag } from '../../common/guards/feature-flag.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('patients')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('patients')
export class PatientsController {
    constructor(private svc: PatientsService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Get('stats')
    getStats() { return this.svc.getStats(); }

    @Get('search')
    searchByPhone(@Query('phone') phone: string) { return this.svc.searchByPhone(phone); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.update(id, data); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
