import client from './client';
import { SendMessageRequest, MessageResponse } from '../types';
import { getTransaction, getNetworkStatus, getBlock } from './blockchain';

export const sendEncryptedMessage = async (transaction: any): Promise<MessageResponse> => {
    // Expects a fully signed transaction object
    // Use /rpc/sendRawTx endpoint (same as syncEncryptionKey)
    console.log('📡 API: Sending message via /rpc/sendRawTx');

    try {
        // First try the /rpc/sendRawTx endpoint (correct blockchain format)
        // Send transaction object directly, NOT wrapped in raw_tx
        const response = await client.post('/rpc/sendRawTx', transaction);

        console.log('✅ API Response:', JSON.stringify(response.data));
        return response.data;
    } catch (rpcError: any) {
        console.error('❌ /rpc/sendRawTx failed:', rpcError.response?.status, rpcError.response?.data);

        throw new Error(
            rpcError.response?.data?.message ||
            rpcError.response?.data?.error ||
            'Mesaj gönderilemedi'
        );
    }
};

const normalizeMessage = (msg: any) => {
    // Normalize payload data to top level if it exists
    let content = msg.encrypted_message || msg.message || '';
    let senderKey = msg.sender_encryption_key;
    let recipientKey = msg.recipient_encryption_key;

    // Normalize Wallet IDs (Some endpoints might use sender/recipient/from/to)
    const from_wallet = msg.from_wallet || msg.sender || msg.from;
    const to_wallet = msg.to_wallet || msg.recipient || msg.to;

    if (msg.payload) {
        // If payload is a string, try to parse it (some backends might store it as JSON string)
        let payload = msg.payload;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                // Keep as is
            }
        }

        if (typeof payload === 'object') {
            content = payload.encrypted_message || payload.message || content;
            senderKey = payload.sender_encryption_key || senderKey;
            recipientKey = payload.recipient_encryption_key || recipientKey;
        }
    }

    if (!content) {
        // Only log if we expected content (e.g. it has a sender key implying it's a message)
        if (msg.sender_encryption_key || msg.type === 'MESSAGE' || msg.type === 'PRIVATE_MESSAGE') {
            // console.log('🚨 NORMALIZATION INFO - No content found (might be metadata-only or system tx):', msg.tx_id);
        }
    }

    return {
        ...msg,
        from_wallet,
        to_wallet,
        encrypted_message: content,
        sender_encryption_key: senderKey,
        recipient_encryption_key: recipientKey,
        // Normalize timestamp: API uses created_at (ISO), Blockchain uses timestamp (number)
        timestamp: msg.timestamp || (msg.created_at ? new Date(msg.created_at).getTime() : Date.now())
    };
};

