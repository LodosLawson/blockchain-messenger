# TraceNet: Şifreli Mesajlaşma Teknik Rehberi

TraceNet üzerinde uçtan uca şifreli mesajlaşmanın (End-to-End Encryption - E2EE) nasıl çalıştığını, mesajların nasıl oluşturulduğunu, gönderildiğini ve çözüldüğünü aşağıda adım adım bulabilirsin.

Bu süreçte **Curve25519** (TweetNaCl) algoritması kullanılmaktadır.

---

## 1. Anahtarların Oluşturulması (Key Derivation)

Her kullanıcının mnemonic (gizli kelimeler) üzerinden türetilen bir şifreleme anahtar çifti (Public & Private Key) vardır. 

*   **Algoritma:** BIP39 Seed -> BIP32 Path (@scure/bip32) -> Curve25519 (NaCl Box)
*   **Amaç:** Kullanıcıların mesajları sadece kendilerinin çözebilmesini sağlamak.

### Kod Örneği (`utils/encryption.ts`):
```typescript
export const deriveEncryptionKeyFromMnemonic = (mnemonic: string) => {
    // 1. Mnemonic'ten Seed oluştur (24 Kelime Standart)
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    
    // 2. Özel bir yol (Path) ile türet (TraceNet standardı)
    const { key } = ed25519.derivePath("m/44'/0'/0'/1'/0'", seed.toString('hex'));

    // 3. NaCl Box (Curve25519) anahtar çiftine dönüştür
    const keyPair = nacl.box.keyPair.fromSecretKey(new Uint8Array(key));

    return {
        publicKey: toHex(keyPair.publicKey),  // Herkesle paylaşılır
        privateKey: toHex(keyPair.secretKey), // SADECE cihazda saklanır
    };
};
```

---

## 2. Şifreli Mesaj Oluşturma (Encryption)

Bir mesajı şifrelemek için **Gönderenin Private Key**'i ve **Alıcının Public Key**'i kullanılır. Bu yöntem (Authenticated Encryption), mesajın sadece hedef kişi tarafından okunabilmesini ve mesajın gerçekten sizden geldiğinin kanıtlanmasını sağlar.

*   **Format:** `hex(nonce):hex(ciphertext)` şeklinde birleştirilmiş string.

### Adımlar:
1.  **Nonce (Number used once) Üret:** Rastgele 24 byte'lık bir sayı. Her mesaj için benzersiz olmalıdır.
2.  **Shared Secret (Ortak Sır):** `nacl.box` fonksiyonu, gönderenin private key'i ve alıcının public key'i ile matematiksel bir ortak sır oluşturur.
3.  **Şifreleme:** Mesaj bu ortak sır ve nonce ile şifrelenir.

### Kod Örneği (`utils/encryption.ts`):
```typescript
export const encryptMessage = (message, recipientPublicKey, senderPrivateKey) => {
    // 1. Nonce üret
    const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes

    // 2. Şifrele
    const encrypted = nacl.box(
        stringToUint8Array(message), // Mesajı byte'a çevir
        nonce,
        fromHex(recipientPublicKey),
        fromHex(senderPrivateKey)
    );

    // 3. Formatla ve Döndür: "nonce:ciphertext" (Hex formatında)
    return `${toHex(nonce)}:${toHex(encrypted)}`;
};
```

---

## 3. Mesajı Gönderme (Blockchain Transaction)

Mesajlaşma, REST API üzerinden değil, **Blockchain İşlemi (Transaction)** olarak gerçekleştirilir.

*   **API Endpoint:** `/transactions/add` (veya RPC üzerinden `/rpc/sendRawTx`)
*   **İşlem Tipi:** `PRIVATE_MESSAGE`
*   **Mobil Uyumluluk:** React Native ortamında `crypto` modülü olmadığı için `react-native-get-random-values` ve `buffer` polyfill'leri gereklidir.

### Transaction Yapısı:

```typescript
// 1. Transaction Oluştur (API Çağrısı Değil, Blockchain İşlemi)
const txBase = {
    type: 'PRIVATE_MESSAGE',
    to_wallet: recipientWallet,
    payload: {
        encrypted_message: encryptedText, // "nonce:ciphertext"
        nonce: nonceHex
    },
    timestamp: Date.now()
};

// 2. İmzala ve Gönder
// ... imzalama işlemleri (signData) ...
// sender_public_key ve sender_signature eklenir

await api.post('/transactions/add', signedTx);
```

---

## 4. Gelen Mesajı Açma (Decryption)

Alıcı, şifreli mesajı aldığında çözmek için **Kendi Private Key**'ini ve **Gönderenin Public Key**'ini kullanır.

### Adımlar:
1.  **Formatı Ayır:** Gelen `hex:hex` string'i nonce ve ciphertext olarak ikiye bölünür.
2.  **Deşifrele:** `nacl.box.open` fonksiyonu kullanılarak orijinal metne dönülür.

### Kod Örneği (`utils/encryption.ts`):
```typescript
export const decryptMessage = (encryptedData, senderPublicKey, recipientPrivateKey) => {
    // 1. Parçala
    const [nonceHex, cipherTextHex] = encryptedData.split(':');
    
    // 2. Çöz (Open Box)
    const decrypted = nacl.box.open(
        fromHex(cipherTextHex),
        fromHex(nonceHex),
        fromHex(senderPublicKey),   // Gönderenin PubKey'i (Mesajın ondan geldiğini doğrular)
        fromHex(recipientPrivateKey) // Benim PrivKey'im (Mesajı okumamı sağlar)
    );

    if (!decrypted) throw new Error("Şifre çözülemedi!");

    return uint8ArrayToString(decrypted); // "Merhaba!"
};
```

---

## Özet Akış

1.  **Alice (Gönderen)**, Bob'a (Alıcı) mesaj atacak.
2.  Alice, Bob'un **Public Key**'ini sunucudan/blockchain'den alır.
3.  Alice, mesajı **kendi Private Key**'i ve **Bob'un Public Key**'i ile şifreler (`encryptMessage`).
4.  Şifreli veri (`nonce:ciphertext`) Blockchain'e gönderilir.
5.  **Bob (Alıcı)** mesajı alır.
6.  Bob, mesajı **kendi Private Key**'i ve **Alice'in Public Key**'i ile çözer (`decryptMessage`).

Bu sayede sunucu veya blockchain üzerindeki hiç kimse mesajın içeriğini okuyamaz, sadece Alice ve Bob okuyabilir.
