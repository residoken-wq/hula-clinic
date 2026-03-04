/**
 * API Transport Encryption — AES-256-GCM using Web Crypto API
 * 
 * Encrypts request bodies before sending and decrypts response bodies after receiving.
 * Key is derived from VITE_API_ENCRYPTION_KEY env variable using SHA-256.
 */

const KEY_HEX = (import.meta as any).env?.VITE_API_ENCRYPTION_KEY || '';

let _cryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey | null> {
    if (_cryptoKey) return _cryptoKey;

    const keySource = KEY_HEX || 'hula-clinic-dev-key-not-for-production';

    // Derive a 256-bit key using SHA-256
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(keySource));

    _cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    return _cryptoKey;
}

function bufToHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
}

/**
 * Encrypt plaintext JSON string → "iv:ciphertext:tag" hex format
 */
export async function encryptPayload(plaintext: string): Promise<string> {
    const key = await getCryptoKey();
    if (!key) return plaintext;

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        encoder.encode(plaintext)
    );

    // AES-GCM in WebCrypto appends auth tag to ciphertext
    const encryptedBytes = new Uint8Array(encrypted);
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const authTag = encryptedBytes.slice(encryptedBytes.length - 16);

    return `${bufToHex(iv.buffer)}:${bufToHex(authTag.buffer)}:${bufToHex(ciphertext.buffer)}`;
}

/**
 * Decrypt "iv:tag:ciphertext" hex format → plaintext JSON string
 */
export async function decryptPayload(payload: string): Promise<string> {
    const key = await getCryptoKey();
    if (!key) return payload;

    const parts = payload.split(':');
    if (parts.length !== 3) return payload;

    const iv = new Uint8Array(hexToBuf(parts[0]));
    const authTag = new Uint8Array(hexToBuf(parts[1]));
    const ciphertext = new Uint8Array(hexToBuf(parts[2]));

    // WebCrypto expects ciphertext + authTag concatenated
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.length);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        combined
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Check if transport encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
    return true; // Always enabled when this module is loaded
}
