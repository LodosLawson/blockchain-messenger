import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert, Image, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { getFeed, createContent } from '../api/content';
import { likeContent, addComment, getComments } from '../api/social';
import { useAuth } from '../context/AuthContext';
import { Content } from '../types';
import { useNavigation } from '@react-navigation/native';

export default function FeedScreen() {
    const { wallet } = useAuth();
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
        if (!wallet) return;
        try {
            await likeContent(wallet.wallet_id, contentId);
            // Optimistically update UI could be done here, but for now just re-fetch or simple alert
            fetchFeed();
        } catch (error: any) {
            Alert.alert('Error', 'Failed to like content');
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
        if (!wallet || !activePostId || !newComment.trim()) return;

        try {
            await addComment(wallet.wallet_id, activePostId, newComment);
            setNewComment('');
            // Refresh comments
            const fetchedComments = await getComments(activePostId);
            setComments(fetchedComments || []);
            Alert.alert('Success', 'Comment added!');
        } catch (error) {
            Alert.alert('Error', 'Failed to add comment');
        }
    };

    const renderItem = ({ item }: { item: Content }) => {
        // Extract user info - could come from backend or be missing
        const userName = item.user ? `${item.user.name} ${item.user.surname}` : (item.nickname || 'Anonymous');
        const userNickname = item.user?.nickname || item.nickname || 'anonymous';
        const avatarLetter = userNickname.charAt(0).toUpperCase();

        const handleUserPress = () => {
            if (item.nickname || item.user) {
                // Navigate to profile with available info
                // ProfileScreen will fetch full details if needed
                (navigation as any).navigate('Profile', {
                    nickname: item.nickname || item.user?.nickname,
                    wallet_id: item.wallet_id,
                    user: item.user // Pass if available
                });
            } else {
                Alert.alert('Info', 'User information not available');
            }
        };

        return (
            <View style={styles.card}>
                {/* User Header */}
                <TouchableOpacity
                    style={styles.userHeader}
                    onPress={handleUserPress}
                    disabled={!item.nickname && !item.user}
                >
                    <View style={styles.profileAvatar}>
                        <Text style={styles.profileAvatarText}>{avatarLetter}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userNickname}>@{userNickname}</Text>
                    </View>
                </TouchableOpacity>

                {/* Content Header with TX info */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.tx_id && (
                        <Text style={styles.blockInfo}>TX: {item.tx_id.substring(0, 8)}...</Text>
                    )}
                </View>
                <Text style={styles.description}>{item.description}</Text>
                {item.content_url && (
                    <Image source={{ uri: item.content_url }} style={styles.image} resizeMode="cover" />
                )}
                <View style={styles.footer}>
                    <Text style={styles.likes}>❤️ {item.likes_count} Likes</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.content_id)}>
                            <Text style={styles.buttonText}>👍 Like</Text>
                        </TouchableOpacity>
                        <View style={{ width: 10 }} />
                        <TouchableOpacity style={styles.commentButton} onPress={() => handleOpenComments(item.content_id)}>
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
                                    <Text style={styles.commentUser}>{item.wallet_id?.substring(0, 8)}...</Text>
                                    <Text style={styles.commentText}>{item.text}</Text>
                                </View>
                            )}
                            style={{ maxHeight: 200, marginBottom: 10 }}
                            ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Add a comment..."
                        value={newComment}
                        onChangeText={setNewComment}
                    />

                    <View style={styles.modalButtons}>
                        <Button title="Close" onPress={() => setCommentModalVisible(false)} color="red" />
                        <Button title="Submit" onPress={handleAddComment} />
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
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    likes: {
        color: '#888',
        fontSize: 14,
        fontWeight: '600',
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        color: '#888',
    },
    createButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#007bff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalScrollView: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
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
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    typeButtonActive: {
        borderColor: '#007bff',
        backgroundColor: '#e7f3ff',
    },
    typeButtonText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: '#007bff',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 14,
        backgroundColor: '#fafafa',
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
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    cancelButtonText: {
        color: '#6c757d',
        fontWeight: '600',
    },
    postButton: {
        backgroundColor: '#007bff',
    },
    postButtonDisabled: {
        backgroundColor: '#6c757d',
    },
    postButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    blockInfo: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        padding: 4,
        borderRadius: 4,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    likeButton: {
        backgroundColor: '#28a745',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    commentButton: {
        backgroundColor: '#6c757d',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    commentItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    commentUser: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#555',
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        marginTop: 4,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    profileAvatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    userNickname: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
});

