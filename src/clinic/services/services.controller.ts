import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag, FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('services')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('services')
export class ServicesController {
    constructor(private svc: ServicesService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAllServices(query); }

    @Get('categories')
    getCategories() { return this.svc.getCategories(); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOneService(id); }

    @Post()
    create(@Body() data: any) { return this.svc.createService(data); }

    @Post('categories')
    createCategory(@Body() data: any) { return this.svc.createCategory(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.updateService(id, data); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.deleteService(id); }
}
