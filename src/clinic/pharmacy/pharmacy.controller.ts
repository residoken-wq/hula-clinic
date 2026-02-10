import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag, FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('pharmacy')
export class PharmacyController {
    constructor(private svc: PharmacyService) { }

    @Get('medicines')
    findAll(@Query() query: any) { return this.svc.findAllMedicines(query); }

    @Get('medicines/:id')
    findOne(@Param('id') id: number) { return this.svc.findOneMedicine(id); }

    @Post('medicines')
    create(@Body() data: any) { return this.svc.createMedicine(data); }

    @Put('medicines/:id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.updateMedicine(id, data); }

    @Get('stock/:medicineId')
    getStock(@Param('medicineId') mid: number) { return this.svc.getStock(mid); }

    @Post('stock/import')
    importStock(@Body() data: any) { return this.svc.importStock(data); }

    @Post('stock/dispense')
    dispense(@Body() body: { medicine_id: number; quantity: number }) {
        return this.svc.dispenseMedicine(body.medicine_id, body.quantity);
    }

    @Get('expiring')
    getExpiring(@Query('days') days?: number) { return this.svc.getExpiringMedicines(days || 30); }

    @Get('low-stock')
    getLowStock() { return this.svc.getLowStockMedicines(); }

    @Get('stats')
    getStats() { return this.svc.getPharmacyStats(); }
}
