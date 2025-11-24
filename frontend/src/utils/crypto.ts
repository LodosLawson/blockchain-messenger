import { ec as EC } from 'elliptic';
import sha256 from 'sha256';
import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';

const ec = new EC('secp256k1');

export const generateKeys = () => {
    const key = ec.genKeyPair();
    const publicKey = key.getPublic('hex');
    const privateKey = key.getPrivate('hex');
    return { publicKey, privateKey };
};

export const signTransaction = (privateKeyStr: string, amount: string, recipient: string) => {
    const key = ec.keyFromPrivate(privateKeyStr);
    const msgHash = sha256(amount.toString() + recipient);
    const signature = key.sign(msgHash);
    return signature.toDER('hex');
};

export const getPublicFromPrivate = (privateKeyStr: string) => {
    try {
        const key = ec.keyFromPrivate(privateKeyStr);
        return key.getPublic('hex');
    } catch (e) {
        return null;
    }
};

export const encryptMessage = (privateKeyStr: string, recipientPublicKeyStr: string, message: string) => {
    try {
        const myKey = ec.keyFromPrivate(privateKeyStr);
        const recipientKey = ec.keyFromPublic(recipientPublicKeyStr, 'hex');

        // ECDH: Derive shared secret
        const sharedSecret = myKey.derive(recipientKey.getPublic()).toString(16);

        // AES Encrypt
        const encrypted = AES.encrypt(message, sharedSecret).toString();
        return encrypted;
    } catch (e) {
        console.error("Encryption error:", e);
        return null;
    }
};

export const decryptMessage = (privateKeyStr: string, senderPublicKeyStr: string, encryptedMessage: string) => {
    try {
        const myKey = ec.keyFromPrivate(privateKeyStr);
        const senderKey = ec.keyFromPublic(senderPublicKeyStr, 'hex');

        // ECDH: Derive SAME shared secret
        const sharedSecret = myKey.derive(senderKey.getPublic()).toString(16);

        // AES Decrypt
        const bytes = AES.decrypt(encryptedMessage, sharedSecret);
        const originalMessage = bytes.toString(enc);
        return originalMessage;
    } catch (e) {
        console.error("Decryption error:", e);
        return null;
    }
};
