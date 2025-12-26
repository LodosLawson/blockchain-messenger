import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { sendEncryptedMessage, getMessages } from '../api/messaging';
import { getEncryptionKey } from '../api/auth';
import { RouteProp, useRoute } from '@react-navigation/native';
import { User } from '../types';
import { deriveSigningKeyPair, signData } from '../utils/signing';
import { encryptMessage, decryptMessage, deriveEncryptionKeyFromMnemonic, deriveLegacyEncryptionKeyFromMnemonic, toHex } from '../utils/encryption';
import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

type ChatRouteProp = RouteProp<{ Chat: { user: User } }, 'Chat'>;

interface Message {
    id: string; // Should be tx_id if available to prevent dupes
    text: string;
    encryptedText: string;
    senderWallet: string;
    isMine: boolean;
    timestamp: Date;
    blockId?: string; // Optional if not yet mined
    decrypted?: boolean;
    sender_encryption_key?: string;
    recipient_encryption_key?: string;
    encrypted_message?: string;
}

export default function ChatScreen() {
    const { user: loggedInUser, wallet, mnemonic } = useAuth();
    const route = useRoute<ChatRouteProp>();
    const recipientUser = route.params?.user;

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const [recipientEncryptionKey, setRecipientEncryptionKey] = useState<string | null>(null);
    const [myEncryptionPrivateKey, setMyEncryptionPrivateKey] = useState<string | null>(null);
    const [myEncryptionPublicKey, setMyEncryptionPublicKey] = useState<string | null>(null);
    const [myLegacyEncryptionPrivateKey, setMyLegacyEncryptionPrivateKey] = useState<string | null>(null);
    const [myLegacyEncryptionPublicKey, setMyLegacyEncryptionPublicKey] = useState<string | null>(null);
    const [myRawEncryptionPrivateKey, setMyRawEncryptionPrivateKey] = useState<string | null>(null);
    const [myRawEncryptionPublicKey, setMyRawEncryptionPublicKey] = useState<string | null>(null);
    const [mySigningPrivateKey, setMySigningPrivateKey] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Modal State
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [userInfoVisible, setUserInfoVisible] = useState(false);

    // Safety check just in case navigation messes up
    if (!recipientUser) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text>Error: User not found</Text>
            </View>
        );
    }

    // Setup encryption and signing keys
    // Setup encryption and signing keys
    useEffect(() => {
        const setupEncryption = async () => {
            try {
                // Check prerequisites (omitted for brevity, same as before)
                if (!recipientUser || !loggedInUser || !mnemonic) return;

                // 0. Auto-Fix Profile if Unknown
                // If we navigated here with a skeleton user, try to fetch the real one
                if (recipientUser.nickname === 'Unknown' || !recipientUser.nickname) {
                    console.log('👤 Recipient is Unknown, trying to fetch profile:', recipientUser.user_id);
                    try {
                        const { getUserById } = require('../api/auth');
                        const userRes = await getUserById(recipientUser.user_id);
                        if (userRes && userRes.user) {
                            console.log('👤 Fetched real profile:', userRes.user.nickname);
                            // We can't mutate route.params, but we can update a local state if we used one.
                            // However, recipientUser is const from route.params.
                            // Best practice: Use a local state for the user that initializes from route.params
                            // But refactoring that is large.
                            // For now, let's just ensure we get the keys using the ID if nickname fails.
                        }
                    } catch (e) {
                        console.warn('Could not fetch profile for unknown user');
                    }
                }

                // Get recipient's encryption public key
                try {
                    // Start with what we have
                    let identifier = recipientUser.nickname;

                    // If nickname is bad, use ID
                    if (!identifier || identifier === 'Unknown') {
                        identifier = recipientUser.user_id;
                    }

                    if (identifier && identifier !== 'Unknown') {
                        const recipientKeyData = await getEncryptionKey(identifier);
                        if (recipientKeyData?.encryption_public_key) {
                            setRecipientEncryptionKey(recipientKeyData.encryption_public_key);
                        }
                    } else {
                        console.warn('Cannot fetch encryption key: Missing valid identifier (nickname or user_id)');
                    }
                } catch (keyError) {
                    console.warn('Failed to fetch recipient encryption key:', keyError);
                }

                // Derive my keys
                const { deriveEncryptionKeyFromMnemonic, deriveLegacyEncryptionKeyFromMnemonic } = require('../utils/encryption');
                const { deriveSigningKeyPair } = require('../utils/signing');

                const encKeys = deriveEncryptionKeyFromMnemonic(mnemonic);
                setMyEncryptionPrivateKey(encKeys.privateKey);
                setMyEncryptionPublicKey(encKeys.publicKey);

                // 2. Legacy Key (BIP32) - Web Compat
                const legacyKeys = deriveLegacyEncryptionKeyFromMnemonic(mnemonic);
                const legacyPrivateKey = legacyKeys ? legacyKeys.privateKey : null;
                setMyLegacyEncryptionPrivateKey(legacyPrivateKey); // Set State
                setMyLegacyEncryptionPublicKey(legacyKeys ? legacyKeys.publicKey : null);

                // 3. Raw Seed Key (Experimental)
                let rawKeys = null;
                try {
                    const seed = bip39.mnemonicToSeedSync(mnemonic);
                    const rawSecret = seed.slice(0, 32);
                    const rawKeyPair = nacl.box.keyPair.fromSecretKey(rawSecret);
                    rawKeys = {
                        publicKey: toHex(rawKeyPair.publicKey),
                        privateKey: toHex(rawKeyPair.secretKey)
                    };
                    setMyRawEncryptionPrivateKey(rawKeys.privateKey);
                    setMyRawEncryptionPublicKey(rawKeys.publicKey);
                    console.log('[RAW SETUP] Derived Raw Key:', rawKeys.publicKey);
                } catch (e) {
                    console.error('[RAW SETUP] Failed:', e);
                }

                // --- 🕵️ KEY DISCOVERY DIAGNOSTICS ---
                const { deriveBIP32KeyPair, deriveEd25519KeyPair } = require('../utils/encryption');
                const candidatePaths = [
                    "m/44'/0'/0'/0/0",     // Standard BIP44 External (Unhardened last)
                    "m/44'/0'/0'/0'/0'",   // Standard BIP44 External (Hardened)
                    "m/44'/0'/0'/1'/0'",   // Our Current Path (Hardened)
                    "m/44'/0'/0'/0'/0",    // Mixed
                    "m/0'/0'",             // Simple
                    "m/44'/60'/0'/0/0",    // Ethereum Style
                ];

                /* 
                console.log('\n--- 🕵️ KEY DISCOVERY REPORT ---');
                candidatePaths.forEach(path => {
                    // BIP32
                    const bKey = deriveBIP32KeyPair(mnemonic, path);
                    if (bKey) console.log(`[BIP32]   Path: ${path.padEnd(20)} Pub: ${bKey.publicKey.substring(0, 16)}...`);

                    // Ed25519
                    const eKey = deriveEd25519KeyPair(mnemonic, path);
                    if (eKey) console.log(`[Ed25519] Path: ${path.padEnd(20)} Pub: ${eKey.publicKey.substring(0, 16)}...`);
                });
                */

                // RAW SEED CHECK
                try {
                    const seed = bip39.mnemonicToSeedSync(mnemonic);
                    const rawSecret = seed.slice(0, 32);
                    const rawKeyPair = nacl.box.keyPair.fromSecretKey(rawSecret);
                    const rawPub = toHex(rawKeyPair.publicKey);
                    console.log(`[RAW SEED]  Slice(0-32)          Pub: ${rawPub.substring(0, 16)}...`);
                } catch (e) {
                    console.log('[RAW SEED] Failed:', e);
                }

                console.log('--------------------------------\n');
                // -------------------------------------

                const signKeys = deriveSigningKeyPair(mnemonic);
                setMySigningPrivateKey(signKeys.privateKey);

                // KEY VERIFICATION & AUTO-FIX
                try {
                    const myServerKeyData = await getEncryptionKey(loggedInUser.nickname || loggedInUser.user_id);
                    const myServerPublicKey = myServerKeyData?.encryption_public_key;

                    console.log('🔑 Key Check:');
                    console.log('   - Derived (Modern):', encKeys.publicKey);
                    console.log('   - Derived (Legacy):', legacyKeys?.publicKey || 'N/A');
                    console.log('   - Derived (Raw):   ', rawKeys?.publicKey || 'N/A');
                    console.log('   - Server Public Key:', myServerPublicKey);

                    // Check if Server matches Modern OR Legacy
                    const isModernMatch = myServerPublicKey && encKeys.publicKey === myServerPublicKey;
                    const isLegacyMatch = myServerPublicKey && legacyKeys && legacyKeys.publicKey === myServerPublicKey;
                    const isRawMatch = myServerPublicKey && rawKeys && rawKeys.publicKey === myServerPublicKey;

                    // If Server matches NEITHER, we have a problem.
                    // If Server matches Legacy, that's fine for receiving! But we might want to rotate to Modern eventually.
                    // For now, if we have keys for both, we are safe.

                    if (myServerPublicKey && !isModernMatch && !isLegacyMatch) {
                        console.error('❌ KEY MISMATCH DETECTED (Matches neither Modern nor Legacy)!');
                        Alert.alert(
                            'Anahtar Uyuşmazlığı',
                            'Şifreleme anahtarınız sunucu ile eşleşmiyor. Mesaj gönderebilmek için anahtarlarınız güncelleniyor...',
                            [{ text: 'Tamam' }]
                        );

                        // AUTO-SYNC
                        console.log('🔄 Auto-syncing encryption key...');
                        const { syncEncryptionKey } = require('../api/auth');
                        try {
                            await syncEncryptionKey(mnemonic, loggedInUser);
                            console.log('✅ Auto-sync completed.');
                            Alert.alert('Başarılı', 'Anahtarlarınız eşitlendi!');
                        } catch (syncError: any) {
                            console.error('⚠️ Auto-sync failed:', syncError.message);
                            // Do NOT block user. Le them try to send message anyway, maybe keys are actually fine on chain.
                            Alert.alert('Uyarı', 'Anahtar eşitleme otomatik yapılamadı ama mesaj göndermeyi deneyebilirsiniz.');
                        }
                    } else if (isLegacyMatch) {
                        console.log('✅ Keys match (Legacy Mode). You are using the Web-compatible key.');
                    } else {
                        console.log('✅ Keys match (Modern Mode).');
                    }
                } catch (verifyError) {
                    console.warn('⚠️ Key verification skipped:', verifyError);
                }


                console.log('✅ Encryption setup complete!');
            } catch (error: any) {
                console.error('❌ Encryption setup failed:', error.message);
            }
        };

        setupEncryption();
    }, [recipientUser, mnemonic, loggedInUser]);

    const fetchHistory = async () => {
        if (!wallet || !recipientUser) return;
        try {
            const history = await getMessages(wallet.wallet_id, recipientUser.user_id);

            // Strategy: 
            // 1. Try to get key from server (state)
            // 2. If missing, look for it in the message history (sender_encryption_key from them)
            // 3. If found in history, update state so sending is enabled!

            let otherUserEncryptionKey = recipientEncryptionKey;

            // If we don't have the key yet, try to find it in the messages
            if (!otherUserEncryptionKey) {
                const foundKeyInHistory = history.find((m: any) =>
                    (m.sender_wallet === recipientUser.user_id && m.sender_encryption_key)
                );

                if (foundKeyInHistory) {
                    console.log('🔑 Found recipient key in message history:', foundKeyInHistory.sender_encryption_key);
                    otherUserEncryptionKey = foundKeyInHistory.sender_encryption_key;
                    setRecipientEncryptionKey(otherUserEncryptionKey); // Auto-update state
                } else {
                    // Last resort: try fetching again (maybe profile was updated)
                    // But don't block display
                    const identifier = (recipientUser.nickname && recipientUser.nickname !== 'Unknown')
                        ? recipientUser.nickname
                        : recipientUser.user_id;

                    if (identifier && identifier !== 'Unknown') {
                        getEncryptionKey(identifier)
                            .then(keyData => {
                                if (keyData?.encryption_public_key) {
                                    setRecipientEncryptionKey(keyData.encryption_public_key);
                                }
                            })
                            .catch(() => { }); // Silent fail
                    }
                }
            }

            const mappedMessages: Message[] = history.map((msg: any) => {
                const isMine = msg.from_wallet?.toLowerCase() === wallet?.wallet_id?.toLowerCase();

                // msg.message or msg.encrypted_message are often the same due to normalization.
                // We default to showing the raw content or empty string
                let text = msg.encrypted_message || msg.message || '';
                let decrypted = false;

                // Keys
                let otherKeyToUse: string | null = null;
                if (!isMine) {
                    otherKeyToUse = msg.sender_encryption_key || otherUserEncryptionKey;
                } else {
                    // For sent messages, we need the RECIPIENT'S public key to decrypt our own message
                    // (since we encrypted it with: MyPriv + TheirPub)
                    otherKeyToUse = msg.recipient_encryption_key ||
                        otherUserEncryptionKey ||
                        recipientEncryptionKey ||
                        (recipientUser?.encryption_public_key);
                }

                // --- IS THIS A CANDIDATE FOR DECRYPTION? ---
                // 1. If it has a sender_encryption_key attached, it's almost certainly a Modern Encrypted Message.
                // 2. If it contains a colon (Hex:Hex format) -> Legacy Encrypted.
                // 3. If it looks like a long Base64 string (> 50 chars) AND has no spaces -> Likely Legacy Encrypted.
                const hasKeySignal = !!msg.sender_encryption_key;

                // Heuristic: If it has spaces, it's likely a sentence, not Base64.
                // Legacy hex messages always have a colon. Legacy Base64 usually continuous string.
                const looksLikeLegacy = text && (text.includes(':') || (text.length > 50 && !text.includes(' ')));

                // We assume it is encrypted if either signal is true.
                // Exception: If it's short and has no key, it's definitely plain text.
                const isEncryptedCandidate = hasKeySignal || looksLikeLegacy;

                // Log candidate status for troubleshooting specific user issue
                // if (isEncryptedCandidate) console.log(`[Msg ${msg.id.slice(0,4)}] Candidate! Len:${text.length} Key:${!!otherKeyToUse}`);

                if (isEncryptedCandidate) {
                    /*
                    console.log('🗝️ KEY DIAGNOSTICS [Msg ' + (msg.id?.slice(0, 4) || '???') + ']:');
                    console.log('   - Msg RecipientKey:', msg.recipient_encryption_key?.slice(0, 8) + '...');
                    console.log('   - Device Modern PubKey:', myEncryptionPublicKey?.slice(0, 8) + '...');
                    console.log('   - Device Legacy PubKey:', myLegacyEncryptionPublicKey?.slice(0, 8) + '...');
                    console.log('   - Device Raw PubKey:   ', myRawEncryptionPublicKey?.slice(0, 8) + '...');
                    */

                    if (isMine) {
                        console.log('   - 📤 IS MINE (Sent Message)');
                        console.log('   - Using Key for Decryption:', otherKeyToUse?.slice(0, 8) + '...');
                    }

                    // Try to decrypt
                    let ciphertext = msg.encrypted_message || text;

                    // Optimization: Skip if obviously too short for NaCl info
                    if (ciphertext && ciphertext.length > 30) {
                        // 1. Try Modern/Primary Key
                        if (myEncryptionPrivateKey && otherKeyToUse) {
                            try {
                                const res = decryptMessage(ciphertext, otherKeyToUse, myEncryptionPrivateKey);
                                if (res) {
                                    text = res;
                                    decrypted = true;
                                    console.log(`✅ Decrypted Msg ${msg.id?.slice(0, 4)} with MODERN key`);
                                }
                            } catch (e1: any) {
                                console.warn(`❌ Decrypt Modern Failed [Msg: ${msg.id?.slice(0, 4) || msg.tx_id?.slice(0, 4)}]: ${e1.message}`, JSON.stringify({
                                    isMine,
                                    walletId: wallet?.wallet_id,
                                    senderWallet: msg.sender_wallet,
                                    myPriv: myEncryptionPrivateKey ? myEncryptionPrivateKey.substring(0, 8) + '...' : 'MISSING',
                                    otherKeyToUse: otherKeyToUse ? otherKeyToUse.substring(0, 8) + '...' : 'MISSING',
                                    myPubState: myEncryptionPublicKey ? myEncryptionPublicKey.substring(0, 8) + '...' : 'MISSING',
                                    payloadSenderKey: msg.sender_encryption_key ? msg.sender_encryption_key.substring(0, 8) + '...' : 'MISSING',
                                }));
                            }
                        }

                        // 2. Try Legacy Key
                        if (!decrypted && myLegacyEncryptionPrivateKey && otherKeyToUse) {
                            try {
                                const res = decryptMessage(ciphertext, otherKeyToUse, myLegacyEncryptionPrivateKey);
                                if (res) {
                                    text = res;
                                    decrypted = true;
                                    console.log(`✅ Decrypted Msg ${msg.id?.slice(0, 4)} with LEGACY key`);
                                }
                            } catch (e2: any) {
                                console.log(`❌ Decrypt Legacy Failed: ${e2.message}`);
                            }
                        }

                        // 3. Try Raw Key (New Fallback)
                        if (!decrypted && myRawEncryptionPrivateKey && otherKeyToUse) {
                            try {
                                const res = decryptMessage(ciphertext, otherKeyToUse, myRawEncryptionPrivateKey);
                                if (res) {
                                    text = res;
                                    decrypted = true;
                                    console.log('✅ Decrypted with RAW SEED KEY!');
                                }
                            } catch (e3: any) {
                                // console.log(`❌ Decrypt Raw Failed: ${e3.message}`);
                            }
                        }
                    }
                } else {
                    // Not a candidate -> Plain text
                    decrypted = true;
                    // Ensure text is set to raw content if we overwrote it above? 
                    // Actually 'text' is already init to msg.message or encrypted_message
                }

                // --- FALLBACK DISPLAY ---
                // If it WAS a candidate for encryption, but failed to decrypt, we show the lock.
                if (!decrypted) {
                    // It failed to decrypt.
                    if (!isMine && !otherKeyToUse) {
                        text = '🔒 Encrypted (Key Missing)';
                    } else if (isMine) {
                        text = '[Encrypted Content]';
                    } else {
                        text = '🔒 Encrypted Message';
                    }
                }


                if (!decrypted) {
                    if (!isMine && !otherKeyToUse) {
                        text = '🔒 Encrypted (Key Missing)';
                    } else if (isMine) {
                        text = '[Encrypted Content]';
                    } else {
                        text = '🔒 Encrypted Message';
                    }
                }

                return {
                    id: msg.tx_id || msg.id || Math.random().toString(),
                    text: text, // Show decrypted text
                    encryptedText: msg.encrypted_message,
                    senderWallet: msg.sender_wallet,
                    senderKey: msg.sender_encryption_key,
                    isMine: isMine,
                    timestamp: new Date(msg.created_at || msg.timestamp),
                    blockId: msg.block_id || 'Pending...',
                    decrypted,
                    sender_encryption_key: msg.sender_encryption_key,
                    recipient_encryption_key: msg.recipient_encryption_key,
                    encrypted_message: msg.encrypted_message
                } as unknown as Message; // Cast to avoid strict type issues with extra fields
            });

            // Merge logic: Keep local "Pending" messages if they aren't in the fetched history yet
            setMessages(currentMessages => {
                const pendingMessages = currentMessages.filter(m => m.blockId === 'Pending (Mempool)');
                const newIds = new Set(mappedMessages.map(m => m.id));
                const stillPending = pendingMessages.filter(m => !newIds.has(m.id));

                const combined = [...mappedMessages, ...stillPending];
                combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                return combined;
            });
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    useEffect(() => {
        // ALWAYS fetch history, even if we don't have keys yet. 
        // We might find the key IN the history!
        if (recipientUser && wallet) {
            fetchHistory();
            const interval = setInterval(fetchHistory, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [recipientUser, recipientEncryptionKey, myEncryptionPrivateKey, myLegacyEncryptionPrivateKey, myRawEncryptionPrivateKey, wallet]);

    const handleDecryptRetry = async (msg: Message) => {
        if (!myEncryptionPrivateKey) return;

        let keyToUse = (msg as any).sender_encryption_key; // Try message key first

        if (!keyToUse) {
            // Try fetching fresh key for the sender
            try {
                // If it's my message, I need recipient key. If theirs, I need their key.
                const targetUserId = msg.isMine ? recipientUser.user_id : msg.senderWallet;
                // For incoming (not mine), we need to know who sent it. In 1:1, it's recipientUser.

                const keyData = await getEncryptionKey(recipientUser.nickname || recipientUser.user_id);
                if (keyData?.encryption_public_key) {
                    keyToUse = keyData.encryption_public_key;
                    // Update main state while we are at it
                    setRecipientEncryptionKey(keyToUse);
                }
            } catch (e) {
                Alert.alert("Error", "Could not fetch key for decryption.");
                return;
            }
        }

        if (keyToUse) {
            try {
                const decrypted = decryptMessage(msg.encryptedText, keyToUse, myEncryptionPrivateKey);
                // Update specific message in list
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: decrypted } : m));
                setSelectedMessage({ ...msg, text: decrypted }); // Update modal view too
                Alert.alert("Success", "Message decrypted!");
            } catch (e) {
                Alert.alert("Decryption Failed", "The key used for this message does not match.");
            }
        } else {
            Alert.alert("Error", "No encryption key available.");
        }
    };



    const handleSend = async () => {
        console.log('📤 handleSend called');
        console.log('   - message:', message.trim() ? '✅ Has content' : '❌ Empty');
        console.log('   - wallet:', wallet ? '✅ Present' : '❌ Missing');
        console.log('   - recipientUser:', recipientUser ? '✅ Present' : '❌ Missing');
        console.log('   - recipientEncryptionKey:', recipientEncryptionKey ? '✅ Present' : '❌ Missing');
        console.log('   - myEncryptionPrivateKey:', myEncryptionPrivateKey ? '✅ Present' : '❌ Missing');
        console.log('   - mySigningPrivateKey:', mySigningPrivateKey ? '✅ Present' : '❌ Missing');

        if (!message.trim() || !wallet || !recipientUser || !recipientEncryptionKey || !myEncryptionPrivateKey || !mySigningPrivateKey) {
            if (!recipientEncryptionKey) {
                Alert.alert("Error", "Alıcının şifreleme anahtarı alınamadı. Kullanıcının profili güncel olmayabilir.");
            } else if (!myEncryptionPrivateKey) {
                Alert.alert("Error", "Kendi şifreleme anahtarınız hazır değil. Lütfen tekrar giriş yapın.");
            } else if (!mySigningPrivateKey) {
                Alert.alert("Error", "İmza anahtarınız hazır değil. Lütfen tekrar giriş yapın.");
            } else if (!message.trim()) {
                // No alert for empty message
            }
            return;
        }

        setSending(true);
        try {
            console.log('🔐 Encrypting message...');
            // 1. Encrypt message            // 1. Encrypt message
            console.log('🔒 Encrypting with keys:');
            console.log('   -> My Private Key:', myEncryptionPrivateKey?.slice(0, 8));
            console.log('   -> Recipient Public Key:', recipientEncryptionKey?.slice(0, 8));

            const encryptedMessage = encryptMessage(
                message,
                recipientEncryptionKey,
                myEncryptionPrivateKey
            );
            console.log('✅ Encrypted:', encryptedMessage.substring(0, 30) + '...');

            // Re-derive keys to be absolutely sure we have the correct pair for signing
            const { deriveSigningKeyPair } = require('../utils/signing');
            const signKeys = deriveSigningKeyPair(mnemonic);

            const timestamp = Date.now();
            // Generate deterministic tx_id match server expectation
            const txDataForId = `${wallet.wallet_id}${recipientUser.user_id}0${timestamp}`;
            const tx_id = require('crypto').createHash('sha256').update(txDataForId).digest('hex');

            // Prepare Transaction Data
            // uses myEncryptionPublicKey from state which matches the private key used above
            const transactionData = {
                tx_id, // Critical: Required by server
                from_wallet: wallet.wallet_id,
                to_wallet: recipientUser.user_id,
                type: 'PRIVATE_MESSAGE',
                // Strict Order Enforcement (from Doc): id, from, to, type, payload, amount, fee, timestamp, sender_public_key
                // Note: JS engine usually preserves string key insertion order, but explicit is safer if server matches strings.
                // However, standard JSON libraries sort or don't guarantee. We rely on standard practice here.
                amount: 0,
                fee: 0.000002,
                timestamp: timestamp,
                sender_public_key: signKeys.publicKey, // CRITICAL FIX: Must be part of signed data
                priority: 'STANDARD',
                payload: {
                    encrypted_message: encryptedMessage,
                    sender_encryption_key: myEncryptionPublicKey,
                    recipient_encryption_key: recipientEncryptionKey,
                    encrypted: true
                }
            };

            console.log('📝 Transaction Data (Signed):', JSON.stringify(transactionData, null, 2));

            // 3. Sign Transaction (getSignableData equivalent)
            const signableString = JSON.stringify(transactionData);
            const signature = signData(signableString, signKeys.privateKey);
            console.log('✍️ Signature created (Corrected Protocol)');

            // 4. Construct Signed Transaction
            const signedTransaction = {
                ...transactionData,
                sender_signature: signature
            };

            console.log('🚀 Sending Signed Transaction...');

            const response = await sendEncryptedMessage(signedTransaction);
            console.log('✅ Response:', JSON.stringify(response));

            const newMessage: Message = {
                id: response.tx_id || Date.now().toString(),
                text: message,
                encryptedText: encryptedMessage,
                senderWallet: wallet.wallet_id,
                isMine: true,
                timestamp: new Date(),
                blockId: 'Pending (Mempool)',
            };
            setMessages([...messages, newMessage]);
            setMessage('');

            console.log('✅ Message sent successfully!');

            // Refresh balance
            if (wallet && wallet.wallet_id) {
                require('../api/auth').getUser(wallet.wallet_id).then((u: any) => {
                    if (u && u.balance !== undefined) {
                        // Assuming there is a way to set balance, but actually it comes from AuthContext.
                        // We might need to reload the user context or just fetch it here for display if we had a local state.
                        // For now let's just log it to verify deduction.
                        console.log('💰 Balance post-send:', u.balance);
                    }
                });
            }

            setTimeout(fetchHistory, 1000);
        } catch (error: any) {
            console.warn('Send/Encrypt Error:', error.message);
            Alert.alert('Hata', 'Mesaj gönderilemedi.');
            // which is about sending messages, not decrypting them.
            // Given the instruction "Change console.error to warn or remove", I will change the existing console.error calls to console.warn.
            console.warn('❌ Send Error:', error);
            console.warn('   Response Data:', error.response?.data);
            console.warn('   Status:', error.response?.status);
            Alert.alert('Mesaj Gönderilemedi', `Hata: ${error.response?.data?.message || error.response?.data?.error || error.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleMessagePress = (msg: Message) => {
        setSelectedMessage(msg);
        setModalVisible(true);
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[styles.messageRow, item.isMine ? styles.rowMine : styles.rowTheirs]}>
            {!item.isMine && (
                <TouchableOpacity onPress={() => setUserInfoVisible(true)} style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>{(recipientUser?.nickname || '?')[0].toUpperCase()}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleMessagePress(item)}
                style={[
                    styles.messageContainer,
                    item.isMine ? styles.myMessage : styles.theirMessage,
                    { marginBottom: 0 } // Override default margin because row handles it
                ]}
            >
                <Text style={[styles.messageText, item.isMine ? styles.myMessageText : styles.theirMessageText]}>
                    {item.text}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                    <Text style={[styles.timestamp, item.isMine ? styles.myTimestamp : styles.theirTimestamp, { marginTop: 0 }]}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {item.blockId === 'Pending (Mempool)' && (
                        <Text style={{ fontSize: 10, marginLeft: 4, color: 'rgba(255,255,255,0.7)' }}>🕒</Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.headerText}>💬 {recipientUser?.nickname}</Text>
                <Text style={styles.headerSubtext}>End-to-end encrypted</Text>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>🔒 Start a secure conversation!</Text>
                        <Text style={styles.emptySubtext}>All messages are encrypted on the blockchain</Text>
                    </View>
                }
            />

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.MutedText}
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                        editable={!sending}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!message.trim() || sending}
                    activeOpacity={0.7}
                >
                    {sending ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={styles.sendButtonText}>📤</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Verification Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Blockchain Verification</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Block Status:</Text>
                                <Text style={styles.detailValue}>{selectedMessage?.blockId || 'Pending'}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Transaction ID:</Text>
                                <Text style={styles.detailValueSmall}>{selectedMessage?.id}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Sender Wallet:</Text>
                                <Text style={styles.detailValueSmall}>{selectedMessage?.senderWallet}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Timestamp:</Text>
                                <Text style={styles.detailValue}>{selectedMessage?.timestamp.toLocaleString()}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.sectionTitle}>Decrypted Content</Text>
                            <View style={styles.codeBlock}>
                                <Text style={styles.codeText}>{selectedMessage?.text}</Text>
                            </View>

                            {/* RETRY BUTTON */}
                            {(selectedMessage?.text.includes('🔒') || selectedMessage?.text.includes('[Encrypted')) && (
                                <TouchableOpacity
                                    style={{ backgroundColor: Colors.TraceEmerald, padding: 10, borderRadius: 8, marginTop: 5, alignItems: 'center' }}
                                    onPress={() => selectedMessage && handleDecryptRetry(selectedMessage)}
                                >
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>🔓 Try Decrypt Again</Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.sectionTitle}>Encrypted Payload (On Chain)</Text>
                            <View style={styles.codeBlock}>
                                <Text style={styles.codeText} numberOfLines={8}>
                                    {selectedMessage?.encryptedText}
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>


            {/* User Info Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={userInfoVisible}
                onRequestClose={() => setUserInfoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>👤 User Details</Text>
                            <TouchableOpacity onPress={() => setUserInfoVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                <View style={[styles.chatAvatar, { width: 80, height: 80, borderRadius: 40, marginBottom: 16 }]}>
                                    <Text style={[styles.chatAvatarText, { fontSize: 32 }]}>{(recipientUser?.nickname || '?')[0].toUpperCase()}</Text>
                                </View>
                                <Text style={Typography.H1}>
                                    {recipientUser?.nickname}
                                </Text>
                                <Text style={Typography.Body}>
                                    {recipientUser?.name} {recipientUser?.surname}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>User ID:</Text>
                                <Text style={styles.detailValueSmall} numberOfLines={1} ellipsizeMode="middle">{recipientUser?.user_id}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Bio:</Text>
                                <Text style={styles.detailValue}>{(recipientUser as any)?.bio || 'Checking profile...'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Location:</Text>
                                <Text style={styles.detailValue}>{(recipientUser as any)?.location || 'Global'}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Encryption Key:</Text>
                                <Text style={styles.detailValueSmall} numberOfLines={1} ellipsizeMode="middle">{recipientEncryptionKey || 'Pending'}</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.DeepVoid,
    },
    header: {
        ...GlassStyle,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
    },
    headerText: {
        color: Colors.White,
        ...Typography.H1,
        textAlign: 'center',
    },
    headerSubtext: {
        color: Colors.TraceEmerald,
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    rowMine: {
        justifyContent: 'flex-end',
    },
    rowTheirs: {
        justifyContent: 'flex-start',
    },
    chatAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.DeepVoid,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
    },
    chatAvatarText: {
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
        fontSize: 12,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(16, 185, 129, 0.2)', // Emerald tint
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.5)',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        ...GlassStyle,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    myMessageText: {
        color: Colors.White,
    },
    theirMessageText: {
        color: Colors.White,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
        fontFamily: 'monospace',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: Colors.MutedText,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 64,
        paddingHorizontal: 24,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.TraceEmerald,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
        color: Colors.MutedText,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.DeepVoid,
        borderTopWidth: 1,
        borderTopColor: Colors.SubtleBorder,
        alignItems: 'flex-end',
        ...GlassStyle,
    },
    inputWrapper: {
        flex: 1,
        marginRight: 12,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
        color: Colors.White,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.TraceEmerald,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    sendButtonDisabled: {
        backgroundColor: Colors.SubtleBorder,
        shadowOpacity: 0,
    },
    sendButtonText: {
        fontSize: 18,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.DeepVoid,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '70%',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        ...GlassStyle,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
        paddingBottom: 16,
    },
    modalTitle: {
        ...Typography.H2,
        color: Colors.White,
    },
    closeButton: {
        fontSize: 24,
        color: Colors.MutedText,
        padding: 4,
    },
    modalBody: {
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.MutedText,
        fontWeight: 'bold',
        width: 100,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailValue: {
        fontSize: 14,
        color: Colors.White,
        flex: 1,
        textAlign: 'right',
        fontWeight: '600',
    },
    detailValueSmall: {
        fontSize: 10,
        color: Colors.TraceEmerald,
        flex: 1,
        textAlign: 'right',
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.SubtleBorder,
        marginVertical: 16,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 12,
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    codeBlock: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 10,
        color: Colors.MintGlitch,
    },
});
