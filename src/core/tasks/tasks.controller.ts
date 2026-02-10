import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private svc: TasksService) { }

    @Get()
    findAll(@Query() query: any) { return this.svc.findAll(query); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.svc.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.svc.create(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.svc.update(id, data); }

    @Put(':id/status')
    updateStatus(@Param('id') id: number, @Body() body: { status: string }) {
        return this.svc.updateStatus(id, body.status);
    }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.svc.delete(id); }
}
