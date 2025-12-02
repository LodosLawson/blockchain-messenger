import client from './client';
import { SocialResponse, FollowersResponse } from '../types';

export const followUser = async (followerWallet: string, followingWallet: string): Promise<SocialResponse> => {
    const response = await client.post('/api/social/follow', {
        follower_wallet: followerWallet,
        following_wallet: followingWallet,
    });
    return response.data;
};

export const likeContent = async (walletId: string, contentId: string): Promise<SocialResponse> => {
    const response = await client.post('/api/social/like', {
        wallet_id: walletId,
        content_id: contentId,
    });
    return response.data;
};

export const getFollowers = async (walletId: string): Promise<FollowersResponse> => {
    const response = await client.get(`/api/social/followers/${walletId}`);
    return response.data;
};

export const addComment = async (walletId: string, contentId: string, text: string): Promise<SocialResponse> => {
    const response = await client.post('/api/social/comment', {
        wallet_id: walletId,
        content_id: contentId,
        text: text
    });
    return response.data;
};

export const getComments = async (contentId: string): Promise<any[]> => {
    const response = await client.get(`/api/social/comments/${contentId}`);
    return response.data.comments;
};

export const unfollowUser = async (followerWallet: string, followingWallet: string): Promise<SocialResponse> => {
    const response = await client.post('/api/social/unfollow', {
        follower_wallet: followerWallet,
        following_wallet: followingWallet,
    });
    return response.data;
};

export const getLikes = async (contentId: string): Promise<any[]> => {
    const response = await client.get(`/api/social/likes/${contentId}`);
    return response.data.likes;
};

export const getFollowing = async (walletId: string): Promise<string[]> => {
    const response = await client.get(`/api/social/following/${walletId}`);
    return response.data.following;
};
