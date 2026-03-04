import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

/**
 * API Transport Encryption Interceptor
 * 
 * Request flow:  Client sends { _encrypted: "iv:tag:ciphertext" } + header X-Encrypted: 1
 *                → Interceptor decrypts → overwrites request.body with plaintext JSON
 * 
 * Response flow: Controller returns JSON
 *                → Interceptor encrypts → sends { _encrypted: "iv:tag:ciphertext" } + header X-Encrypted: 1
 */
@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
    private readonly transportKey: Buffer;

    constructor(private readonly encryptionService: EncryptionService) {
        const keySource = process.env.API_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'hula-clinic-dev-key-not-for-production';
        this.transportKey = crypto.createHash('sha256').update(keySource).digest();
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const isEncryptedRequest = request.headers['x-encrypted'] === '1';

        // --- DECRYPT REQUEST ---
        if (isEncryptedRequest && request.body?._encrypted) {
            try {
                const decrypted = this.decryptTransport(request.body._encrypted);
                request.body = JSON.parse(decrypted);
            } catch (err) {
                console.error('❌ Transport decryption failed:', err.message);
            }
        }

        // --- ENCRYPT RESPONSE ---
        return next.handle().pipe(
            map(data => {
                if (!isEncryptedRequest) return data;

                try {
                    const plaintext = JSON.stringify(data);
                    const encrypted = this.encryptTransport(plaintext);
                    response.setHeader('X-Encrypted', '1');
                    return { _encrypted: encrypted };
                } catch (err) {
                    console.error('❌ Transport encryption failed:', err.message);
                    return data;
                }
            })
        );
    }

    private encryptTransport(plaintext: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.transportKey, iv);

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    private decryptTransport(payload: string): string {
        const parts = payload.split(':');
        if (parts.length !== 3) throw new Error('Invalid encrypted payload format');

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.transportKey, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
