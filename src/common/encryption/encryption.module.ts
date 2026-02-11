import { Module, Global, OnModuleInit } from '@nestjs/common';
import { EncryptionService, setEncryptionServiceInstance } from './encryption.service';

@Global()
@Module({
    providers: [EncryptionService],
    exports: [EncryptionService],
})
export class EncryptionModule implements OnModuleInit {
    constructor(private encryptionService: EncryptionService) { }

    onModuleInit() {
        // Register singleton so TypeORM transformer can access it
        setEncryptionServiceInstance(this.encryptionService);
        console.log('🔐 Encryption service initialized');
    }
}
