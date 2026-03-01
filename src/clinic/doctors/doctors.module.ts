import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Employee } from '../../core/hr/entities/employee.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';

@Module({
    imports: [TypeOrmModule.forFeature([DoctorSchedule, Employee, Appointment])],
    controllers: [DoctorsController],
    providers: [DoctorsService],
    exports: [DoctorsService],
})
export class DoctorsModule { }
