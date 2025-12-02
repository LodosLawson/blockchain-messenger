import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getBalance } from '../api/wallet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
        <View style={styles.container}>
            <Text style={styles.welcome}>Welcome, {user?.name}!</Text>
            <Text style={styles.subtitle}>@{user?.nickname}</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Wallet Balance</Text>
                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <Text style={styles.balance}>
                        {balance !== null ? (balance / 100000000).toFixed(5) : '0.00'} LT
                    </Text>
                )}
            </View>

            {mnemonic && (
                <View style={styles.warningCard}>
                    <Text style={styles.warningTitle}>Secret Mnemonic</Text>
                    <Text style={styles.mnemonic}>{mnemonic}</Text>
                    <Text style={styles.warningText}>Save this somewhere safe!</Text>
                </View>
            )}

            <Button title="Refresh Balance" onPress={fetchBalance} />

            <View style={{ marginTop: 10 }}>
                <Button title="Send Money" onPress={() => navigation.navigate('Transfer')} />
            </View>

            <View style={{ marginTop: 20 }}>
                <Button title="Logout" onPress={logout} color="red" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcome: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 30,
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        color: '#888',
        marginBottom: 10,
    },
    balance: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2ecc71',
    },
    warningCard: {
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffeeba',
    },
    warningTitle: {
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 5,
    },
    mnemonic: {
        fontFamily: 'monospace',
        marginBottom: 5,
    },
    warningText: {
        fontSize: 12,
        color: '#856404',
    },
});