export const getMessages = async (walletId: string, otherWalletId: string): Promise<any[]> => {
    try {
        // The API only provides an inbox endpoint, so we fetch all and filter.
        const response = await client.get(`/api/messaging/inbox/${walletId}`);
        const inboxMessages = response.data.messages || [];

        // --- NEW: FETCH SENT MESSAGES via Blockchain Scan ---
        // Since API doesn't have /sent endpoint, we scan blocks.
        // This is feasible because chain is short. For production, requires indexing middleware.
        let sentMessages: any[] = [];
        try {
            const status = await getNetworkStatus();
            if (status.blockHeight > 0) {
                // Determine scan range. If chain is HUGE, we might limit this.
                // But for now (Height ~8), scan all.
                const scanPromises = [];
                for (let i = 1; i <= status.blockHeight; i++) {
                    scanPromises.push(getBlock(i));
                }
                const blocks = await Promise.all(scanPromises);

                blocks.forEach(block => {
                    if (block && block.transactions) {
                        block.transactions.forEach((tx: any) => {
                            // Check if SENT by me
                            // Using sender_wallet/from_wallet
                            const sender = tx.from_wallet || tx.sender;

                            // 1. Must be from me
                            // 2. Must be explicit message (type MESSAGE or has encrypted_message/message payload)
                            // 3. AND must NOT be to myself (because inbox handles that)
                            //    Actually, duplicated self-messages are handled by dedup below
                            if (sender === walletId) {
                                let isMessage = false;
                                if (tx.type === 'MESSAGE') isMessage = true;
                                if (tx.payload && (tx.payload.encrypted_message || tx.payload.message)) isMessage = true;

                                if (isMessage) {
                                    sentMessages.push(tx);
                                }
                            }
                        });
                    }
                });
            }
        } catch (scanErr) {
            console.warn('Blockchain scan for sent messages failed:', scanErr);
        }

        const allMessages = [...inboxMessages, ...sentMessages];

        // Deduplicate by tx_id AND content signature
        // Sometimes tx_id might be missing or different, but content/timestamp is same
        const uniqueMessagesMap = new Map();

        allMessages.forEach(m => {
            // Key 1: TX ID (Strongest)
            if (m.tx_id) {
                if (!uniqueMessagesMap.has(m.tx_id)) {
                    uniqueMessagesMap.set(m.tx_id, m);
                }
                return;
            }

            // Key 2: Signature (Timestamp + First 10 chars of encrypted content)
            // This catches cases where same message is in inbox and sent scan but one lacks tx_id
            const signature = `${m.timestamp}_${(m.encrypted_message || m.message || '').substring(0, 20)}`;
            if (!uniqueMessagesMap.has(signature)) {
                uniqueMessagesMap.set(signature, m);
            }
        });

        const uniqueMessages = Array.from(uniqueMessagesMap.values());

        console.log(`📥 API Inbox: ${inboxMessages.length}, 📤 Scanned Sent: ${sentMessages.length}, Total Unique: ${uniqueMessages.length}`);

        if (uniqueMessages.length > 0) {
            console.log('🔍 RAW MESSAGE SAMPLE (First 3):', JSON.stringify(uniqueMessages.slice(0, 3), null, 2));
        }

        // Hydrate and Normalize based on UNIQUE set
        const hydratedMessages = await Promise.all(uniqueMessages.map(async (rawMsg: any) => {
            let normalized = normalizeMessage(rawMsg);

            if (!normalized.encrypted_message && rawMsg.tx_id) {
                // Try to hydrate from node
                try {
                    const txDetails = await getTransaction(rawMsg.tx_id);
                    if (txDetails) {
                        // Check payload in txDetails
                        let payload = txDetails.payload;
                        if (typeof payload === 'string') {
                            try { payload = JSON.parse(payload); } catch (e) { }
                        }

                        // If we found content, merge it
                        if (payload && (payload.encrypted_message || payload.message)) {
                            console.log(`💧 Hydrated msg ${rawMsg.tx_id} from blockchain node!`);
                            const merged = {
                                ...rawMsg,
                                payload: { ...rawMsg.payload, ...payload },
                                sender_encryption_key: payload.sender_encryption_key || rawMsg.sender_encryption_key
                            };
                            normalized = normalizeMessage(merged);
                        }
                    }
                } catch (e) {
                    // Ignore hydration errors
                }
            }
            return normalized;
        }));

        // Filter messages where the other party is either sender or receiver
        const filtered = hydratedMessages
            .filter((msg: any) => {
                const wId = walletId.toLowerCase();
                const oId = otherWalletId.toLowerCase();
                const from = (msg.from_wallet || '').toLowerCase();
                const to = (msg.to_wallet || '').toLowerCase();

                // Fix: API might not return 'to_wallet' for incoming inbox messages (implicit)
                const effectiveTo = to || wId;

                const isMatch = (from === wId && effectiveTo === oId) ||
                    (from === oId && effectiveTo === wId);

                // Filter out messages with NO content (ghost/malformed/metadata-only)
                const hasContent = !!msg.encrypted_message || (msg.message && msg.message.trim().length > 0);

                if (!isMatch || !hasContent) {
                    console.log(`🗑️ Rejected Msg ${msg.tx_id?.slice(0, 5)}: Match=${isMatch}, Content=${hasContent}, From=${from}, To=${effectiveTo}`);
                }

                return isMatch && hasContent;
            })
            .sort((a: any, b: any) => a.timestamp - b.timestamp);

        console.log(`✅ Filtered Messages: ${filtered.length} relevant to conversation.`);
        return filtered;
    } catch (error) {
        console.error('Failed to fetch messages', error);
        return [];
    }
};

