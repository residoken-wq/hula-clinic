import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { FinanceModule } from '../../core/finance/finance.module';
import { NotificationsModule } from '../../core/notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, InvoiceItem]),
        FinanceModule,
        NotificationsModule,
    ],
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService],
})
export class BillingModule { }
