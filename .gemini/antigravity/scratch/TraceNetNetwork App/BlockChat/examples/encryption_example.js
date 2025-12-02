/**
 * TraceNet End-to-End Encryption Example
 * 
 * This example demonstrates complete end-to-end encryption workflow:
 * 1. Generate encryption key pairs for two users
 * 2. User A encrypts a message for User B
 * 3. User B decrypts the message
 * 
 * Run: node encryption_example.js
 */

const nacl = require('tweetnacl');

// Helper functions to convert between formats
function encodeBase64(data) {
    return Buffer.from(data).toString('base64');
}

function decodeBase64(str) {
    return new Uint8Array(Buffer.from(str, 'base64'));
}

function stringToBytes(str) {
    return new TextEncoder().encode(str);
}

function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}

function encryptMessage(message, recipientPublicKey, senderPrivateKey) {
    const messageBytes = stringToBytes(message);
    const recipientPublicKeyBytes = decodeBase64(recipientPublicKey);
    const senderPrivateKeyBytes = decodeBase64(senderPrivateKey);

    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    const encrypted = nacl.box(
        messageBytes,
        nonce,
        recipientPublicKeyBytes,
        senderPrivateKeyBytes
    );

    if (!encrypted) {
        throw new Error('Encryption failed');
    }

    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);

    return encodeBase64(combined);
}

function decryptMessage(encryptedData, senderPublicKey, recipientPrivateKey) {
    const combined = decodeBase64(encryptedData);
    const nonce = combined.slice(0, nacl.box.nonceLength);
    const encrypted = combined.slice(nacl.box.nonceLength);

    const senderPublicKeyBytes = decodeBase64(senderPublicKey);
    const recipientPrivateKeyBytes = decodeBase64(recipientPrivateKey);

    const decrypted = nacl.box.open(
        encrypted,
        nonce,
        senderPublicKeyBytes,
        recipientPrivateKeyBytes
    );

    if (!decrypted) {
        throw new Error('Decryption failed');
    }

    return bytesToString(decrypted);
}

// ============================================
// DEMO: End-to-End Encryption Flow
// ============================================

console.log('🔐 TraceNet End-to-End Encryption Demo\n');
console.log('═'.repeat(60));

// 1. Generate key pairs for Alice and Bob
console.log('\n1️⃣  Generating encryption key pairs...\n');

const aliceKeyPair = nacl.box.keyPair();
const bobKeyPair = nacl.box.keyPair();

const alice = {
    name: 'Alice',
    publicKey: encodeBase64(aliceKeyPair.publicKey),
    privateKey: encodeBase64(aliceKeyPair.secretKey)
};

const bob = {
    name: 'Bob',
    publicKey: encodeBase64(bobKeyPair.publicKey),
    privateKey: encodeBase64(bobKeyPair.secretKey)
};

console.log('✅ Alice\'s keys generated');
console.log('   Public Key:', alice.publicKey.substring(0, 40) + '...');
console.log('   Private Key: [REDACTED]\n');

console.log('✅ Bob\'s keys generated');
console.log('   Public Key:', bob.publicKey.substring(0, 40) + '...');
console.log('   Private Key: [REDACTED]\n');

console.log('═'.repeat(60));

// 2. Alice sends encrypted message to Bob
console.log('\n2️⃣  Alice encrypts message for Bob...\n');

const originalMessage = 'Hello Bob! This is a secret message. 🔒';
console.log('   Original message:', originalMessage);

const encryptedMessage = encryptMessage(
    originalMessage,
    bob.publicKey,        // Recipient's public key
    alice.privateKey      // Sender's private key
);

console.log('   Encrypted:', encryptedMessage.substring(0, 60) + '...');
console.log('   Length:', encryptedMessage.length, 'characters\n');

console.log('═'.repeat(60));

// 3. Bob decrypts message from Alice
console.log('\n3️⃣  Bob decrypts message from Alice...\n');

const decryptedMessage = decryptMessage(
    encryptedMessage,
    alice.publicKey,      // Sender's public key
    bob.privateKey        // Recipient's private key
);

console.log('   Decrypted message:', decryptedMessage);
console.log('\n✅ Decryption successful!\n');

// 4. Verify message integrity
if (decryptedMessage === originalMessage) {
    console.log('═'.repeat(60));
    console.log('\n✅ SUCCESS: Message integrity verified!');
    console.log('   Original and decrypted messages match perfectly.\n');
} else {
    console.log('❌ ERROR: Message mismatch!\n');
}

// 5. Demonstrate that wrong keys cannot decrypt
console.log('═'.repeat(60));
console.log('\n4️⃣  Security test: Cannot decrypt with wrong keys...\n');

try {
    // Try to decrypt with Charlie's keys (should fail)
    const charlieKeyPair = nacl.box.keyPair();
    const charlie = {
        publicKey: encodeBase64(charlieKeyPair.publicKey),
        privateKey: encodeBase64(charlieKeyPair.secretKey)
    };

    const wrongDecryption = decryptMessage(
        encryptedMessage,
        alice.publicKey,
        charlie.privateKey    // Wrong private key!
    );

    console.log('❌ SECURITY BREACH: Message was decrypted with wrong key!');
} catch (error) {
    console.log('✅ Security verified: Cannot decrypt with wrong keys');
    console.log('   Error:', error.message);
}

console.log('\n' + '═'.repeat(60));
console.log('\n🎉 End-to-End Encryption Test Complete!\n');
console.log('Key Points:');
console.log('  • Messages are encrypted using NaCl box (Curve25519)');
console.log('  • Only sender and recipient can read messages');
console.log('  • Encryption provides authenticity and confidentiality');
console.log('  • Wrong keys cannot decrypt messages\n');
