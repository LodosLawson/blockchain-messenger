import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../api/messaging';
import { getUser, getUserById } from '../api/auth';
import { getFollowers, getFollowing } from '../api/social';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

export default function ConversationListScreen() {
    const { user, wallet, mnemonic } = useAuth();
    const navigation = useNavigation();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New UI State
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [showNewChat, setShowNewChat] = useState(false);
    const [followingUsers, setFollowingUsers] = useState<any[]>([]);
    const [loadingFollowing, setLoadingFollowing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (wallet) {
                loadConversations();
                fetchStats();
            }
        }, [wallet, mnemonic])
    );

    const fetchStats = async () => {
        if (!wallet) return;
        try {
            console.log('Fetching stats for:', wallet.wallet_id);
            const [followersData, followingIds] = await Promise.all([
                getFollowers(wallet.wallet_id),
                getFollowing(wallet.wallet_id)
            ]);
            console.log('Stats received:', { followers: followersData, following: followingIds });

            // Safe length checks
            const followerCount = followersData?.followers ? followersData.followers.length : 0;
            const followingCount = Array.isArray(followingIds) ? followingIds.length : 0;

            setStats({
                followers: followerCount,
                following: followingCount
            });
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const handleOpenNewChat = async () => {
        setShowNewChat(true);
        if (!wallet || followingUsers.length > 0) return; // Don't re-fetch if already have data

        setLoadingFollowing(true);
        try {
            const followingIds = await getFollowing(wallet.wallet_id);
            if (followingIds.length === 0) {
                setFollowingUsers([]);
                return;
            }

            // Fetch details for each followed user
            const users = await Promise.all(followingIds.map(async (id) => {
                const data = await getUserById(id);
                return data.user || { user_id: id, nickname: 'Unknown', displayName: 'Unknown' };
            }));

            setFollowingUsers(users);
        } catch (error) {
            console.error('Failed to fetch following users', error);
            Alert.alert('Error', 'Could not load followed users');
        } finally {
            setLoadingFollowing(false);
        }
    };

    const loadConversations = async () => {
        setLoading(true);
        try {
            const data = await getConversations(wallet!.wallet_id);

            // Prepare keys for decryption preview
            let myPrivateKey: Uint8Array | null = null;
            if (mnemonic) {
                const { deriveEncryptionKeyFromMnemonic } = require('../utils/encryption');
                const keys = deriveEncryptionKeyFromMnemonic(mnemonic);
                myPrivateKey = keys.privateKey;
            }

            const { decryptMessage } = require('../utils/encryption');

            // Fetch user details for each conversation
            // We use a Map to cache user fetches to avoid duplicate requests
            const userCache = new Map();

            const enrichedData = await Promise.all(data.map(async (conv) => {
                let displayUser: any = {
                    user_id: conv.user_id,
                    nickname: 'Unknown',
                    displayName: 'Unknown'
                };

                try {
                    if (conv.user_id) {
                        // Check cache first
                        if (userCache.has(conv.user_id)) {
                            displayUser = userCache.get(conv.user_id);
                        } else {
                            // Use our new robust getUserById which handles caching & fallbacks
                            const userResponse = await getUserById(conv.user_id);
                            if (userResponse?.user) {
                                displayUser = {
                                    ...userResponse.user,
                                    displayName: userResponse.user.nickname || `User`
                                };
                            } else {
                                // Fallback if user not found on server
                                displayUser = {
                                    user_id: conv.user_id,
                                    nickname: 'Unknown',
                                    displayName: `User_${conv.user_id.substring(0, 4)}`
                                };
                            }
                            userCache.set(conv.user_id, displayUser);
                        }
                    } else {
                        displayUser.displayName = conv.nickname || `User_?`;
                    }
                } catch (e) {
                    displayUser.displayName = conv.nickname || (conv.user_id ? conv.user_id.substring(0, 8) : 'Unknown');
                }

                // Attempt Decryption of Last Message for Preview
                let previewText = conv.lastMessage;
                const isEncrypted = previewText && (previewText.includes('nonce:') || previewText.length > 50);

                if (isEncrypted && myPrivateKey && displayUser.user_id) {
                    try {
                        let keyToUse = conv.sender_encryption_key;

                        // If we don't have the key from the message, try to fetch it
                        if (!keyToUse) {
                            const { getEncryptionKey } = require('../api/auth');
                            const identifier = displayUser.nickname !== 'Unknown' ? displayUser.nickname : displayUser.user_id;
                            // Only try fetch if we have a valid identifier
                            if (identifier) {
                                const keyData = await getEncryptionKey(identifier).catch(() => null);
                                keyToUse = keyData?.encryption_public_key;
                            }
                        }

                        if (keyToUse) {
                            previewText = decryptMessage(conv.lastMessage, keyToUse, myPrivateKey);
                        }
                    } catch (decryptErr) {
                        // Keep as encrypted text if fail
                    }
                }

                return {
                    ...conv,
                    ...displayUser,
                    lastMessage: previewText
                };
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
            onPress={() => {
                const target = item.user || { user_id: item.user_id, nickname: item.nickname, name: item.name, surname: item.surname };
                (navigation as any).navigate('Chat', { user: target });
            }}
            activeOpacity={0.7}
        >
            <View style={styles.avatar}>
                {item.profile_image ? (
                    <Text style={{ fontSize: 24 }}>📷</Text>
                ) : (
                    <Text style={styles.avatarText}>{(item.displayName || '?')[0].toUpperCase()}</Text>
                )}
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name}>{item.displayName}</Text>
                    <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.message} numberOfLines={1}>
                    {/* If still encrypted/long, show lock icon. Else show text. */}
                    {(item.lastMessage && item.lastMessage.includes('nonce:'))
                        ? '🔒 Encrypted Message'
                        : item.lastMessage}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <View style={styles.statsHeader}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.followers}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.following}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.TraceEmerald} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.user_id ? `${item.user_id}-${index}` : `unknown-${index}`}
                    contentContainerStyle={{ paddingBottom: 80 }} // Space for FAB
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>💬</Text>
                            <Text style={styles.empty}>No conversations yet</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to start a chat!</Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenNewChat}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>

            {/* New Chat Modal */}
            <Modal
                visible={showNewChat}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNewChat(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Chat</Text>
                        <TouchableOpacity onPress={() => setShowNewChat(false)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>Select a person you follow:</Text>

                    {loadingFollowing ? (
                        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={Colors.TraceEmerald} />
                    ) : (
                        <FlatList
                            data={followingUsers}
                            keyExtractor={(item) => item.user_id}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text>You are not following anyone yet.</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.userSelectRow}
                                    onPress={() => {
                                        setShowNewChat(false);
                                        (navigation as any).navigate('Chat', { user: item });
                                    }}
                                >
                                    <View style={[styles.avatar, { width: 40, height: 40 }]}>
                                        <Text style={[styles.avatarText, { fontSize: 16 }]}>
                                            {(item.nickname || item.name || '?')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.selectUserName}>{item.name || item.nickname}</Text>
                                        <Text style={styles.selectUserHandle}>@{item.nickname}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.DeepVoid,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.DeepVoid,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
    },
    avatarText: {
        color: Colors.TraceEmerald,
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    name: {
        color: Colors.White,
        fontWeight: 'bold',
        fontSize: 16,
    },
    time: {
        color: Colors.TraceEmerald,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    message: {
        color: Colors.MutedText,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.5,
    },
    empty: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.White,
        marginBottom: 8,
    },
    emptySubtext: {
        textAlign: 'center',
        fontSize: 14,
        color: Colors.MutedText,
    },
    // New Styles
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
        ...GlassStyle,
        marginBottom: 1, // Separator
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.White,
        fontFamily: 'monospace',
    },
    statLabel: {
        fontSize: 10,
        color: Colors.MutedText,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.SubtleBorder,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.TraceEmerald,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    fabIcon: {
        fontSize: 32,
        color: Colors.DeepVoid,
        marginTop: -4, // Adjust vertical alignment
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.DeepVoid,
        paddingTop: 20, // For iOS status bar
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
        ...GlassStyle,
    },
    modalTitle: {
        ...Typography.H1,
        fontSize: 20,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        color: Colors.TraceEmerald,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        padding: 16,
        color: Colors.MutedText,
        fontSize: 14,
        backgroundColor: 'transparent',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    userSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
    },
    selectUserName: {
        fontSize: 16,
        color: Colors.White,
        fontWeight: 'bold',
    },
    selectUserHandle: {
        fontSize: 12,
        color: Colors.TraceEmerald,
        fontFamily: 'monospace',
    }
});
