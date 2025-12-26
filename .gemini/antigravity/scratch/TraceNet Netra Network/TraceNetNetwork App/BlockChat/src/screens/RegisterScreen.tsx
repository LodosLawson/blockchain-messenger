import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, Image, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../api/auth';
import { getNetworkStatus, NetworkStatus } from '../api/blockchain';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

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
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>NETRA</Text>
                </View>

                {networkStatus && (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={[styles.statValue, { color: networkStatus.status === 'online' ? Colors.TraceEmerald : Colors.DangerRed }]}>
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
                    placeholder="Nickname (optional)"
                    placeholderTextColor={Colors.MutedText}
                    value={nickname}
                    onChangeText={setNickname}
                    autoCapitalize="none"
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.MutedText}
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.MutedText}
                    value={surname}
                    onChangeText={setSurname}
                    editable={!loading}
                />
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.MutedText}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    editable={!loading}
                />

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.TraceEmerald} />
                ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={handleRegister}>
                        <Text style={styles.actionButtonText}>Create Account</Text>
                    </TouchableOpacity>
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
        padding: 24,
        backgroundColor: Colors.DeepVoid,
    },
    title: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.MutedText,
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 8,
        tintColor: Colors.TraceEmerald, // Apply theme color if pixel art supports filtering, otherwise check transparent
    },
    warningText: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)', // Yellow tint
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        fontSize: 14,
        color: '#FFC107', // Warning Yellow
        borderWidth: 1,
        borderColor: '#FFC107',
    },
    infoText: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Emerald tint
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        fontSize: 14,
        color: Colors.TraceEmerald,
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
        textAlign: 'center',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        padding: 16,
        marginBottom: 16,
        borderRadius: 16,
        color: Colors.White,
        fontSize: 16,
    },
    keyBox: {
        ...GlassStyle,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    mnemonicBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint for sensitivity
        borderColor: Colors.DangerRed,
    },
    keyLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.MutedText,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    keyValue: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: Colors.White,
    },
    mnemonicValue: {
        fontSize: 14,
        fontFamily: 'monospace',
        color: Colors.DangerRed,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        ...GlassStyle,
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        color: Colors.MutedText,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.White,
        fontFamily: 'monospace',
    },
    storageOptions: {
        marginTop: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: Colors.White,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        ...GlassStyle,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    switchLabel: {
        fontSize: 14,
        color: Colors.White,
    },
    optionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    optionButtonText: {
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
    },
    actionButton: {
        backgroundColor: Colors.TraceEmerald,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionButtonText: {
        color: Colors.DeepVoid,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
