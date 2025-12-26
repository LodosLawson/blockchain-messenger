# TraceNet Encryption Guide

## 🔐 Overview

This guide demonstrates how to implement end-to-end encryption for secure messaging in TraceNet using **NaCl box** (Curve25519-XSalsa20-Poly1305).

## 🎯 Quick Start

### JavaScript/Node.js

```javascript
const nacl = require('tweetnacl');
const axios = require('axios');

const API_URL = 'http://localhost:3000';

// 1. Generate encryption key pair for new user
function generateEncryptionKeyPair() {
    const keyPair = nacl.box.keyPair();
    return {
        publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
        privateKey: Buffer.from(keyPair.secretKey).toString('base64')
    };
}

// 2. Get recipient's encryption public key
async function getRecipientKey(nickname) {
    const response = await axios.get(
        `${API_URL}/api/user/encryption-key/${nickname}`
    );
    return response.data.encryption_public_key;
}

// 3. Encrypt message
function encryptMessage(message, recipientPublicKey, senderPrivateKey) {
    const messageBytes = new TextEncoder().encode(message);
    const recipientPubBytes = Buffer.from(recipientPublicKey, 'base64');
    const senderPrivBytes = Buffer.from(senderPrivateKey, 'base64');
    
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
        messageBytes,
        nonce,
        recipientPubBytes,
        senderPrivBytes
    );
    
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    return Buffer.from(combined).toString('base64');
}

// 4. Decrypt message
function decryptMessage(encryptedData, senderPublicKey, recipientPrivateKey) {
    const combined = Buffer.from(encryptedData, 'base64');
    const nonce = combined.slice(0, nacl.box.nonceLength);
    const encrypted = combined.slice(nacl.box.nonceLength);
    
    const senderPubBytes = Buffer.from(senderPublicKey, 'base64');
    const recipientPrivBytes = Buffer.from(recipientPrivateKey, 'base64');
    
    const decrypted = nacl.box.open(
        encrypted,
        nonce,
        senderPubBytes,
        recipientPrivBytes
    );
    
    return new TextDecoder().decode(decrypted);
}

// Complete workflow
async function sendEncryptedMessage() {
    // Alice wants to send message to Bob
    
    // Step 1: Get Bob's public encryption key
    const bobKey = await getRecipientKey('bob');
    
    // Step 2: Encrypt message
    const message = 'Hello Bob! This is secret.';
    const encrypted = encryptMessage(
        message,
        bobKey,
        alicePrivateKey  // Alice's private key (stored securely)
    );
    
    // Step 3: Send via API
    await axios.post(`${API_URL}/api/messaging/send`, {
        from_wallet: aliceWalletId,
        to_wallet: bobWalletId,
        encrypted_message: encrypted,
        sender_public_key: alicePublicKey,
        sender_signature: signature
    });
}
```

### Python Example

```python
from nacl.public import PrivateKey, PublicKey, Box
import base64
import requests

API_URL = 'http://localhost:3000'

# 1. Generate key pair
def generate_keypair():
    private_key = PrivateKey.generate()
    public_key = private_key.public_key
    
    return {
        'private_key': base64.b64encode(bytes(private_key)).decode(),
        'public_key': base64.b64encode(bytes(public_key)).decode()
    }

# 2. Get recipient's key
def get_encryption_key(nickname):
    response = requests.get(f'{API_URL}/api/user/encryption-key/{nickname}')
    return response.json()['encryption_public_key']

# 3. Encrypt message
def encrypt_message(message, recipient_public_key_b64, sender_private_key_b64):
    # Decode keys
    sender_private = PrivateKey(base64.b64decode(sender_private_key_b64))
    recipient_public = PublicKey(base64.b64decode(recipient_public_key_b64))
    
    # Create box
    box = Box(sender_private, recipient_public)
    
    # Encrypt (nonce is automatically prepended)
    encrypted = box.encrypt(message.encode('utf-8'))
    
    return base64.b64encode(encrypted).decode()

# 4. Decrypt message
def decrypt_message(encrypted_b64, sender_public_key_b64, recipient_private_key_b64):
    # Decode
    recipient_private = PrivateKey(base64.b64decode(recipient_private_key_b64))
    sender_public = PublicKey(base64.b64decode(sender_public_key_b64))
    
    # Create box
    box = Box(recipient_private, sender_public)
    
    # Decrypt
    decrypted = box.decrypt(base64.b64decode(encrypted_b64))
    
    return decrypted.decode('utf-8')

# Example usage
keys = generate_keypair()
bob_key = get_encryption_key('bob')
encrypted = encrypt_message('Secret message', bob_key, keys['private_key'])
```

### React Native

