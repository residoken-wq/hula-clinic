import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Room, Appointment])],
    controllers: [RoomsController],
    providers: [RoomsService],
    exports: [RoomsService],
})
export class RoomsModule { }
