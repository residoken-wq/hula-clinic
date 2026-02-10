import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './system-config.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfig, ActivityLog])],
    controllers: [SystemController],
    providers: [SystemService],
    exports: [SystemService],
})
export class SystemModule { }
