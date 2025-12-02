import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';
import { getNetworkStatus, NetworkStatus } from '../api/blockchain';
import { Switch, TouchableOpacity } from 'react-native';

type Step = 'form' | 'keys';

export default function RegisterScreen() {
    const [step, setStep] = useState<Step>('form');

    const [nickname, setNickname] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
    const [saveToKeychain, setSaveToKeychain] = useState(true);

    const [mnemonic, setMnemonic] = useState('');
    const [walletId, setWalletId] = useState('');
    const [publicKey, setPublicKey] = useState('');

    const { register } = useAuth();

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await getNetworkStatus();
            setNetworkStatus(status);
        };
        fetchStatus();
    }, []);

    const handleRegister = async () => {
        // Optional fields logic: use input or defaults
        const finalNickname = nickname || `User${Math.floor(Math.random() * 10000)}`;
        const finalName = name || 'Anonymous';
        const finalSurname = surname || 'User';
        const finalBirthDate = birthDate || '2000-01-01';

        setLoading(true);
        try {
            const response = await registerUser({
                nickname: finalNickname,
                name: finalName,
                surname: finalSurname,
                birth_date: finalBirthDate,
            });

            setMnemonic(response.mnemonic);
            setWalletId(response.wallet.wallet_id);
            setPublicKey(response.wallet.public_key);

            await register(response.user, response.wallet, response.mnemonic, saveToKeychain);

            setStep('keys');
        } catch (error: any) {
            Alert.alert('Error', 'Registration failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Step 1: User Form
    if (step === 'form') {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>🌐 BlockChat</Text>

                {networkStatus && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={[styles.statValue, { color: networkStatus.status === 'online' ? 'green' : 'red' }]}>
                                {networkStatus.status.toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Blocks</Text>
                            <Text style={styles.statValue}>{networkStatus.blockHeight}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Coins</Text>
                            <Text style={styles.statValue}>{networkStatus.totalCoins.toLocaleString()}</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.subtitle}>Create your account on TraceNet</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Nickname (Optional)"
                    value={nickname}
                    onChangeText={setNickname}
                    autoCapitalize="none"
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Name (Optional)"
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Surname (Optional)"
                    value={surname}
                    onChangeText={setSurname}
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Birth Date (YYYY-MM-DD) (Optional)"
                    value={birthDate}
                    onChangeText={setBirthDate}
                    editable={!loading}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#007bff" />
                ) : (
                    <Button title="Create Account" onPress={handleRegister} />
                )}
            </ScrollView>
        );
    }

    // Step 2: Keys Display
    if (step === 'keys') {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>🔐 Your Keys</Text>
                <Text style={styles.warningText}>
                    ⚠️ IMPORTANT: Save these keys securely! You'll need them to recover your account.
                </Text>

                <View style={styles.keyBox}>
                    <Text style={styles.keyLabel}>Wallet ID:</Text>
                    <Text style={styles.keyValue} selectable>{walletId}</Text>
                </View>

                <View style={styles.keyBox}>
                    <Text style={styles.keyLabel}>Public Key:</Text>
                    <Text style={styles.keyValue} selectable>{publicKey}</Text>
                </View>

                <View style={[styles.keyBox, styles.mnemonicBox]}>
                    <Text style={styles.keyLabel}>Recovery Phrase (Mnemonic):</Text>
                    <Text style={styles.mnemonicValue} selectable>{mnemonic}</Text>
                </View>

                <View style={styles.storageOptions}>
                    <Text style={styles.sectionHeader}>Storage Options</Text>

                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Auto-login (Save to Keychain)</Text>
                        <Switch
                            value={saveToKeychain}
                            onValueChange={setSaveToKeychain}
                        />
                    </View>

                    <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert('Coming Soon', 'Google Drive backup will be available soon!')}>
                        <Text style={styles.optionButtonText}>☁️ Backup to Google Drive</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert('Coming Soon', 'Cloud backup will be available soon!')}>
                        <Text style={styles.optionButtonText}>☁️ Backup to TraceNet Cloud</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionButton} onPress={() => Alert.alert('Saved', 'Keys saved to local file (Mock)')}>
                        <Text style={styles.optionButtonText}>📁 Save to File</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.infoText}>
                    ✅ Account created successfully! You can now access the app.
                </Text>
            </ScrollView>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#007bff',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    warningText: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 5,
        marginBottom: 20,
        fontSize: 14,
        color: '#856404',
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    infoText: {
        backgroundColor: '#d4edda',
        padding: 15,
        borderRadius: 5,
        marginTop: 20,
        fontSize: 14,
        color: '#155724',
        borderWidth: 1,
        borderColor: '#c3e6cb',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
    keyBox: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 5,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    mnemonicBox: {
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800',
    },
    keyLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 5,
    },
    keyValue: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#333',
    },
    mnemonicValue: {
        fontSize: 14,
        fontFamily: 'monospace',
        color: '#e65100',
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f0f2f5',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    storageOptions: {
        marginTop: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    switchLabel: {
        fontSize: 14,
        color: '#333',
    },
    optionButton: {
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center',
    },
    optionButtonText: {
        color: '#1976d2',
        fontWeight: 'bold',
    },
});
