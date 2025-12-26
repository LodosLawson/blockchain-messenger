import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encode as encodeBase64, decode as decodeBase64 } from 'base-64';
import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import { HDKey } from '@scure/bip32';

// Polyfill Buffer for bip39/hd-key if needed (React Native usually requires this)
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

// Helper to encode Uint8Array to Hex String
export const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

// Helper to decode Hex String to Uint8Array
const fromHex = (hexString: string): Uint8Array => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
};

/**
 * Generate a new encryption key pair (Curve25519)
 * Returns { publicKey: hex, privateKey: hex }
 */
export const generateEncryptionKeyPair = (): { publicKey: string; privateKey: string } => {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: toHex(keyPair.publicKey),
        privateKey: toHex(keyPair.secretKey),
    };
};

/**
 * Derive encryption key pair from mnemonic
 * Uses BIP39 to generate seed, and Ed25519-HD-Key to derive key at m/44'/0'/0'/1'/0'
 * Then converts to Curve25519 for NaCl box
 */
export const deriveEncryptionKeyFromMnemonic = (mnemonic: string): { publicKey: string; privateKey: string } => {
    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const { key } = ed25519.derivePath("m/44'/0'/0'/1'/0'", seed.toString('hex'));

        // key is 32 bytes. We use it as the secret key for NaCl box
        const keyPair = nacl.box.keyPair.fromSecretKey(new Uint8Array(key));

        return {
            publicKey: toHex(keyPair.publicKey),
            privateKey: toHex(keyPair.secretKey),
        };
    } catch (error) {
        console.error('Key derivation failed:', error);
        throw new Error('Failed to derive keys from mnemonic');
    }
};

/**
 * Generic BIP32 Derivation (Secp256k1 -> NaCl)
 */
export const deriveBIP32KeyPair = (mnemonic: string, path: string): { publicKey: string; privateKey: string } | null => {
    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const hdkey = HDKey.fromMasterSeed(seed);
        const derived = hdkey.derive(path);

        if (!derived.privateKey) return null;

        // Use first 32 bytes of the private key for NaCl Box
        const keyPair = nacl.box.keyPair.fromSecretKey(derived.privateKey.slice(0, 32));

        return {
            publicKey: toHex(keyPair.publicKey),
            privateKey: toHex(keyPair.secretKey),
        };
    } catch (e) {
        console.error(`BIP32 derivation failed for path ${path}:`, e);
        return null;
    }
};

/**
 * Generic Ed25519 Derivation (SLIP-0010 -> NaCl)
 */
export const deriveEd25519KeyPair = (mnemonic: string, path: string): { publicKey: string; privateKey: string } | null => {
    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic);
        const { key } = ed25519.derivePath(path, seed.toString('hex'));
        const keyPair = nacl.box.keyPair.fromSecretKey(new Uint8Array(key));
        return {
            publicKey: toHex(keyPair.publicKey),
            privateKey: toHex(keyPair.secretKey),
        };
    } catch (e: any) {
        // Suppress "Invalid derivation path" errors which are expected for non-hardened Ed25519
        if (e.message !== 'Invalid derivation path') {
            console.warn(`Ed25519 derivation failed for path ${path}:`, e.message);
        }
        return null;
    }
};

/**
 * LEGACY (WEB-COMPATIBLE) Key Derivation
 * Uses @scure/bip32 (Secp256k1) at m/44'/0'/0'/1'/0'
 */
export const deriveLegacyEncryptionKeyFromMnemonic = (mnemonic: string): { publicKey: string; privateKey: string } | null => {
    return deriveBIP32KeyPair(mnemonic, "m/44'/0'/0'/1'/0'");
};

/**
 * Encrypt a message using NaCl box (authenticated encryption)
 * Format: hex(nonce):hex(ciphertext)
 */
