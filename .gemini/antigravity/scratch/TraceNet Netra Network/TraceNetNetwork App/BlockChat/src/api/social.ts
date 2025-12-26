import client from './client';
import { SocialResponse, FollowersResponse } from '../types';
import { deriveSigningKeyPair, signData } from '../utils/signing';
// @ts-ignore
import crypto from 'crypto';

// Helper to construct and send a signed transaction
const sendSocialTransaction = async (
    mnemonic: string,
    fromWalletId: string,
    type: 'FOLLOW' | 'UNFOLLOW' | 'LIKE' | 'COMMENT',
    payload: any,
    fee: number = 0
): Promise<any> => {
    try {
        // 1. Derive Keys
        const keys = deriveSigningKeyPair(mnemonic);
        // const walletAddress = keys.publicKey; // REMOVED: Using passed ID

        // 2. Construct Transaction Data
        const timestamp = Date.now();

        // Deterministic ID generation (simpler version for client)
        // sender + type + timestamp
        const txDataForId = `${fromWalletId}${type}${timestamp}`;
        const tx_id = crypto.createHash('sha256').update(txDataForId).digest('hex');

        const transactionData = {
            tx_id,
            from_wallet: fromWalletId,
            to_wallet: payload.target_wallet_id || payload.content_id || fromWalletId, // Meaning depends on type
            type: type,
            amount: 0,
            fee: fee,
            timestamp: timestamp,
            payload: {
                ...payload,
                timestamp // Ensure payload matches outer timestamp
            }
        };

        // 3. Sign
        const signableString = JSON.stringify(transactionData);
        const signature = signData(signableString, keys.privateKey);

        // 4. Final Object
        const finalTransaction = {
            ...transactionData,
            sender_public_key: keys.publicKey,
            sender_signature: signature
        };

        // 5. Send
        console.log(`Sending Social TX (${type}):`, JSON.stringify(finalTransaction, null, 2));
        const response = await client.post('/rpc/sendRawTx', finalTransaction);
        console.log(`Social TX Success (${type}):`, response.data);
        return response.data;

    } catch (error: any) {
        console.error(`Social Transaction Failed (${type}):`, error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Server Data:', JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(error.response?.data?.message || `Failed to ${type}: ${error.message}`);
    }
};

export const followUser = async (mnemonic: string, fromWalletId: string, targetWallet: string): Promise<SocialResponse> => {
    return sendSocialTransaction(mnemonic, fromWalletId, 'FOLLOW', {
        action_type: 'FOLLOW',
        target_wallet_id: targetWallet
    }, 0);
};

export const unfollowUser = async (mnemonic: string, fromWalletId: string, targetWallet: string): Promise<SocialResponse> => {
    return sendSocialTransaction(mnemonic, fromWalletId, 'UNFOLLOW', {
        action_type: 'UNFOLLOW',
        target_wallet_id: targetWallet
    }, 0);
};

export const likeContent = async (mnemonic: string, fromWalletId: string, contentId: string, targetWalletId: string): Promise<SocialResponse> => {
    return sendSocialTransaction(mnemonic, fromWalletId, 'LIKE', {
        action_type: 'LIKE',
        content_id: contentId,
        target_content_id: contentId,
        target_wallet_id: targetWalletId // Pass to payload/helper
    }, 0.00002);
};

export const addComment = async (mnemonic: string, fromWalletId: string, contentId: string, text: string, parentCommentId?: string, targetWalletId?: string): Promise<SocialResponse> => {
    // Generate potential comment ID client side or let server handle it? 
    // Protocol doc suggests client can generate.
    const commentId = crypto.createHash('sha256').update(text + Date.now()).digest('hex');

    const payload: any = {
        action_type: 'COMMENT',
        comment_id: commentId,
        content_id: contentId,
        target_content_id: contentId,
        comment_text: text,
        target_wallet_id: targetWalletId // Pass to payload/helper
    };

    if (parentCommentId) {
        payload.parent_comment_id = parentCommentId;
    }

    return sendSocialTransaction(mnemonic, fromWalletId, 'COMMENT', payload, 0.00002);
};

// --- Read-Only calls remain standard GET requests ---

export const getFollowers = async (walletId: string): Promise<FollowersResponse> => {
    const response = await client.get(`/api/social/followers/${walletId}`);
    return response.data;
};

export const getFollowing = async (walletId: string): Promise<string[]> => {
    const response = await client.get(`/api/social/following/${walletId}`);
    return response.data.following;
};

export const getComments = async (contentId: string): Promise<any[]> => {
    const response = await client.get(`/api/social/comments/${contentId}`);
    return response.data.comments;
};

export const getLikes = async (contentId: string): Promise<any[]> => {
    const response = await client.get(`/api/social/likes/${contentId}`);
    return response.data.likes;
};
