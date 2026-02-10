import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../../core/feature-flags/feature-flag.service';

export const FEATURE_FLAG_KEY = 'feature_flag';
export const FeatureFlag = (featureCode: string) => SetMetadata(FEATURE_FLAG_KEY, featureCode);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private featureFlagService: FeatureFlagService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const featureCode =
            this.reflector.get<string>(FEATURE_FLAG_KEY, context.getHandler()) ||
            this.reflector.get<string>(FEATURE_FLAG_KEY, context.getClass());

        if (!featureCode) return true;

        if (!this.featureFlagService.isEnabled(featureCode)) {
            throw new ForbiddenException(`Tính năng "${featureCode}" chưa được kích hoạt`);
        }
        return true;
    }
}
