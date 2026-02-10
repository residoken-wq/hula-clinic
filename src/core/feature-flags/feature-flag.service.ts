import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlag } from './feature-flag.entity';

@Injectable()
export class FeatureFlagService implements OnModuleInit {
    private cache: Map<string, boolean> = new Map();

    constructor(
        @InjectRepository(FeatureFlag) private repo: Repository<FeatureFlag>,
    ) { }

    async onModuleInit() {
        await this.seedDefaults();
        await this.loadFlags();
    }

    async loadFlags() {
        const flags = await this.repo.find();
        this.cache.clear();
        flags.forEach(f => this.cache.set(f.code, f.enabled));
        console.log(`🏴 Loaded ${flags.length} feature flags`);
    }

    isEnabled(featureCode: string): boolean {
        const envKey = `FEATURE_${featureCode.toUpperCase()}`;
        if (process.env[envKey] !== undefined) {
            return process.env[envKey] === 'true';
        }
        return this.cache.get(featureCode) ?? false;
    }

    async toggle(featureCode: string, enabled: boolean) {
        await this.repo.update({ code: featureCode }, { enabled });
        this.cache.set(featureCode, enabled);
        return { code: featureCode, enabled };
    }

    async getAllFlags(): Promise<FeatureFlag[]> {
        return this.repo.find({ order: { category: 'ASC', code: 'ASC' } });
    }

    getEnabledFeatures(): string[] {
        return [...this.cache.entries()]
            .filter(([_, enabled]) => enabled)
            .map(([code]) => code);
    }

    private async seedDefaults() {
        const count = await this.repo.count();
        if (count > 0) return;

        const defaults: Partial<FeatureFlag>[] = [
            { code: 'patients', name: 'Quản lý Bệnh nhân', category: 'clinic', enabled: true },
            { code: 'appointments', name: 'Lịch hẹn khám', category: 'clinic', enabled: true, depends_on: 'patients' },
            { code: 'emr', name: 'Bệnh án điện tử', category: 'clinic', enabled: true, depends_on: 'patients' },
            { code: 'pharmacy', name: 'Kho thuốc', category: 'clinic', enabled: true },
            { code: 'services', name: 'Dịch vụ y tế', category: 'clinic', enabled: true },
            { code: 'billing', name: 'Thanh toán / Hóa đơn', category: 'clinic', enabled: true },
            { code: 'finance', name: 'Tài chính (Thu/Chi)', category: 'core', enabled: true },
            { code: 'hr', name: 'Nhân sự', category: 'core', enabled: true },
            { code: 'tasks', name: 'Công việc', category: 'core', enabled: true },
        ];

        for (const flag of defaults) {
            await this.repo.save(this.repo.create(flag));
        }
        console.log('✅ Feature flags seeded');
    }
}
