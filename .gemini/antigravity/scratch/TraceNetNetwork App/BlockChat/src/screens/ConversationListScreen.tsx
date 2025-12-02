import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../api/messaging';
import { getUser, getUserById } from '../api/auth';

export default function ConversationListScreen() {
    const { user, wallet } = useAuth();
    const navigation = useNavigation();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (wallet) {
            loadConversations();
        }
    }, [wallet]);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const data = await getConversations(wallet!.wallet_id);

            // Fetch user details for each conversation
            const enrichedData = await Promise.all(data.map(async (conv) => {
                try {
                    if (conv.user_id && conv.user_id.startsWith('user_')) {
                        const userResponse = await getUserById(conv.user_id);
                        return { ...conv, nickname: userResponse.user.nickname, user: userResponse.user };
                    }

                    return {
                        ...conv,
                        nickname: conv.nickname !== 'Unknown' ? conv.nickname : `${conv.user_id.substring(0, 6)}...${conv.user_id.substring(conv.user_id.length - 4)}`
                    };
                } catch (e) {
                    return conv;
                }
            }));

            setConversations(enrichedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => (navigation as any).navigate('Chat', { user: { user_id: item.user_id, nickname: item.nickname } })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nickname[0].toUpperCase()}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name}>{item.nickname}</Text>
                    <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.user_id}
                    ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    item: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    time: {
        color: '#999',
        fontSize: 12,
    },
    message: {
        color: '#666',
        fontSize: 14,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});
