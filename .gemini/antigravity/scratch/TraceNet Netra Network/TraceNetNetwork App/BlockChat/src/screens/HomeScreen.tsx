import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getBalance } from '../api/wallet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

export default function HomeScreen() {
    const { user, wallet, logout, mnemonic } = useAuth();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBalance = async () => {
        if (wallet?.wallet_id) {
            setLoading(true);
            try {
                const bal = await getBalance(wallet.wallet_id);
                setBalance(bal);
            } catch (error) {
                console.error('Failed to fetch balance', error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [wallet]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.welcome}>👋 Welcome, {user?.name}</Text>
                <Text style={styles.subtitle}>@{user?.nickname}</Text>
            </View>

            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>💰 Total Balance</Text>
                    <TouchableOpacity onPress={fetchBalance} style={styles.refreshButton}>
                        <Text style={styles.refreshIcon}>🔄</Text>
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.TraceEmerald} />
                ) : (
                    <Text style={styles.balance}>
                        {balance !== null ? (balance / 100000000).toFixed(5) : '0.00'}
                        <Text style={styles.balanceCurrency}> LT</Text>
                    </Text>
                )}
            </View>

            {mnemonic && (
                <View style={styles.mnemonicCard}>
                    <Text style={styles.mnemonicTitle}>🔐 Secret Recovery Phrase</Text>
                    <View style={styles.mnemonicBox}>
                        <Text style={styles.mnemonic} selectable>{mnemonic}</Text>
                    </View>
                    <Text style={styles.mnemonicWarning}>⚠️ Save this securely! Never share with anyone.</Text>
                </View>
            )}

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Transfer')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionIcon}>💸</Text>
                    <Text style={styles.actionText}>Send Money</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionIcon}>🚪</Text>
                    <Text style={styles.actionText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: Colors.DeepVoid,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 16,
        tintColor: Colors.TraceEmerald,
    },
    welcome: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 4,
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.TraceEmerald,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.MutedText,
        fontFamily: 'monospace',
    },
    balanceCard: {
        ...GlassStyle,
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    balanceLabel: {
        fontSize: 14,
        color: Colors.MutedText,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    refreshButton: {
        padding: 4,
    },
    refreshIcon: {
        fontSize: 18,
        color: Colors.TraceEmerald,
    },
    balance: {
        fontSize: 48,
        fontWeight: 'bold',
        color: Colors.White,
        fontFamily: 'monospace',
        textShadowColor: 'rgba(16, 185, 129, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    balanceCurrency: {
        fontSize: 24,
        fontWeight: '600',
        color: Colors.TraceEmerald,
    },
    mnemonicCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint for warning
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.DangerRed,
    },
    mnemonicTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.DangerRed,
        marginBottom: 8,
    },
    mnemonicBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    mnemonic: {
        fontSize: 14,
        fontFamily: 'monospace',
        color: Colors.White,
        lineHeight: 20,
    },
    mnemonicWarning: {
        fontSize: 12,
        color: Colors.DangerRed,
        fontWeight: '600',
    },
    actionsContainer: {
        gap: 16,
    },
    actionButton: {
        backgroundColor: Colors.TraceEmerald,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoutButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.DangerRed,
        shadowColor: 'transparent',
        marginTop: 8,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    actionText: {
        color: Colors.DeepVoid,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
