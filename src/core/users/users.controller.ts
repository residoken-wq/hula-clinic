import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    findAll() { return this.usersService.findAll(); }

    @Get(':id')
    findOne(@Param('id') id: number) { return this.usersService.findOne(id); }

    @Post()
    create(@Body() data: any) { return this.usersService.createUser(data); }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) { return this.usersService.updateUser(id, data); }

    @Post(':id/change-password')
    changePassword(@Param('id') id: number, @Body() body: { password: string }) {
        return this.usersService.changePassword(id, body.password);
    }

    @Delete(':id')
    remove(@Param('id') id: number) { return this.usersService.deleteUser(id); }

    // --- Groups ---
    @Get('groups/all')
    getAllGroups() { return this.usersService.getAllGroups(); }

    @Get('groups/:id')
    getGroupDetail(@Param('id') id: number) { return this.usersService.getGroupDetail(id); }

    @Post('groups')
    createGroup(@Body() data: any) { return this.usersService.createGroup(data); }

    @Put('groups/:id/permissions')
    updateGroupPermissions(@Param('id') id: number, @Body() body: { permissions: any[] }) {
        return this.usersService.updateGroupPermissions(id, body.permissions);
    }
}
