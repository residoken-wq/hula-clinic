import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag, FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('medical-records')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('emr')
export class MedicalRecordsController {
    constructor(private svc: MedicalRecordsService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Get('patient/:patientId')
    getPatientHistory(@Param('patientId') patientId: number) { return this.svc.getPatientHistory(patientId); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.update(id, data); }

    @Post(':id/complete')
    complete(@Param('id') id: number) { return this.svc.complete(id); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