export const getConversations = async (walletId: string): Promise<any[]> => {
    try {
        const response = await client.get(`/api/messaging/inbox/${walletId}`);
        let inboxMessages = response.data.messages || [];

        // Scan for Sent Messages to include conversations where I sent first
        let sentMessages: any[] = [];
        try {
            // Lazy import to avoid circular dependency issues if any
            const { getNetworkStatus, getBlock } = require('./blockchain');
            const status = await getNetworkStatus();
            if (status.blockHeight > 0) {
                const scanPromises = [];
                // optimize: scan last 100 blocks or full chain if small (currently small)
                for (let i = 1; i <= status.blockHeight; i++) {
                    scanPromises.push(getBlock(i));
                }
                const blocks = await Promise.all(scanPromises);

                blocks.forEach(block => {
                    if (block && block.transactions) {
                        block.transactions.forEach((tx: any) => {
                            const sender = tx.from_wallet || tx.sender;
                            if (sender === walletId) {
                                let isMessage = false;
                                if (tx.type === 'MESSAGE') isMessage = true;
                                if (tx.payload && (tx.payload.encrypted_message || tx.payload.message)) isMessage = true;

                                if (isMessage) {
                                    sentMessages.push(tx);
                                }
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('Conversations: Sent scan failed', e);
        }

        const allMessages = [...inboxMessages, ...sentMessages];

        // Map normalization
        const normalizedMessages = allMessages.map(normalizeMessage);

        // Group messages by other user's wallet ID
        const conversationsMap = new Map();
        const myWalletLower = walletId.toLowerCase();

        normalizedMessages.forEach((msg: any) => {
            const msgFrom = (msg.from_wallet || '').toLowerCase();
            const msgTo = (msg.to_wallet || '').toLowerCase();

            const isMine = msgFrom === myWalletLower;
            // If isMine, the other person is 'to'. If not mine, the other person is 'from'.
            // USE THE ORIGINAL CASED VALUE for display if possible, but map key must be canonical (lower)
            const otherWalletIdRaw = isMine ? msg.to_wallet : msg.from_wallet;
            const otherWalletIdKey = otherWalletIdRaw ? otherWalletIdRaw.toLowerCase() : 'unknown';

            if (!conversationsMap.has(otherWalletIdKey)) {
                conversationsMap.set(otherWalletIdKey, {
                    user_id: otherWalletIdRaw || otherWalletIdKey, // Keep original casing for UI if available
                    nickname: '', // Empty nickname implies we don't know it yet, prompting fallback to wallet ID
                    lastMessage: msg.encrypted_message,
                    timestamp: msg.created_at || new Date().toISOString(),
                    raw_timestamp: new Date(msg.created_at || Date.now()).getTime(),
                    sender_encryption_key: !isMine ? msg.sender_encryption_key : undefined, // Store key to help list decryption
                    lastMessageIsMine: isMine,
                    lastMessageId: msg.tx_id || msg.id // Capture unique ID
                });
            } else {
                // Update if this message is newer
                const current = conversationsMap.get(otherWalletIdKey);
                const msgTime = new Date(msg.created_at || Date.now()).getTime();
                if (msgTime > current.raw_timestamp) {
                    current.lastMessage = msg.encrypted_message;
                    current.timestamp = msg.created_at;
                    current.raw_timestamp = msgTime;
                    current.lastMessageIsMine = isMine;
                    current.lastMessageId = msg.tx_id || msg.id; // Update ID
                    if (!isMine && msg.sender_encryption_key) {
                        current.sender_encryption_key = msg.sender_encryption_key;
                    }
                }
            }
        });

        // Resolve generic/unknown profiles
        const conversations = Array.from(conversationsMap.values());

        // We need to fetch profiles for these users to get nicknames
        // We'll do it in parallel for performance
        const enrichedConversations = await Promise.all(conversations.map(async (conv) => {
            if (!conv.user_id || conv.user_id.includes('Unknown')) return conv;

            try {
                // We use require here to avoid circular dependency loop if auth imports messaging
                const { getUserById, getUser } = require('./auth');

                // Try getting by ID (which is wallet_id here)
                let userProfile = null;
                try {
                    const res = await getUserById(conv.user_id);
                    if (res && res.user) userProfile = res.user;
                } catch (e) { /* ignore */ }

                if (!userProfile) {
                    try {
                        const res = await getUser(conv.user_id);
                        if (res) userProfile = res;
                    } catch (e) { /* ignore */ }
                }

                if (userProfile) {
                    return {
                        ...conv,
                        nickname: userProfile.nickname || conv.nickname,
                        profile_image: userProfile.profile_image || conv.profile_image,
                        // Update the ID to the cleanest one available? 
                        // Actually keep the wallet ID as the key reference.
                    };
                }
            } catch (err) {
                console.warn('Failed to enrich conversation profile for', conv.user_id);
            }
            return conv;
        }));

        return enrichedConversations.sort((a, b) => b.raw_timestamp - a.raw_timestamp);
    } catch (error) {
        console.error('Failed to fetch inbox', error);
        return [];
    }
};
