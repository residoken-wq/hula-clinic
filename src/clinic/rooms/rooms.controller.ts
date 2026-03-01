import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
    constructor(private svc: RoomsService) { }

    @Get()
    findAll() { return this.svc.findAll(); }

    @Get('available')
    findAvailable(
        @Query('date') date: string,
        @Query('start_time') startTime: string,
        @Query('end_time') endTime?: string,
    ) {
        return this.svc.findAvailable(date, startTime, endTime);
    }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.update(id, data); }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
