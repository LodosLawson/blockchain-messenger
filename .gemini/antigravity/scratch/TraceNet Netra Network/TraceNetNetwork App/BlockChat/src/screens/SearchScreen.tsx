import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../api/auth';
import { User } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    // Live search with debouncing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 0) { // Changed: Now works with 1+ characters
                handleSearch();
            } else if (query.trim().length === 0) {
                setResults([]);
                setHasSearched(false);
                setError(null);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        setError(null);

        try {
            const users = await searchUsers(query);
            setResults(users || []);
        } catch (err: any) {
            console.error('Search error:', err);
            setResults([]);

            // Don't show error banner for 404 - just show empty state
            if (err.response?.status === 404) {
                return;
            }

            // Show error banner for other errors
            const errorMessage = err.response?.data?.message || err.message || 'Search failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = (user: User) => {
        navigation.navigate('Chat', { user: { user_id: user.user_id, nickname: user.nickname } });
    };

    const handleViewProfile = (user: User) => {
        navigation.navigate('Profile', { user });
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity
                style={styles.item}
                onPress={() => handleViewProfile(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.nickname.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name} {item.surname}</Text>
                    <Text style={styles.nickname}>@{item.nickname}</Text>
                    {item.user_id && (
                        <Text style={styles.userId}>ID: {item.user_id.substring(0, 12)}...</Text>
                    )}
                </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => handleStartChat(item)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.chatButtonText}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => handleViewProfile(item)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.profileButtonText}>👤 Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
                <Text style={styles.title}>🔍 Find Users</Text>
                <Text style={styles.subtitle}>Search by name or nickname</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.searchIcon}>🔎</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Search users..."
                        placeholderTextColor={Colors.MutedText}
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Error Display */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)} style={styles.errorClose}>
                        <Text style={styles.errorCloseText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Results */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.TraceEmerald} />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.user_id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        hasSearched && query.trim().length > 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>😕</Text>
                                <Text style={styles.emptyText}>No users found</Text>
                                <Text style={styles.emptySubtext}>Try searching with a different query</Text>
                            </View>
                        ) : !hasSearched && query.length === 0 ? (
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeIcon}>👋</Text>
                                <Text style={styles.welcomeText}>Start searching for users</Text>
                                <Text style={styles.welcomeSubtext}>Find and connect with people on BlockChat</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Results Count */}
            {results.length > 0 && (
                <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                        Found {results.length} user{results.length !== 1 ? 's' : ''}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.DeepVoid,
    },
    searchHeader: {
        padding: 24,
        paddingBottom: 16,
        backgroundColor: 'transparent',
    },
    title: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.MutedText,
        fontFamily: 'monospace',
    },
    searchContainer: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
        height: 50,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 12,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: Colors.White,
    },
    clearButton: {
        padding: 4,
    },
    clearIcon: {
        fontSize: 16,
        color: Colors.MutedText,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: Colors.DangerRed,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
    },
    errorIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: Colors.DangerRed,
    },
    errorClose: {
        padding: 4,
    },
    errorCloseText: {
        fontSize: 18,
        color: Colors.DangerRed,
        fontWeight: 'bold',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: Colors.TraceEmerald,
        fontFamily: 'monospace',
    },
    listContent: {
        paddingTop: 16,
    },
    itemContainer: {
        ...GlassStyle,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
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
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.White,
        marginBottom: 2,
    },
    nickname: {
        color: Colors.TraceEmerald,
        fontSize: 12,
        marginBottom: 4,
        fontFamily: 'monospace',
    },
    userId: {
        fontSize: 10,
        color: Colors.MutedText,
        fontFamily: 'monospace',
        opacity: 0.7,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    chatButton: {
        flex: 1,
        backgroundColor: Colors.TraceEmerald,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    chatButtonText: {
        color: Colors.DeepVoid,
        fontSize: 14,
        fontWeight: 'bold',
    },
    profileButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.SubtleBorder,
    },
    profileButtonText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.White,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.MutedText,
        textAlign: 'center',
    },
    welcomeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    welcomeIcon: {
        fontSize: 64,
        marginBottom: 24,
        opacity: 0.8,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.White,
        marginBottom: 8,
    },
    welcomeSubtext: {
        fontSize: 16,
        color: Colors.MutedText,
        textAlign: 'center',
    },
    resultsCount: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderTopWidth: 1,
        borderTopColor: Colors.SubtleBorder,
        alignItems: 'center',
    },
    resultsCountText: {
        fontSize: 12,
        color: Colors.TraceEmerald,
        fontFamily: 'monospace',
    },
});

