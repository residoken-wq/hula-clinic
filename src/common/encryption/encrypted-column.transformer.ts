import { ValueTransformer } from 'typeorm';
import { getEncryptionServiceInstance } from './encryption.service';

/**
 * TypeORM ValueTransformer that auto-encrypts on save and decrypts on read.
 * 
 * Usage in entity:
 *   @Column({ nullable: true, transformer: EncryptedColumnTransformer })
 *   phone: string;
 */
export const EncryptedColumnTransformer: ValueTransformer = {
    // Called when writing to DB
    to(value: string | null): string | null {
        if (!value) return value;
        const svc = getEncryptionServiceInstance();
        if (!svc) return value; // No encryption service = store plain
        return svc.encrypt(value);
    },

    // Called when reading from DB
    from(value: string | null): string | null {
        if (!value) return value;
        const svc = getEncryptionServiceInstance();
        if (!svc) return value;
        return svc.decrypt(value);
    },
};
