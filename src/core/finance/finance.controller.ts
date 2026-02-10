import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
    constructor(private svc: FinanceService) { }

    @Get('transactions')
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Post('transactions')
    create(@Body() data: any) { return this.svc.createTransaction(data); }

    @Delete('transactions/:id')
    remove(@Param('id') id: number) { return this.svc.deleteTransaction(id); }

    @Get('report')
    getReport(@Query('year') year: number, @Query('month') month?: number) {
        return this.svc.getReport(year || new Date().getFullYear(), month);
    }

    @Get('categories')
    getCategories() { return this.svc.getCategories(); }

    @Post('categories')
    createCategory(@Body() data: any) { return this.svc.createCategory(data); }
}