export const encryptMessage = (
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string
): string => {
    try {
        const messageBytes = stringToUint8Array(message);

        // Keys are expected to be Hex strings now
        const recipientPublicKeyBytes = fromHex(recipientPublicKey);
        const senderPrivateKeyBytes = fromHex(senderPrivateKey);

        if (recipientPublicKeyBytes.length !== 32) throw new Error(`Bad recipient public key size: ${recipientPublicKeyBytes.length}`);
        if (senderPrivateKeyBytes.length !== 32) throw new Error(`Bad sender private key size: ${senderPrivateKeyBytes.length}`);

        // Generate nonce
        const nonce = nacl.randomBytes(nacl.box.nonceLength);

        // Encrypt
        const encrypted = nacl.box(
            messageBytes,
            nonce,
            recipientPublicKeyBytes,
            senderPrivateKeyBytes
        );

        if (!encrypted) throw new Error('Encryption failed');

        // Return formatted string: hex(nonce):hex(ciphertext)
        return `${toHex(nonce)}:${toHex(encrypted)}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt message');
    }
};

/**
 * Decrypt a message using NaCl box
 * Expects format: hex(nonce):hex(ciphertext) OR base64(nonce+ciphertext)
 */
export const decryptMessage = (
    encryptedData: string,
    senderPublicKey: string,
    recipientPrivateKey: string
): string => {
    if (!encryptedData) {
        throw new Error('No encrypted content to decrypt.');
    }

    try {

        let nonce: Uint8Array;
        let ciphertext: Uint8Array;

        // Check if format is Hex:Hex (contains colon) or Base64 (legacy/web)
        if (encryptedData.includes(':')) {
            // Hex Format: hex(nonce):hex(ciphertext)
            // Report Format: "hex_nonce:hex_ciphertext"
            const parts = encryptedData.split(':');
            if (parts.length !== 2) throw new Error('Invalid hex message format. Expected nonce:ciphertext');

            try {
                nonce = fromHex(parts[0]);
                ciphertext = fromHex(parts[1]);
            } catch (e) {
                console.error('Hex parsing failed:', e);
                throw new Error('Invalid hex characters in message');
            }
        } else {
            // Base64 Format: base64(nonce + ciphertext)
            // This is the legacy format or Web App format
            try {
                const combined = decodeFromBase64(encryptedData); // We need a Uint8Array from Base64
                if (combined.length < nacl.box.nonceLength) throw new Error('Message too short for Base64');
                nonce = combined.slice(0, nacl.box.nonceLength);
                ciphertext = combined.slice(nacl.box.nonceLength);
            } catch (e) {
                // If base64 fails, throw original error or format error
                console.error('Base64 parsing failed:', e);
                // Last ditch: try to treat as hex if no colon? No, report says hex has colon.
                throw new Error('Invalid message format. Not Hex:Hex or valid Base64.');
            }
        }

        const senderPublicKeyBytes = fromHex(senderPublicKey);
        const recipientPrivateKeyBytes = fromHex(recipientPrivateKey);

        // Validate Key Sizes (Curve25519 Requires 32 bytes)
        if (senderPublicKeyBytes.length !== 32) throw new Error(`Invalid Sender Key Size: ${senderPublicKeyBytes.length}`);
        if (recipientPrivateKeyBytes.length !== 32) throw new Error(`Invalid Private Key Size: ${recipientPrivateKeyBytes.length}`);

        const decrypted = nacl.box.open(
            ciphertext,
            nonce,
            senderPublicKeyBytes,
            recipientPrivateKeyBytes
        );

        if (!decrypted) throw new Error('Decryption failed');

        return uint8ArrayToString(decrypted);
    } catch (error: any) {
        console.warn('Decryption error internal:', error.message);
        throw new Error('Failed to decrypt message');
    }
};

// Helper: Decode Base64 string to Uint8Array (needed for legacy support)
const decodeFromBase64 = (base64String: string): Uint8Array => {
    const binaryString = decodeBase64(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// ... keep valid helpers
const stringToUint8Array = (str: string): Uint8Array => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
};

const uint8ArrayToString = (bytes: Uint8Array): string => {
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
};

/**
 * Generates a new random mnemonic (24 words / 256 bits entropy).
 */
export const generateMnemonic = (): string => {
    return bip39.generateMnemonic(256);
};


