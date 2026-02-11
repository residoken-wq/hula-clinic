import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly key: Buffer;

    constructor(private configService: ConfigService) {
        const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
        if (!keyHex || keyHex.length < 64) {
            console.warn('⚠️ ENCRYPTION_KEY not set or too short. Using fallback key (NOT SECURE for production!)');
            // Fallback key for development only
            this.key = crypto.createHash('sha256').update('hula-clinic-dev-key-not-for-production').digest();
        } else {
            this.key = Buffer.from(keyHex, 'hex');
        }
    }

    encrypt(plaintext: string): string {
        if (!plaintext) return plaintext;

        const iv = crypto.randomBytes(12); // 96-bit IV for GCM
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:ciphertext (all hex)
        return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    decrypt(ciphertext: string): string {
        if (!ciphertext) return ciphertext;

        // Skip if not encrypted (plain text from before encryption was enabled)
        if (!ciphertext.startsWith('enc:')) return ciphertext;

        try {
            const parts = ciphertext.split(':');
            if (parts.length !== 4) return ciphertext;

            const iv = Buffer.from(parts[1], 'hex');
            const authTag = Buffer.from(parts[2], 'hex');
            const encrypted = parts[3];

            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error.message);
            return ciphertext; // Return as-is if decryption fails
        }
    }

    isEncrypted(value: string): boolean {
        return value?.startsWith('enc:') ?? false;
    }
}

// --- Singleton instance for TypeORM transformer (initialized lazily) ---
let _encryptionServiceInstance: EncryptionService | null = null;

export function setEncryptionServiceInstance(service: EncryptionService) {
    _encryptionServiceInstance = service;
}

export function getEncryptionServiceInstance(): EncryptionService | null {
    return _encryptionServiceInstance;
}
