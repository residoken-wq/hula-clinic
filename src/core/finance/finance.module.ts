import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transaction-category.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, TransactionCategory])],
    controllers: [FinanceController],
    providers: [FinanceService],
    exports: [FinanceService],
})
export class FinanceModule implements OnModuleInit {
    constructor(private financeService: FinanceService) { }
    async onModuleInit() { await this.financeService.seedCategories(); }
}
