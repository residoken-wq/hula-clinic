import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalService } from './entities/medical-service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MedicalService, ServiceCategory])],
    controllers: [ServicesController],
    providers: [ServicesService],
    exports: [ServicesService],
})
export class ServicesModule implements OnModuleInit {
    constructor(private svc: ServicesService) { }
    async onModuleInit() { await this.svc.seedCategories(); }
}
