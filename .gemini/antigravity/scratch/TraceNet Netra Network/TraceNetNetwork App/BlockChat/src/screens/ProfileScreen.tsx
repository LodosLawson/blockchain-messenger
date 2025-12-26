import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFollowers, followUser, unfollowUser } from '../api/social';
import { getUser } from '../api/auth';
import { User } from '../types';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProfileRouteProp = RouteProp<{ Profile: { user?: User; nickname?: string; wallet_id?: string } }, 'Profile'>;

export default function ProfileScreen() {
    const { user: loggedInUser, wallet, mnemonic } = useAuth();
    const route = useRoute<ProfileRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    // Only default to loggedInUser if no route params at all
    const initialUser = route.params?.user || (route.params?.nickname ? null : loggedInUser);
    const [userToShow, setUserToShow] = useState<User | null>(initialUser);
    const [loading, setLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState<number | null>(null);
    const [walletIdForProfile, setWalletIdForProfile] = useState<string | null>(route.params?.wallet_id || null);
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = userToShow?.user_id === loggedInUser?.user_id;

    // Fetch user data if only nickname is provided
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userToShow && route.params?.nickname) {
                setLoading(true);
                try {
                    const userData = await getUser(route.params.nickname);
                    setUserToShow(userData.user);
                    setWalletIdForProfile(route.params.wallet_id || null);
                } catch (error) {
                    console.error('Failed to fetch user', error);
                    Alert.alert('Error', 'User not found');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUserData();
    }, [route.params?.nickname]);

    const fetchFollowers = async () => {
        if (walletIdForProfile || wallet) {
            setLoading(true);
            try {
                const targetWallet = isOwnProfile ? wallet!.wallet_id : walletIdForProfile;
                if (targetWallet) {
                    const response = await getFollowers(targetWallet);
                    setFollowersCount(response.followers.length);

                    // Check if I am following this user
                    if (!isOwnProfile && wallet) {
                        setIsFollowing(response.followers.includes(wallet.wallet_id));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch followers', error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (userToShow) {
            fetchFollowers();
        }
    }, [userToShow]);

    const handleToggleFollow = async () => {
        if (!wallet || !walletIdForProfile || !mnemonic) {
            Alert.alert('Error', 'Unable to perform action');
            return;
        }
        try {
            if (isFollowing) {
                await unfollowUser(mnemonic, wallet.wallet_id, walletIdForProfile);
                Alert.alert('Success', 'Unfollowed user');
            } else {
                await followUser(mnemonic, wallet.wallet_id, walletIdForProfile);
                Alert.alert('Success', 'Followed user!');
            }
            fetchFollowers();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update follow status');
        }
    };

    if (loading && !userToShow) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!userToShow) {
        return (
            <View style={styles.container}>
                <Text>User not found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>{userToShow.nickname.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{userToShow.name} {userToShow.surname}</Text>
                <Text style={styles.nicknameText}>@{userToShow.nickname}</Text>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    {loading ? <ActivityIndicator /> : <Text style={styles.statValue}>{followersCount !== null ? followersCount : '-'}</Text>}
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>-</Text>
                    <Text style={styles.statLabel}>Following</Text>
                </View>
            </View>

            {!isOwnProfile && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.followButton, isFollowing && styles.unfollowButton]}
                        onPress={handleToggleFollow}
                    >
                        <Text style={styles.followButtonText}>
                            {isFollowing ? '➖ Unfollow' : '➕ Follow'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => navigation.navigate('Chat', { user: userToShow })}
                    >
                        <Text style={styles.messageButtonText}>💬 Message</Text>
                    </TouchableOpacity>
                </View>
            )}

            {isOwnProfile && (
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Wallet ID:</Text>
                    <Text style={{ ...styles.infoValue, marginBottom: 15 }}>{wallet?.wallet_id}</Text>

                    <Button
                        title="🔧 Open Debug Menu"
                        onPress={() => navigation.navigate('Debug' as any)}
                        color="#666"
                    />
                </View>
            )}
        </View>
    );
}

import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';

// ... (logic)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: Colors.DeepVoid,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        ...GlassStyle,
        padding: 24,
        marginHorizontal: 4,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.DeepVoid,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: Colors.TraceEmerald,
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    avatarLargeText: {
        color: Colors.TraceEmerald,
        fontSize: 48,
        fontWeight: 'bold',
    },
    name: {
        ...Typography.H1,
        color: Colors.White,
        marginBottom: 4,
    },
    nicknameText: {
        color: Colors.TraceEmerald,
        fontSize: 16,
        fontFamily: 'monospace',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 30,
        paddingVertical: 15,
        ...GlassStyle,
        marginHorizontal: 4,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.White,
        fontFamily: 'monospace',
    },
    statLabel: {
        color: Colors.MutedText,
        fontSize: 12,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4, // Aligned with margins
        gap: 15,
    },
    followButton: {
        flex: 1,
        backgroundColor: Colors.TraceEmerald,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
    },
    unfollowButton: {
        backgroundColor: 'transparent',
        borderColor: Colors.MutedText,
    },
    followButtonText: {
        color: Colors.DeepVoid, // Contrast on Emerald
        fontWeight: 'bold',
        fontSize: 15,
    },
    messageButton: {
        flex: 1,
        backgroundColor: 'rgba(52, 211, 153, 0.1)', // Tint
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.MintGlitch,
    },
    messageButtonText: {
        color: Colors.MintGlitch,
        fontWeight: 'bold',
        fontSize: 15,
    },
    infoContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: 'transparent',
        ...GlassStyle,
    },
    infoLabel: {
        color: Colors.MutedText,
        marginBottom: 8,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: Colors.TraceEmerald,
        marginBottom: 15,
    },
});
