/**
 * Crypto polyfill for Node.js Alpine Linux compatibility
 * Fixes TypeORM crypto.randomUUID() issue in Docker containers
 */

import { randomBytes } from 'crypto';

// Generate UUID v4 function
function generateUUID(): string {
    const bytes = randomBytes(16);

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

    // Convert to hex string with dashes
    const hex = bytes.toString('hex');
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
}

// Polyfill for globalThis.crypto
if (typeof globalThis.crypto === 'undefined') {
    globalThis.crypto = {} as any;
}

if (typeof globalThis.crypto.randomUUID === 'undefined') {
    globalThis.crypto.randomUUID = generateUUID as any;
}

// Polyfill for global.crypto
if (typeof global.crypto === 'undefined') {
    const crypto = require('crypto');
    global.crypto = {
        ...crypto,
        randomUUID: generateUUID as any
    };
} else if (typeof global.crypto.randomUUID === 'undefined') {
    global.crypto.randomUUID = generateUUID as any;
}

// Polyfill for direct crypto import
const cryptoModule = require('crypto');
if (typeof cryptoModule.randomUUID === 'undefined') {
    cryptoModule.randomUUID = generateUUID;
}

console.log('✅ Crypto polyfill loaded successfully');
