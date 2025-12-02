import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from 'base-64';

/**
 * Generate a new encryption key pair (Curve25519)
 * Returns { publicKey: base64, privateKey: base64 }
 */
export const generateEncryptionKeyPair = (): { publicKey: string; privateKey: string } => {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: encodeToBase64(keyPair.publicKey),
        privateKey: encodeToBase64(keyPair.secretKey),
    };
};

/**
 * Encrypt a message using NaCl box (authenticated encryption)
 * @param message - Plain text message
 * @param recipientPublicKey - Recipient's public key (base64)
 * @param senderPrivateKey - Sender's private key (base64)
 * @returns Encrypted message with nonce (base64 encoded)
 */
export const encryptMessage = (
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string
): string => {
    try {
        // Convert message to Uint8Array
        const messageBytes = stringToUint8Array(message);

        // Decode keys from base64
        const recipientPublicKeyBytes = decodeFromBase64(recipientPublicKey);
        const senderPrivateKeyBytes = decodeFromBase64(senderPrivateKey);

        // Generate random nonce (24 bytes for NaCl box)
        const nonce = nacl.randomBytes(nacl.box.nonceLength);

        // Encrypt the message
        const encrypted = nacl.box(
            messageBytes,
            nonce,
            recipientPublicKeyBytes,
            senderPrivateKeyBytes
        );

        if (!encrypted) {
            throw new Error('Encryption failed');
        }

        // Combine nonce + encrypted data and encode as base64
        const combined = new Uint8Array(nonce.length + encrypted.length);
        combined.set(nonce);
        combined.set(encrypted, nonce.length);

        return encodeToBase64(combined);
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
};

/**
 * Decrypt a message using NaCl box
 * @param encryptedData - Encrypted message with nonce (base64)
 * @param senderPublicKey - Sender's public key (base64)
 * @param recipientPrivateKey - Recipient's private key (base64)
 * @returns Decrypted plain text message
 */
export const decryptMessage = (
    encryptedData: string,
    senderPublicKey: string,
    recipientPrivateKey: string
): string => {
    try {
        // Decode the combined data
        const combined = decodeFromBase64(encryptedData);

        // Split nonce and encrypted message
        const nonce = combined.slice(0, nacl.box.nonceLength);
        const encrypted = combined.slice(nacl.box.nonceLength);

        // Decode keys
        const senderPublicKeyBytes = decodeFromBase64(senderPublicKey);
        const recipientPrivateKeyBytes = decodeFromBase64(recipientPrivateKey);

        // Decrypt
        const decrypted = nacl.box.open(
            encrypted,
            nonce,
            senderPublicKeyBytes,
            recipientPrivateKeyBytes
        );

        if (!decrypted) {
            throw new Error('Decryption failed - message may be corrupted or keys are incorrect');
        }

        // Convert bytes back to string
        return uint8ArrayToString(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt message');
    }
};

// Helper functions

/**
 * Convert Uint8Array to base64 string
 */
const encodeToBase64 = (data: Uint8Array): string => {
    const binaryString = Array.from(data)
        .map(byte => String.fromCharCode(byte))
        .join('');
    return encodeBase64(binaryString);
};

/**
 * Convert base64 string to Uint8Array
 */
const decodeFromBase64 = (base64: string): Uint8Array => {
    const binaryString = decodeBase64(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * Convert string to Uint8Array (UTF-8 encoding)
 */
const stringToUint8Array = (str: string): Uint8Array => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

/**
 * Convert Uint8Array to string (UTF-8 decoding)
 */
const uint8ArrayToString = (bytes: Uint8Array): string => {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
};

