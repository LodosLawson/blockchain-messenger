import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getConversations } from '../api/messaging';
import { InAppNotification } from '../components/InAppNotification';
import { useNavigation } from '@react-navigation/native';

interface NotificationContextType {
    showNotification: (sender: string, message: string, senderId?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { wallet } = useAuth();
    const navigation = useNavigation<any>(); // Get main navigation

    const [notification, setNotification] = useState({
        visible: false,
        senderName: '',
        message: '',
        senderId: ''
    });

    const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());
    const [lastNotifiedMessageId, setLastNotifiedMessageId] = useState<string>('');

    const showNotification = (sender: string, message: string, senderId?: string) => {
        setNotification({
            visible: true,
            senderName: sender,
            message: message,
            senderId: senderId || ''
        });
    };

    const hideNotification = () => {
        setNotification(prev => ({ ...prev, visible: false }));
    };

    const handleReply = () => {
        if (notification.senderId && navigation) {
            // Construct a basic user object for navigation
            const targetUser = {
                user_id: notification.senderId,
                nickname: notification.senderName,
                // Add other placeholders if needed by ChatScreen types
            };
            navigation.navigate('Chat', { user: targetUser });
        }
        hideNotification();
    };

    // Poll for new messages
    useEffect(() => {
        if (!wallet) return;

        const checkMessages = async () => {
            try {
                const conversations = await getConversations(wallet.wallet_id);
                // Check if any conversation has a message newer than last check
                let hasNew = false;
                let sender = '';
                let msgPreview = '';
                let senderId = '';

                for (const conv of conversations) {
                    // Only notify if:
                    // 1. It's newer than last check OR it's a new ID that we haven't notified for (timestamp might be unreliable across devices/blockchain)
                    // 2. It wasn't sent by me
                    // 3. AND we haven't already notified for this specific message ID

                    const isNewTime = conv.raw_timestamp > lastMessageTime;
                    const isNewId = conv.lastMessageId && conv.lastMessageId !== lastNotifiedMessageId;

                    if ((isNewTime || isNewId) && !conv.lastMessageIsMine) {
                        // Double check we haven't notified this ID recently
                        if (conv.lastMessageId === lastNotifiedMessageId) continue;

                        hasNew = true;
                        sender = conv.nickname || 'Bilinmeyen Kullanıcı';
                        msgPreview = conv.lastMessage || 'Yeni Mesaj';
                        senderId = conv.user_id;

                        setLastMessageTime(conv.raw_timestamp);
                        if (conv.lastMessageId) setLastNotifiedMessageId(conv.lastMessageId);

                        break; // Notify only once per poll cycle
                    }
                }

                if (hasNew) {
                    showNotification(sender, msgPreview, senderId);
                }
            } catch (error) {
                console.error('Notification poll error:', error);
            }
        };

        const interval = setInterval(checkMessages, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [wallet, lastMessageTime]);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <InAppNotification
                visible={notification.visible}
                senderName={notification.senderName}
                message={notification.message}
                senderId={notification.senderId}
                onClose={hideNotification}
                onReply={handleReply}
            />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
