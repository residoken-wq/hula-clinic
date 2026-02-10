import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { WorkShift } from './entities/work-shift.entity';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Employee, Attendance, LeaveRequest, WorkShift])],
    controllers: [HrController],
    providers: [HrService],
    exports: [HrService],
})
export class HrModule { }
