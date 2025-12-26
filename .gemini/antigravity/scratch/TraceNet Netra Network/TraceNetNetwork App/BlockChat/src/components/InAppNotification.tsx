import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Colors, GlassStyle, Typography } from '../theme/NetraTheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { User } from '../types';

interface InAppNotificationProps {
    visible: boolean;
    senderName: string;
    message: string;
    senderId?: string; // Needed for navigation/avatar
    onClose: () => void;
    onReply: () => void;
}

const { width } = Dimensions.get('window');

export const InAppNotification: React.FC<InAppNotificationProps> = ({
    visible,
    senderName,
    message,
    senderId,
    onClose,
    onReply
}) => {
    const slideAnim = useRef(new Animated.Value(-100)).current; // Start off-screen top

    useEffect(() => {
        if (visible) {
            // Slide In
            Animated.spring(slideAnim, {
                toValue: 50, // Top margin (below status bar)
                useNativeDriver: true,
                speed: 12,
                bounciness: 8,
            }).start();

            // Auto-hide after 5 seconds if not interacted
            const timer = setTimeout(() => {
                handleClose();
            }, 6000); // slightly longer for reading

            return () => clearTimeout(timer);
        } else {
            handleClose();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            if (visible) onClose(); // Only trigger onClose if it was visible
        });
    };

    const handleReply = () => {
        handleClose();
        onReply();
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{senderName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.content}>
                        <Text style={styles.sender}>{senderName}</Text>
                        <Text style={styles.message} numberOfLines={2}>{message}</Text>
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Text style={styles.closeText}>Kapat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.replyBtn} onPress={handleReply}>
                        <Text style={styles.replyText}>Cevapla</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
    },
    card: {
        width: width - 32,
        backgroundColor: Colors.DeepVoid,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.TraceEmerald,
        shadowColor: Colors.TraceEmerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        padding: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
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
    avatarText: {
        color: Colors.TraceEmerald,
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    sender: {
        color: Colors.TraceEmerald,
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    message: {
        color: Colors.White,
        fontSize: 13,
        opacity: 0.9,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: Colors.SubtleBorder,
        paddingTop: 8,
    },
    closeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginRight: 8,
    },
    closeText: {
        color: Colors.MutedText,
        fontSize: 13,
        fontWeight: '600',
    },
    replyBtn: {
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    replyText: {
        color: Colors.TraceEmerald,
        fontSize: 13,
        fontWeight: 'bold',
    },
});
