import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { getUser, getUserById, searchUsers, syncEncryptionKey } from '../api/auth';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';
import { useAuth } from '../context/AuthContext';
import { encryptMessage, decryptMessage, generateEncryptionKeyPair } from '../utils/encryption';

// Mock users for testing
const MOCK_USERS = {
    alice: {
        name: 'Alice',
        ...generateEncryptionKeyPair(),
    },
    bob: {
        name: 'Bob',
        ...generateEncryptionKeyPair(),
    }
};

export default function DebugScreen() {
    const { user, wallet, mnemonic } = useAuth();
    const [nickname, setNickname] = useState('');
    const [userId, setUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Messaging test state
    const [testMessage, setTestMessage] = useState('Merhaba Bob! Bu bir test mesajı.');
    const [encryptedResult, setEncryptedResult] = useState<string | null>(null);
    const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testLogs, setTestLogs] = useState<string[]>([]);

    const addLog = (text: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev]);
    const addTestLog = (text: string) => setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev]);

    const testGetByNickname = async () => {
        setError(null);
        setResult(null);
        try {
            console.log('Testing getUser with nickname:', nickname);
            const response = await getUser(nickname);
            setResult({ type: 'getUser', data: response });
            console.log('✅ Success:', response);
        } catch (err: any) {
            console.log('❌ Error:', err.response?.data || err.message);
            setError(err.response?.data?.error || err.message);
        }
    };

    const testGetById = async () => {
        setError(null);
        setResult(null);
        try {
            console.log('Testing getUserById with ID:', userId);
            const response = await getUserById(userId);
            setResult({ type: 'getUserById', data: response });
            console.log('✅ Success:', response);
        } catch (err: any) {
            console.log('❌ Error:', err.response?.data || err.message);
            setError(err.response?.data?.error || err.message);
        }
    };

    const testSearch = async () => {
        setError(null);
        setResult(null);
        try {
            console.log('Testing searchUsers with query:', searchQuery);
            const response = await searchUsers(searchQuery);
            setResult({ type: 'searchUsers', data: response });
            console.log('✅ Success:', response);
        } catch (err: any) {
            console.log('❌ Error:', err.response?.data || err.message);
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleSyncKey = async () => {
        if (!mnemonic || !user) {
            Alert.alert("Error", "No mnemonic or user found. Are you logged in?");
            return;
        }

        Alert.alert(
            "Sync Encryption Key",
            "This will create a transaction to update your encryption key on the blockchain. A small fee will apply.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sync Now",
                    onPress: async () => {
                        addLog("🔄 Starting Key Sync...");
                        try {
                            const result = await syncEncryptionKey(mnemonic, user);
                            addLog("✅ Key Rotation Transaction Sent! TX ID: " + (result.tx_id || 'Unknown'));
                            Alert.alert("Success", "Key rotation transaction sent. Please wait for the next block.");
                        } catch (error: any) {
                            addLog("❌ Sync Failed: " + error.message);
                            Alert.alert("Error", "Failed to sync key: " + error.message);
                        }
                    }
                }
            ]
        );
    };

    // Messaging Test Function - Alice sends to Bob
    const runMessagingTest = () => {
        setTestLogs([]);
        setEncryptedResult(null);
        setDecryptedResult(null);
        setTestStatus('idle');

        try {
            addTestLog('🧪 Starting Messaging Test...');
            addTestLog(`👤 Alice Public Key: ${MOCK_USERS.alice.publicKey.substring(0, 16)}...`);
            addTestLog(`👤 Bob Public Key: ${MOCK_USERS.bob.publicKey.substring(0, 16)}...`);

            // Step 1: Alice encrypts message for Bob
            addTestLog('📤 Alice encrypting message for Bob...');
            addTestLog(`📝 Original: "${testMessage}"`);

            const encrypted = encryptMessage(
                testMessage,
                MOCK_USERS.bob.publicKey,      // Bob's public key (recipient)
                MOCK_USERS.alice.privateKey    // Alice's private key (sender)
            );

            setEncryptedResult(encrypted);
            addTestLog(`🔐 Encrypted: ${encrypted.substring(0, 40)}...`);

            // Step 2: Bob decrypts message from Alice
            addTestLog('📥 Bob decrypting message from Alice...');

            const decrypted = decryptMessage(
                encrypted,
                MOCK_USERS.alice.publicKey,    // Alice's public key (sender)
                MOCK_USERS.bob.privateKey      // Bob's private key (recipient)
            );

            setDecryptedResult(decrypted);
            addTestLog(`✅ Decrypted: "${decrypted}"`);

            // Verify
            if (decrypted === testMessage) {
                addTestLog('🎉 SUCCESS! Message matches original!');
                setTestStatus('success');
                Alert.alert('✅ Test Başarılı', `Orijinal: "${testMessage}"\nŞifresi Çözülen: "${decrypted}"`);
            } else {
                addTestLog('❌ FAILURE! Message mismatch!');
                setTestStatus('error');
                Alert.alert('❌ Test Başarısız', 'Mesaj eşleşmiyor!');
            }
        } catch (err: any) {
            addTestLog(`❌ ERROR: ${err.message}`);
            setTestStatus('error');
            Alert.alert('❌ Hata', err.message);
        }
    };

    // Test with logged-in user's keys
    const runRealKeyTest = () => {
        if (!mnemonic) {
            Alert.alert('Hata', 'Giriş yapmanız gerekiyor!');
            return;
        }

        setTestLogs([]);
        setEncryptedResult(null);
        setDecryptedResult(null);
        setTestStatus('idle');

        try {
            addTestLog('🧪 Real Key Test Starting...');

            // Import to derive keys
            const { deriveEncryptionKeyFromMnemonic } = require('../utils/encryption');
            const myKeys = deriveEncryptionKeyFromMnemonic(mnemonic);

            addTestLog(`🔑 Your Public Key: ${myKeys.publicKey.substring(0, 16)}...`);

            // Self-encrypt test (same public/private key pair)
            addTestLog('📤 Encrypting message to self...');

            const encrypted = encryptMessage(
                testMessage,
                myKeys.publicKey,
                myKeys.privateKey
            );

            setEncryptedResult(encrypted);
            addTestLog(`🔐 Encrypted: ${encrypted.substring(0, 40)}...`);

            // Decrypt
            addTestLog('📥 Decrypting...');

            const decrypted = decryptMessage(
                encrypted,
                myKeys.publicKey,
                myKeys.privateKey
            );

            setDecryptedResult(decrypted);
            addTestLog(`✅ Decrypted: "${decrypted}"`);

            if (decrypted === testMessage) {
                addTestLog('🎉 SUCCESS!');
                setTestStatus('success');
                Alert.alert('✅ Test Başarılı', 'Şifreleme çalışıyor!');
            } else {
                addTestLog('❌ FAILURE!');
                setTestStatus('error');
            }
        } catch (err: any) {
            addTestLog(`❌ ERROR: ${err.message}`);
            setTestStatus('error');
            Alert.alert('❌ Hata', err.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🔧 API Debug Tool</Text>

            {/* Messaging Test Section */}
            <View style={[styles.section, { backgroundColor: '#e3f2fd', borderLeftWidth: 4, borderLeftColor: '#2196f3' }]}>
                <Text style={[styles.sectionTitle, { color: '#1565c0' }]}>🧪 5. Mesajlaşma Testi (Alice → Bob)</Text>
                <Text style={{ color: '#1565c0', fontSize: 12, marginBottom: 8 }}>
                    Bu test, şifreleme ve şifre çözme işlemlerinin çalışıp çalışmadığını kontrol eder.
                </Text>

                <TextInput
                    style={[styles.input, { backgroundColor: '#fff' }]}
                    placeholder="Test mesajı girin..."
                    value={testMessage}
                    onChangeText={setTestMessage}
                    multiline
                />

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                        style={[styles.testButton, { backgroundColor: '#2196f3', flex: 1 }]}
                        onPress={runMessagingTest}
                    >
                        <Text style={styles.testButtonText}>🧪 Mock Test (Alice→Bob)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.testButton, { backgroundColor: '#4caf50', flex: 1 }]}
                        onPress={runRealKeyTest}
                    >
                        <Text style={styles.testButtonText}>🔑 Gerçek Key Test</Text>
                    </TouchableOpacity>
                </View>

                {/* Test Status Indicator */}
                {testStatus !== 'idle' && (
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: testStatus === 'success' ? '#4caf50' : '#f44336' }
                    ]}>
                        <Text style={styles.statusText}>
                            {testStatus === 'success' ? '✅ BAŞARILI' : '❌ BAŞARISIZ'}
                        </Text>
                    </View>
                )}

                {/* Encrypted Result */}
                {encryptedResult && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4 }}>🔐 Şifrelenmiş:</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 10, backgroundColor: '#fff', padding: 8, borderRadius: 4 }} numberOfLines={3}>
                            {encryptedResult}
                        </Text>
                    </View>
                )}

                {/* Decrypted Result */}
                {decryptedResult && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontWeight: 'bold', color: '#1565c0', marginBottom: 4 }}>✅ Çözülmüş:</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, backgroundColor: '#c8e6c9', padding: 8, borderRadius: 4 }}>
                            {decryptedResult}
                        </Text>
                    </View>
                )}

                {/* Test Logs */}
                {testLogs.length > 0 && (
                    <View style={{ marginTop: 8, backgroundColor: '#263238', padding: 8, borderRadius: 4 }}>
                        <Text style={{ color: '#4fc3f7', fontWeight: 'bold', marginBottom: 4 }}>📋 Test Logları:</Text>
                        {testLogs.map((log, i) => (
                            <Text key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: '#b0bec5' }}>{log}</Text>
                        ))}
                    </View>
                )}
            </View>

            {/* Get by Nickname */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. Get User by Nickname</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter nickname (e.g., test)"
                    value={nickname}
                    onChangeText={setNickname}
                />
                <TouchableOpacity style={styles.actionButton} onPress={testGetByNickname}>
                    <Text style={styles.actionButtonText}>Test Get by Nickname</Text>
                </TouchableOpacity>
            </View>

            {/* Get by ID */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Get User by ID</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter user ID (e.g., user_123...)"
                    value={userId}
                    onChangeText={setUserId}
                />
                <TouchableOpacity style={styles.actionButton} onPress={testGetById}>
                    <Text style={styles.actionButtonText}>Test Get by ID</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Search Users</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter search query"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.actionButton} onPress={testSearch}>
                    <Text style={styles.actionButtonText}>Test Search</Text>
                </TouchableOpacity>
            </View>

            {/* Sync Encryption Key */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Sync Encryption Key (Fix Mismatch)</Text>
                <Text style={{ ...styles.instructionsText, marginBottom: 8, color: Colors.MutedText }}>
                    Use this if you see "KEY MISMATCH" error. It updates your server key to match your device.
                </Text>
                <TouchableOpacity style={styles.actionButton} onPress={handleSyncKey}>
                    <Text style={styles.actionButtonText}>Sync Encryption Key</Text>
                </TouchableOpacity>
            </View>

            {/* Error Display */}
            {error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>❌ Error:</Text>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Result Display */}
            {result && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultTitle}>✅ Success ({result.type}):</Text>
                    <Text style={styles.resultText}>
                        {JSON.stringify(result.data, null, 2)}
                    </Text>
                </View>
            )}

            {/* Logs Display */}
            {logs.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Logs</Text>
                    {logs.map((log, i) => (
                        <Text key={i} style={{ fontFamily: 'monospace', fontSize: 10, marginBottom: 2 }}>{log}</Text>
                    ))}
                </View>
            )}

            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>📝 Instructions:</Text>
                <Text style={styles.instructionsText}>
                    1. Oluşturduğunuz kullanıcının nickname'ini girin{'\n'}
                    2. "Test Get by Nickname" butonuna basın{'\n'}
                    3. Eğer kullanıcı bulunursa ✅, bulunamazsa ❌ göreceksiniz{'\n'}
                    4. Console loglarını kontrol edin
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.DeepVoid,
    },
    title: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 24,
        textAlign: 'center',
    },
    section: {
        ...GlassStyle,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TraceEmerald,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 14,
        color: Colors.White,
        fontFamily: 'monospace',
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: Colors.DangerRed,
        marginVertical: 16,
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.DangerRed,
        marginBottom: 4,
    },
    errorText: {
        fontSize: 12,
        color: Colors.DangerRed,
        fontFamily: 'monospace',
    },
    resultBox: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: Colors.TraceEmerald,
        marginVertical: 16,
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TraceEmerald,
        marginBottom: 4,
    },
    resultText: {
        fontSize: 10,
        color: Colors.TraceEmerald,
        fontFamily: 'monospace',
    },
    instructions: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 32,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFC107',
        marginBottom: 4,
    },
    instructionsText: {
        fontSize: 12,
        color: '#FFC107',
        lineHeight: 18,
    },
    testButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    testButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignSelf: 'center',
        marginTop: 8,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    actionButton: {
        backgroundColor: Colors.TraceEmerald,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    actionButtonText: {
        color: Colors.DeepVoid,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
