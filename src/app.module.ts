import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// --- Interceptors ---
import { ActivityInterceptor } from './common/interceptors/activity.interceptor';
import { UserContextInterceptor } from './common/interceptors/user-context.interceptor';

// --- Core Modules ---
import { AuthModule } from './core/auth/auth.module';
import { UsersModule } from './core/users/users.module';
import { FeatureFlagModule } from './core/feature-flags/feature-flag.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { SystemModule } from './core/system/system.module';
import { FinanceModule } from './core/finance/finance.module';
import { HrModule } from './core/hr/hr.module';
import { TasksModule } from './core/tasks/tasks.module';
import { UploadModule } from './core/upload/upload.module';

// --- Core Entities ---
import { User } from './core/users/entities/user.entity';
import { UserGroup } from './core/users/entities/user-group.entity';
import { GroupPermission } from './core/users/entities/group-permission.entity';
import { FeatureFlag } from './core/feature-flags/feature-flag.entity';
import { Notification } from './core/notifications/notification.entity';
import { SystemConfig } from './core/system/system-config.entity';
import { ActivityLog } from './core/system/entities/activity-log.entity';
import { Transaction } from './core/finance/transaction.entity';
import { TransactionCategory } from './core/finance/transaction-category.entity';
import { Employee } from './core/hr/entities/employee.entity';
import { Attendance } from './core/hr/entities/attendance.entity';
import { LeaveRequest } from './core/hr/entities/leave-request.entity';
import { WorkShift } from './core/hr/entities/work-shift.entity';
import { Task } from './core/tasks/task.entity';

// --- Clinic Modules (loaded when INDUSTRY_TYPE=clinic) ---
import { PatientsModule } from './clinic/patients/patients.module';
import { AppointmentsModule } from './clinic/appointments/appointments.module';
import { MedicalRecordsModule } from './clinic/medical-records/medical-records.module';
import { PharmacyModule } from './clinic/pharmacy/pharmacy.module';
import { ServicesModule } from './clinic/services/services.module';
import { BillingModule } from './clinic/billing/billing.module';

// --- Clinic Entities ---
import { Patient } from './clinic/patients/entities/patient.entity';
import { Appointment } from './clinic/appointments/entities/appointment.entity';
import { MedicalRecord } from './clinic/medical-records/entities/medical-record.entity';
import { Prescription } from './clinic/medical-records/entities/prescription.entity';
import { Medicine } from './clinic/pharmacy/entities/medicine.entity';
import { MedicineStock } from './clinic/pharmacy/entities/medicine-stock.entity';
import { MedicalService } from './clinic/services/entities/medical-service.entity';
import { ServiceCategory } from './clinic/services/entities/service-category.entity';
import { Invoice } from './clinic/billing/entities/invoice.entity';
import { InvoiceItem } from './clinic/billing/entities/invoice-item.entity';

// === Collect ALL entities ===
const ALL_ENTITIES = [
    // Core
    User, UserGroup, GroupPermission,
    FeatureFlag,
    Notification,
    SystemConfig, ActivityLog,
    Transaction, TransactionCategory,
    Employee, Attendance, LeaveRequest, WorkShift,
    Task,
    // Clinic
    Patient,
    Appointment,
    MedicalRecord, Prescription,
    Medicine, MedicineStock,
    MedicalService, ServiceCategory,
    Invoice, InvoiceItem,
];

// === Collect Clinic Modules ===
const CLINIC_MODULES = [
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PharmacyModule,
    ServicesModule,
    BillingModule,
];

@Module({
    imports: [
        // --- Config ---
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),

        // --- Database ---
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('DB_HOST', 'localhost'),
                port: parseInt(configService.get('DB_PORT', '5432')),
                username: configService.get('DB_USERNAME', 'clinic_user'),
                password: configService.get('DB_PASSWORD', 'clinic_password'),
                database: configService.get('DB_DATABASE', 'clinic_db'),
                entities: ALL_ENTITIES,
                synchronize: true, // Auto-create tables (dev only)
                logging: false,
            }),
            inject: [ConfigService],
        }),

        // --- Core Modules (always loaded) ---
        AuthModule,
        UsersModule,
        FeatureFlagModule,
        NotificationsModule,
        SystemModule,
        FinanceModule,
        HrModule,
        TasksModule,
        UploadModule,

        // --- Clinic Modules (Industry-specific) ---
        ...CLINIC_MODULES,
    ],
    providers: [
        { provide: APP_INTERCEPTOR, useClass: ActivityInterceptor },
        { provide: APP_INTERCEPTOR, useClass: UserContextInterceptor },
    ],
})
export class AppModule { }
