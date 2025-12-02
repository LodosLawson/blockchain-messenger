import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getConversations } from '../api/messaging';
import { Toast } from '../components/Toast';

interface NotificationContextType {
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { wallet } = useAuth();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '',
        type: 'info',
        visible: false,
    });
    const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now());

    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type, visible: true });
    };

    const hideNotification = () => {
        setToast(prev => ({ ...prev, visible: false }));
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

                for (const conv of conversations) {
                    if (conv.raw_timestamp > lastMessageTime) {
                        hasNew = true;
                        sender = conv.nickname || 'Someone';
                        setLastMessageTime(conv.raw_timestamp);
                        break; // Notify only once per poll cycle to avoid spam
                    }
                }

                if (hasNew) {
                    showNotification(`New message from ${sender}`, 'info');
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
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideNotification}
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
