import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { calculateTransferFee, transfer } from '../api/transfer';
import { Priority } from '../types';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';
import { useNavigation } from '@react-navigation/native';

export default function TransferScreen() {
    const { wallet, user } = useAuth();
    const navigation = useNavigation();

    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [priority, setPriority] = useState<Priority>('STANDARD');
    const [fee, setFee] = useState<string | null>(null);
    const [loadingFee, setLoadingFee] = useState(false);
    const [sending, setSending] = useState(false);

    const handleCalculateFee = async () => {
        if (!recipient || !amount) {
            Alert.alert('Error', 'Please enter recipient and amount');
            return;
        }

        setLoadingFee(true);
        try {
            // Amount in LT to smallest unit (assuming 8 decimals based on examples)
            const amountInSmallestUnit = parseFloat(amount) * 100000000;
            const response = await calculateTransferFee(recipient, amountInSmallestUnit, priority);
            setFee(response.total_fee_readable);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to calculate fee: ' + (error.response?.data?.message || error.message));
            setFee(null);
        } finally {
            setLoadingFee(false);
        }
    };

    const handleTransfer = async () => {
        if (!wallet || !user) return;
        if (!recipient || !amount) {
            Alert.alert('Error', 'Please enter recipient and amount');
            return;
        }

        setSending(true);
        try {
            const amountInSmallestUnit = parseFloat(amount) * 100000000;

            // MOCK SIGNATURE as requested
            const mockSignature = "mock_signature_for_phase_2";

            const response = await transfer({
                from_wallet: wallet.wallet_id,
                to_wallet: recipient,
                amount: amountInSmallestUnit,
                priority: priority,
                sender_public_key: wallet.public_key,
                sender_signature: mockSignature
            });

            Alert.alert('Success', `Transfer Successful!\nTX ID: ${response.tx_id}\nFee: ${response.fee_readable}`, [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Transfer failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setSending(false);
        }
    };

    // Auto-calculate fee when inputs change (debounced could be better, but simple for now)
    useEffect(() => {
        if (recipient.length > 10 && amount && !isNaN(parseFloat(amount))) {
            // Optional: Auto calculate or just let user click button
        }
    }, [recipient, amount, priority]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Send Money</Text>

            <Text style={styles.label}>From: {wallet?.wallet_id}</Text>

            <Text style={styles.label}>Recipient Address</Text>
            <TextInput
                style={styles.input}
                placeholderTextColor={Colors.MutedText}
                value={recipient}
                onChangeText={setRecipient}
            />

            <Text style={styles.label}>Amount (LT)</Text>
            <TextInput
                style={styles.input}
                placeholderTextColor={Colors.MutedText}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
                {(['STANDARD', 'HIGH'] as Priority[]).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.priorityButton, priority === p && styles.priorityButtonSelected]}
                        onPress={() => setPriority(p)}
                    >
                        <Text style={[styles.priorityText, priority === p && styles.priorityTextSelected]}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.actionButton, loadingFee && styles.disabledButton]}
                onPress={handleCalculateFee}
                disabled={loadingFee}
            >
                {loadingFee ? <ActivityIndicator color={Colors.DeepVoid} size="small" /> : <Text style={styles.buttonText}>Calculate Fee</Text>}
            </TouchableOpacity>

            {fee && (
                <View style={styles.feeContainer}>
                    <Text style={styles.feeText}>Estimated Fee: {fee}</Text>
                </View>
            )}

            <View style={styles.spacer} />

            {sending ? (
                <ActivityIndicator size="large" color={Colors.TraceEmerald} />
            ) : (
                <TouchableOpacity
                    style={[styles.actionButton, (!fee || sending) && styles.disabledButton]}
                    onPress={handleTransfer}
                    disabled={!fee || sending}
                >
                    <Text style={styles.buttonText}>Send Money</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: Colors.DeepVoid,
        flexGrow: 1,
    },
    title: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: Colors.MutedText,
        marginBottom: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: 'monospace',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        padding: 16,
        marginBottom: 24,
        borderRadius: 16,
        color: Colors.White,
        fontSize: 16,
        fontFamily: 'monospace',
    },
    priorityContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    priorityButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    priorityButtonSelected: {
        backgroundColor: Colors.TraceEmerald,
        borderColor: Colors.TraceEmerald,
    },
    priorityText: {
        color: Colors.MutedText,
        fontWeight: 'bold',
    },
    priorityTextSelected: {
        color: Colors.DeepVoid,
    },
    feeContainer: {
        marginTop: 12,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        marginBottom: 24,
    },
    feeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.TraceEmerald,
        fontFamily: 'monospace',
    },
    spacer: {
        height: 20,
    },
    actionButton: {
        backgroundColor: Colors.TraceEmerald,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledButton: {
        backgroundColor: Colors.SubtleBorder,
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.DeepVoid,
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
