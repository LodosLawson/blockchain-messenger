import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Image, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { getFeed, createContent } from '../api/content';
import { likeContent, addComment, getComments, getLikes, followUser } from '../api/social';
import { useAuth } from '../context/AuthContext';
import { Content } from '../types';
import { useNavigation } from '@react-navigation/native';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

export default function FeedScreen() {
    const { wallet, mnemonic } = useAuth();
    const navigation = useNavigation();
    const [feed, setFeed] = useState<Content[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostDesc, setNewPostDesc] = useState('');
    const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
    const [contentUrl, setContentUrl] = useState('');
    const [posting, setPosting] = useState(false);

    // Comments state
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const response = await getFeed();
            // Backend returns 'contents' array, map it to our Content interface
            const mappedFeed = (response.contents || []).map((item: any) => ({
                content_id: item.content_id,
                wallet_id: item.owner_wallet, // Backend uses owner_wallet
                content_type: item.content_type,
                title: item.description, // Backend has no title, use description
                description: item.description,
                content_url: item.content_url,
                likes_count: item.likes_count || 0,
                created_at: item.created_at,
                tx_id: item.content_id, // Use content_id as tx_id
                nickname: item.owner_nickname, // For display
            }));
            setFeed(mappedFeed);
        } catch (error) {
            console.error('Failed to fetch feed', error);
            Alert.alert('Error', 'Failed to fetch feed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const handleLike = async (contentId: string) => {
        if (!wallet || !mnemonic) return;

        try {
            // Check if already liked on blockchain
            const currentLikes = await getLikes(contentId);
            const alreadyLiked = currentLikes.some((like: any) => like.from_wallet === wallet.wallet_id);

            if (alreadyLiked) {
                Alert.alert('Info', 'You have already liked this post.');
                return;
            }

            // Optimistic Update
            setFeed(currentFeed =>
                currentFeed.map(item =>
                    item.content_id === contentId
                        ? { ...item, likes_count: (item.likes_count || 0) + 1 }
                        : item
                )
            );

            // Find target wallet (Content Owner)
            const targetContent = feed.find(c => c.content_id === contentId);
            const targetWalletId = targetContent?.wallet_id;

            if (!targetWalletId) {
                console.warn('Target wallet not found for content:', contentId);
            }

            await likeContent(mnemonic, wallet.wallet_id, contentId, targetWalletId || '');

        } catch (error: any) {
            console.error('Like failed:', error);
            Alert.alert('Error', `Like failed: ${error.message}`);
            // Revert on failure
            fetchFeed();
        }
    };

    const handleCreatePost = async () => {
        if (!wallet) return;
        if (!newPostTitle || !newPostDesc) {
            Alert.alert('Error', 'Please fill title and description');
            return;
        }

        // Validate URL if content type is image or video
        if ((contentType === 'image' || contentType === 'video') && !contentUrl) {
            Alert.alert('Error', `Please provide ${contentType} URL`);
            return;
        }

        setPosting(true);
        try {
            // Map frontend types to backend types
            let backendType = 'TEXT';
            if (contentType === 'image') backendType = 'PHOTO';
            if (contentType === 'video') backendType = 'VIDEO';

            await createContent(
                wallet.wallet_id,
                newPostTitle,
                newPostDesc,
                backendType,
                contentUrl || undefined,
                ['mobile-app'] // Default tag
            );
            setModalVisible(false);
            setNewPostTitle('');
            setNewPostDesc('');
            setContentUrl('');
            setContentType('text');
            fetchFeed();
            Alert.alert('Success', 'Post created and submitted to blockchain!');
        } catch (error: any) {
            console.error('Create post error:', error);
            const errorData = error.response?.data || {};
            const errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || error.message || 'Unknown error';
            Alert.alert('Error', `Failed to create post: ${errorMessage}`);
        } finally {
            setPosting(false);
        }
    };

    const handleOpenComments = async (contentId: string) => {
        setActivePostId(contentId);
        setCommentModalVisible(true);
        setLoadingComments(true);
        try {
            const fetchedComments = await getComments(contentId);
            setComments(fetchedComments || []);
        } catch (error) {
            console.error('Failed to fetch comments', error);
            // Fallback for demo if API fails
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };



    const handleAddComment = async () => {
        if (!wallet || !activePostId || !newComment.trim() || !mnemonic) return;

        // Optimistic Comment (Virtual addition)
        const virtualComment = {
            wallet_id: wallet.wallet_id,
            text: newComment, // The API uses 'comment_text' but UI might use 'text' or map it
            comment_text: newComment,
            timestamp: Date.now()
        };
        setComments(prev => [...prev, virtualComment]);

        const commentTextForApi = newComment;
        setNewComment('');
        setReplyingToCommentId(null);

        // Find target wallet (Content Owner)
        const targetContent = feed.find(c => c.content_id === activePostId);
        const targetWalletId = targetContent?.wallet_id;

        try {
            await addComment(mnemonic, wallet.wallet_id, activePostId, commentTextForApi, replyingToCommentId || undefined, targetWalletId);

            Alert.alert('Success', 'Comment submitted!');
            // Refresh comments to get real IDs/data from backend logic if needed
            setTimeout(async () => {
                const fetchedComments = await getComments(activePostId);
                setComments(fetchedComments || []);
            }, 1000);

        } catch (error: any) {
            console.error('Comment failed:', error);
            Alert.alert('Error', `Failed to add comment: ${error.message}`);
            // Re-fetch to clear invalid optimistic state
            const fetchedComments = await getComments(activePostId);
            setComments(fetchedComments || []);
        }
    };

    const renderItem = ({ item }: { item: Content }) => {
        // Safe data extraction
        const user = item.user;
        const nickname = item.nickname || user?.nickname || 'Anonymous';
        const name = user ? `${user.name} ${user.surname}` : nickname;
        const avatarChar = (nickname[0] || '?').toUpperCase();

        // Handle User Press
        const handleUserPress = () => {
            if (item.nickname || item.user) {
                (navigation as any).navigate('Profile', {
                    nickname: item.nickname || item.user?.nickname,
                    wallet_id: item.wallet_id,
                    user: item.user
                });
            } else {
                Alert.alert('Info', 'User information not available');
            }
        };

        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.userHeader}
                    onPress={() => navigation.navigate('Profile' as never, {
                        user: {
                            user_id: item.wallet_id,
                            wallet_id: item.wallet_id,
                            nickname: item.nickname || 'Anonymous',
                            name: 'User',
                            surname: '',
                            email: '',
                            phone: '',
                            birth_date: '',
                            created_at: new Date().toISOString(),
                        },
                        wallet_id: item.wallet_id,
                        nickname: item.nickname
                    } as never)}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>
                            {(item.nickname || 'A').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <View style={styles.headerRow}>
                            <Text style={styles.userName}>{item.nickname || 'Anonymous'}</Text>
                            <Text style={styles.blockInfo}>BLOCK #{item.block_height || 'PENDING'}</Text>
                        </View>
                        <Text style={styles.userNickname}>@{item.nickname || item.wallet_id.substring(0, 8)}</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.description}>{item.description}</Text>

                {!!item.content_url && (
                    <Image
                        source={{ uri: item.content_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.footer}>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleLike(item.content_id); }} style={styles.likeButton}>
                            <Text style={styles.buttonText}>❤️ {item.likes_count}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleOpenComments(item.content_id); }} style={styles.commentButton}>
                            <Text style={styles.buttonText}>💬 Comment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.createButtonText}>✨ Create New Post</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <ScrollView contentContainerStyle={styles.modalScrollView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>📝 Create New Post</Text>

                        {/* Content Type Selector */}
                        <Text style={styles.label}>Content Type:</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeButton, contentType === 'text' && styles.typeButtonActive]}
                                onPress={() => setContentType('text')}
                            >
                                <Text style={[styles.typeButtonText, contentType === 'text' && styles.typeButtonTextActive]}>
                                    📄 Text
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, contentType === 'image' && styles.typeButtonActive]}
                                onPress={() => setContentType('image')}
                            >
                                <Text style={[styles.typeButtonText, contentType === 'image' && styles.typeButtonTextActive]}>
                                    🖼️ Image
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, contentType === 'video' && styles.typeButtonActive]}
                                onPress={() => setContentType('video')}
                            >
                                <Text style={[styles.typeButtonText, contentType === 'video' && styles.typeButtonTextActive]}>
                                    🎥 Video
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Title"
                            value={newPostTitle}
                            onChangeText={setNewPostTitle}
                            placeholderTextColor="#999"
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="What's on your mind?"
                            value={newPostDesc}
                            onChangeText={setNewPostDesc}
                            multiline
                            placeholderTextColor="#999"
                        />

                        {(contentType === 'image' || contentType === 'video') && (
                            <TextInput
                                style={styles.input}
                                placeholder={`${contentType === 'image' ? 'Image' : 'Video'} URL`}
                                value={contentUrl}
                                onChangeText={setContentUrl}
                                placeholderTextColor="#999"
                                autoCapitalize="none"
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.postButton, posting && styles.postButtonDisabled]}
                                onPress={handleCreatePost}
                                disabled={posting}
                            >
                                <Text style={styles.postButtonText}>{posting ? "Posting..." : "🚀 Post"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={commentModalVisible}
                onRequestClose={() => setCommentModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Comments</Text>
                    {loadingComments ? (
                        <ActivityIndicator />
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentUser}>{item.wallet_id?.substring(0, 8)}...</Text>
                                        <Text style={styles.commentDate}>{new Date(item.timestamp || Date.now()).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={styles.commentText}>{item.comment_text || item.text}</Text>
                                    <TouchableOpacity onPress={() => setReplyingToCommentId(item.comment_id)}>
                                        <Text style={styles.replyButtonText}>Reply</Text>
                                    </TouchableOpacity>
                                    {/* Simple Nested View */}
                                    {item.replies && item.replies.length > 0 && (
                                        <View style={styles.repliesContainer}>
                                            {item.replies.map((reply: any, rIndex: number) => (
                                                <View key={rIndex} style={styles.replyItem}>
                                                    <Text style={styles.commentUser}>{reply.wallet_id?.substring(0, 8)}...</Text>
                                                    <Text style={styles.commentText}>{reply.comment_text || reply.text}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                            style={{ maxHeight: 200, marginBottom: 10 }}
                            ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
                        />
                    )}

                    {replyingToCommentId && (
                        <View style={styles.replyingToContainer}>
                            <Text style={styles.replyingToText}>Replying to comment...</Text>
                            <TouchableOpacity onPress={() => setReplyingToCommentId(null)}>
                                <Text style={styles.cancelReplyText}>X</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder={replyingToCommentId ? "Write a reply..." : "Add a comment..."}
                        value={newComment}
                        onChangeText={setNewComment}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setCommentModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalButton} onPress={handleAddComment}>
                            <Text style={styles.postButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <FlatList
                    data={feed}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.content_id}
                    refreshing={loading}
                    onRefresh={fetchFeed}
                    ListEmptyComponent={<Text style={styles.empty}>No content found.</Text>}
                />
            )}
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.DeepVoid,
    },
    card: {
        ...GlassStyle,
        padding: 16,
        marginBottom: 16,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.SubtleBorder,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
    },
    profileAvatarText: {
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
        fontSize: 18,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: Colors.White,
        fontWeight: 'bold',
        fontSize: 16,
    },
    userNickname: {
        color: Colors.TraceEmerald,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        ...Typography.H2,
        marginBottom: 4,
        color: Colors.White,
    },
    blockInfo: {
        ...Typography.Data,
        fontSize: 10,
        opacity: 0.7,
    },
    description: {
        ...Typography.Body,
        marginBottom: 12,
        lineHeight: 22,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.SubtleBorder,
    },
    likes: {
        color: Colors.TraceEmerald,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    likeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red tint
    },
    commentButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Emerald tint
        marginLeft: 8,
    },
    messageButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue tint
        marginLeft: 8,
    },
    followButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.1)', // Violet tint
        marginLeft: 8,
    },
    buttonText: {
        color: Colors.White,
        fontSize: 12,
        fontWeight: '600',
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: Colors.MutedText,
        ...Typography.Body,
    },
    createButton: {
        backgroundColor: Colors.TraceEmerald,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    createButtonText: {
        color: Colors.DeepVoid, // High contrast on Emerald
        fontWeight: 'bold',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Modal Styles
    modalScrollView: {
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker backdrop
    },
    modalView: {
        margin: 20,
        backgroundColor: Colors.DeepVoid,
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        ...GlassStyle,
    },
    modalTitle: {
        ...Typography.H1,
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        color: Colors.MutedText,
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: Colors.TraceEmerald,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    typeButtonText: {
        fontSize: 12,
        color: Colors.MutedText,
    },
    typeButtonTextActive: {
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 14,
        color: Colors.White,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: Colors.DangerRed,
        backgroundColor: 'transparent',
    },
    cancelButtonText: {
        color: Colors.DangerRed,
        fontWeight: '600',
    },
    postButton: {
        backgroundColor: Colors.TraceEmerald,
    },
    postButtonDisabled: {
        backgroundColor: Colors.MutedText,
        opacity: 0.5,
    },
    postButtonText: {
        color: Colors.DeepVoid,
        fontWeight: 'bold',
    },
    // Comments
    commentItem: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.SubtleBorder,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    commentUser: {
        color: Colors.TraceEmerald,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: 'bold',
    },
    commentDate: {
        color: Colors.MutedText,
        fontSize: 10,
        fontFamily: 'monospace',
    },
    commentText: {
        color: Colors.White,
        fontSize: 14,
        lineHeight: 20,
    },
    replyButtonText: {
        color: Colors.MintGlitch,
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    repliesContainer: {
        marginTop: 8,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: Colors.SubtleBorder,
    },
    replyItem: {
        marginTop: 8,
    },
    replyingToContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 8,
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        borderRadius: 8,
        marginBottom: 12,
    },
    replyingToText: {
        color: Colors.TraceEmerald,
        fontSize: 12,
    },
    cancelReplyText: {
        color: Colors.DangerRed,
        fontWeight: 'bold',
    }
});
