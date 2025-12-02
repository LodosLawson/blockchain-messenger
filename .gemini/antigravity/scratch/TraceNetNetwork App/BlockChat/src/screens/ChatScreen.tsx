import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { sendEncryptedMessage, getMessages } from '../api/messaging';
import { RouteProp, useRoute } from '@react-navigation/native';
import { User } from '../types';
import { encryptMessage, decryptMessage } from '../utils/encryption';

type ChatRouteProp = RouteProp<{ Chat: { user: User } }, 'Chat'>;

interface Message {
    id: string;
    text: string;
    isMine: boolean;
    timestamp: Date;
}

export default function ChatScreen() {
    const { user: loggedInUser, wallet } = useAuth();
    const route = useRoute<ChatRouteProp>();
    const recipientUser = route.params?.user;

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);

    const fetchHistory = async () => {
        if (!wallet || !recipientUser) return;
        try {
            const history = await getMessages(wallet.wallet_id, recipientUser.user_id);
            const mappedMessages: Message[] = history.map((msg: any) => ({
                id: msg.id || Math.random().toString(),
                text: decryptMessage(msg.message),
                isMine: msg.sender_wallet === wallet.wallet_id,
                timestamp: new Date(msg.timestamp),
            }));
            mappedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            setMessages(mappedMessages);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [recipientUser]);

    const handleSend = async () => {
        if (!message.trim() || !wallet || !recipientUser) return;

        setSending(true);
        try {
            const simulatedEncryptedMessage = encryptMessage(message);
            const mockSignature = "simulated_signature_" + Date.now();

            const response = await sendEncryptedMessage({
                from_wallet: wallet.wallet_id,
                to_wallet: recipientUser.user_id,
                encrypted_message: simulatedEncryptedMessage,
                sender_public_key: wallet.public_key,
                sender_signature: mockSignature,
            });

            const newMessage: Message = {
                id: response.tx_id,
                text: message,
                isMine: true,
                timestamp: new Date(),
            };
            setMessages([...messages, newMessage]);
            setMessage('');

            // Refresh history to confirm sync
            setTimeout(fetchHistory, 1000);
        } catch (error: any) {
            Alert.alert('Error', `Failed to send message: ${error.response?.data?.message || error.message}`);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[styles.messageContainer, item.isMine ? styles.myMessage : styles.theirMessage]}>
            <Text style={[styles.messageText, item.isMine ? styles.myMessageText : styles.theirMessageText]}>{item.text}</Text>
            <Text style={[styles.timestamp, item.isMine ? styles.myTimestamp : styles.theirTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.header}>
                <Text style={styles.headerText}>Chat with @{recipientUser?.nickname}</Text>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={message}
                    onChangeText={setMessage}
                    multiline={true}
                    editable={!sending}
                />
                {sending ? (
                    <ActivityIndicator style={styles.sendButton} />
                ) : (
                    <Button title="Send" onPress={handleSend} disabled={!message.trim()} />
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 15,
        backgroundColor: '#007bff',
        borderBottomWidth: 1,
        borderBottomColor: '#0056b3',
    },
    headerText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    messagesList: {
        flex: 1,
    },
    messagesContent: {
        padding: 10,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
        elevation: 1,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007bff',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: 'white',
    },
    theirMessageText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: '#999',
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 50,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 10,
    },
});
