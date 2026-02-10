import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { FeatureFlag, FeatureFlagGuard } from '../../common/guards/feature-flag.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag('billing')
export class BillingController {
    constructor(private svc: BillingService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Get('revenue')
    getRevenue(@Query('year') year: number, @Query('month') month?: number) {
        return this.svc.getRevenueStats(year || new Date().getFullYear(), month);
    }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Post(':id/pay')
    pay(@Param('id') id: number, @Body() body: { amount: number; method: string }) {
        return this.svc.pay(id, body.amount, body.method);
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: number) { return this.svc.cancel(id); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
