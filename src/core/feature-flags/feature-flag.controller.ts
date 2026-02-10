import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('features')
export class FeatureFlagController {
    constructor(private featureFlagService: FeatureFlagService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    getAllFlags() {
        return this.featureFlagService.getAllFlags();
    }

    @Get('enabled')
    getEnabledFeatures() {
        return this.featureFlagService.getEnabledFeatures();
    }

    @Patch(':code/toggle')
    @UseGuards(JwtAuthGuard)
    toggle(@Param('code') code: string, @Body() body: { enabled: boolean }) {
        return this.featureFlagService.toggle(code, body.enabled);
    }
}
