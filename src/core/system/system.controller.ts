import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
    constructor(private svc: SystemService) { }

    @Get('configs')
    getAllConfigs() { return this.svc.getAllConfigs(); }

    @Post('configs')
    setConfig(@Body() body: { key: string; value: string; description?: string }) {
        return this.svc.setConfig(body.key, body.value, body.description);
    }

    @Get('logs')
    getLogs(@Query() query: any) { return this.svc.getLogs(query); }
}
