import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { calculateTransferFee, transfer } from '../api/transfer';
import { Priority } from '../types';
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
                placeholder="TRN..."
                value={recipient}
                onChangeText={setRecipient}
            />

            <Text style={styles.label}>Amount (LT)</Text>
            <TextInput
                style={styles.input}
                placeholder="0.00"
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

            <Button title={loadingFee ? "Calculating..." : "Calculate Fee"} onPress={handleCalculateFee} disabled={loadingFee} />

            {fee && (
                <View style={styles.feeContainer}>
                    <Text style={styles.feeText}>Estimated Fee: {fee}</Text>
                </View>
            )}

            <View style={styles.spacer} />

            {sending ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <Button title="Send Money" onPress={handleTransfer} disabled={!fee} />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
    priorityContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    priorityButton: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 5,
    },
    priorityButtonSelected: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    priorityText: {
        color: '#000',
    },
    priorityTextSelected: {
        color: '#fff',
    },
    feeContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        alignItems: 'center',
    },
    feeText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    spacer: {
        height: 20,
    },
});
