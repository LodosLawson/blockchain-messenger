import client from './client';
import { SendMessageRequest, MessageResponse } from '../types';

export const sendEncryptedMessage = async (data: SendMessageRequest): Promise<MessageResponse> => {
    const response = await client.post('/api/messaging/send', data);
    return response.data;
};

export const getMessages = async (walletId: string, otherWalletId: string): Promise<any[]> => {
    try {
        // The API only provides an inbox endpoint, so we fetch all and filter.
        const response = await client.get(`/api/messaging/inbox/${walletId}`);
        const allMessages = response.data.messages || [];

        // Filter messages where the other party is either sender or receiver
        return allMessages.filter((msg: any) =>
            (msg.from_wallet === walletId && msg.to_wallet === otherWalletId) ||
            (msg.from_wallet === otherWalletId && msg.to_wallet === walletId)
        ).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch (error) {
        console.error('Failed to fetch messages', error);
        return [];
    }
};

export const getConversations = async (walletId: string): Promise<any[]> => {
    try {
        const response = await client.get(`/api/messaging/inbox/${walletId}`);
        const messages = response.data.messages || [];

        // Group messages by other user's wallet ID
        const conversationsMap = new Map();

        messages.forEach((msg: any) => {
            const otherWalletId = msg.from_wallet === walletId ? msg.to_wallet : msg.from_wallet;

            if (!conversationsMap.has(otherWalletId)) {
                conversationsMap.set(otherWalletId, {
                    user_id: otherWalletId,
                    nickname: 'Unknown', // We might need to fetch user details separately or if provided in msg
                    lastMessage: msg.encrypted_message, // In real app, decrypt here
                    timestamp: msg.created_at || new Date().toISOString(),
                    raw_timestamp: new Date(msg.created_at || Date.now()).getTime()
                });
            } else {
                // Update if this message is newer
                const current = conversationsMap.get(otherWalletId);
                const msgTime = new Date(msg.created_at || Date.now()).getTime();
                if (msgTime > current.raw_timestamp) {
                    current.lastMessage = msg.encrypted_message;
                    current.timestamp = msg.created_at;
                    current.raw_timestamp = msgTime;
                }
            }
        });

        return Array.from(conversationsMap.values()).sort((a, b) => b.raw_timestamp - a.raw_timestamp);
    } catch (error) {
        console.error('Failed to fetch inbox', error);
        return [];
    }
};
