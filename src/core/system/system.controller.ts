import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
    constructor(private svc: SystemService) { }

    // --- Configs ---
    @Get('configs')
    getAllConfigs() { return this.svc.getAllConfigs(); }

    @Post('configs')
    setConfig(@Body() body: { key: string; value: string; description?: string }) {
        return this.svc.setConfig(body.key, body.value, body.description);
    }

    @Delete('configs/:id')
    deleteConfig(@Param('id') id: number) { return this.svc.deleteConfig(id); }

    // --- Logs ---
    @Get('logs')
    getLogs(@Query() query: any) { return this.svc.getLogs(query); }

    // --- Module Categories ---
    @Get('categories')
    getCategories(@Query() query: any) { return this.svc.getCategories(query); }

    @Post('categories')
    createCategory(@Body() data: any) { return this.svc.createCategory(data); }

    @Put('categories/:id')
    updateCategory(@Param('id') id: number, @Body() data: any) { return this.svc.updateCategory(id, data); }

    @Delete('categories/:id')
    deleteCategory(@Param('id') id: number) { return this.svc.deleteCategory(id); }

    @Post('categories/seed')
    seedCategories() { return this.svc.seedDefaultCategories(); }
}