```typescript
import { encryptMessage, decryptMessage, generateEncryptionKeyPair } from '../utils/encryption';
import { getEncryptionKey } from '../api/auth';
import * as SecureStore from 'expo-secure-store';

// 1. Generate and store keys during registration
const handleRegister = async () => {
    // Generate encryption keypair
    const encryptionKeys = generateEncryptionKeyPair();
    
    // Store private key securely
    await SecureStore.setItemAsync(
        'encryption_private_key',
        encryptionKeys.privateKey
    );
    
    // Send public key to backend during user creation
    await registerUser({
        nickname: 'alice',
        encryption_public_key: encryptionKeys.publicKey,
        // ... other fields
    });
};

// 2. Send encrypted message
const sendMessage = async (recipientNickname: string, message: string) => {
    // Get recipient's public key
    const recipientData = await getEncryptionKey(recipientNickname);
    
    // Get sender's private key
    const senderPrivateKey = await SecureStore.getItemAsync('encryption_private_key');
    
    // Encrypt message
    const encryptedMessage = encryptMessage(
        message,
        recipientData.encryption_public_key,
        senderPrivateKey!
    );
    
    // Send to API
    await sendEncryptedMessage({
        from_wallet: myWalletId,
        to_wallet: recipientData.wallet_id,
        encrypted_message: encryptedMessage,
        sender_public_key: myPublicKey,
        sender_signature: signature
    });
};

// 3. Decrypt received messages
const decryptReceivedMessage = async (
    encryptedMessage: string,
    senderPublicKey: string
) => {
    // Get recipient's private key
    const recipientPrivateKey = await SecureStore.getItemAsync('encryption_private_key');
    
    // Decrypt
    const plainText = decryptMessage(
        encryptedMessage,
        senderPublicKey,
        recipientPrivateKey!
    );
    
    return plainText;
};
```

## 🔒 API Endpoints

### Get Encryption Key

```bash
GET /api/user/encryption-key/:identifier
```

**Example:**
```bash
curl http://localhost:3000/api/user/encryption-key/alice
```

**Response:**
```json
{
  "user_id": "usr_123",
  "nickname": "alice",
  "wallet_id": "TRNabc...",
  "encryption_public_key": "a1b2c3d4e5...",
  "messaging_privacy": "public"
}
```

### Update Messaging Privacy

```bash
POST /api/user/:userId/messaging-privacy
```

**Body:**
```json
{
  "privacy": "public" | "followers" | "private"
}
```

### Generate QR Code

```bash
GET /api/user/:userId/qr-code
```

**Response:**
```json
{
  "qr_data": {
    "type": "tracenet_messaging",
    "nickname": "alice",
    "wallet_id": "TRNabc...",
    "encryption_public_key": "a1b2c3...",
    "messaging_privacy": "public"
  },
  "qr_string": "tracenet://msg?key=a1b2c3&wallet=TRNabc&nick=alice"
}
```

## 🛡️ Security Best Practices

### ✅ DO

- **Generate keys client-side** - Never send private keys to server
- **Store private keys securely** - Use SecureStore, Keychain, or encrypted storage
- **Validate public keys** - Verify key format before encryption
- **Use random nonces** - Never reuse nonces (NaCl handles this automatically)
- **Backup mnemonic** - Prompt users to backup their mnemonic phrase
- **Check privacy settings** - Respect user messaging preferences

### ❌ DON'T

- **Never log private keys** - Even in development
- **Never send private keys over network** - Only public keys should be transmitted
- **Don't store keys in plain text** - Always use secure storage
- **Don't skip key validation** - Invalid keys cause decryption failures
- **Don't ignore errors** - Handle encryption/decryption failures gracefully

## 🧪 Testing

Run the example script:

```bash
cd examples
node encryption_example.js
```

Expected output:
```
✅ Alice's keys generated
✅ Bob's keys generated
✅ Decryption successful!
✅ SUCCESS: Message integrity verified!
✅ Security verified: Cannot decrypt with wrong keys
```

## 🔍 Troubleshooting

### "No PRNG" Error
**Solution:** Import `react-native-get-random-values` at the top of your file:
```typescript
import 'react-native-get-random-values';
```

### Decryption Fails
**Causes:**
- Wrong public/private key pair
- Corrupted encrypted data
- Keys not in base64 format
- Message encrypted for different recipient

**Solution:** Verify keys match and data is properly encoded

### "Cannot find module tweetnacl"
**Solution:** Install dependencies:
```bash
npm install tweetnacl react-native-get-random-values base-64
```

## 📚 Additional Resources

- [NaCl Documentation](https://nacl.cr.yp.to/)
- [TweetNaCl.js GitHub](https://github.com/dchest/tweetnacl-js)
- [Curve25519 Specification](https://cr.yp.to/ecdh.html)
- [TraceNet API Documentation](./api_examples.js)
