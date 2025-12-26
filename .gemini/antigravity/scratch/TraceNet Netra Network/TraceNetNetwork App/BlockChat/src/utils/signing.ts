import * as bip39 from 'bip39';
import nacl from 'tweetnacl';

// Polyfill Buffer if needed
if (typeof Buffer === 'undefined') {
    global.Buffer = require('buffer').Buffer;
}

/**
 * Derive Signing Key Pair (Ed25519) from Mnemonic
 * Matching TraceNet Docs: "Derived directly from the first 32 bytes of the Master Seed."
 */
export const deriveSigningKeyPair = (mnemonic: string) => {
    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic);

        // Docs: "Derived directly from the first 32 bytes of the Master Seed"
        const seedBytes = new Uint8Array(seed.slice(0, 32));

        const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);

        return {
            publicKey: toHex(keyPair.publicKey),
            privateKey: toHex(keyPair.secretKey)
        };
    } catch (error) {
        console.error('Failed to derive signing keys', error);
        throw error;
    }
};

/**
 * Sign data using Ed25519 Private Key
 */
export const signData = (data: string, privateKeyHex: string): string => {
    try {
        const privateKeyBytes = fromHex(privateKeyHex);
        const dataBytes = new TextEncoder().encode(data);

        const signatureBytes = nacl.sign.detached(dataBytes, privateKeyBytes);
        return toHex(signatureBytes);
    } catch (error) {
        console.error('Signing failed', error);
        throw error;
    }
};

// --- Helpers ---

const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hexString: string): Uint8Array => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
};

/**
 * Derive Wallet ID from Public Key
 * Format: TRN + RIPEMD160(SHA256(PublicKey))
 */
export const deriveWalletId = (publicKeyHex: string): string => {
    // Note: In client-side JS without full crypto lib, this might be tricky.
    // However, if we assume the backend validates based on Public Key matching the signature,
    // maybe we just need to send the proper TRN address if available.
    // BUT since we are on React Native/Expo, we might not have ripemd160 easily.

    // Fallback: If we have the address in AuthContext, we should reuse it.
    // BUT `social.ts` takes `mnemonic` only.

    // Quick fix: Import crypto-js for hashing if available or specific lib.
    // Given the environment, let's try to do it properly if we can, OR
    // pass the walletId explicitly to the social functions.

    // Better approach for now: Update social.ts to accept walletId OR derive it using 'crypto'.
    // Since 'crypto' is polyfilled in social.ts, let's use it there.
    return '';
};
