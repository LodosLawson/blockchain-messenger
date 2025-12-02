import client from './client';
import { FeedResponse } from '../types';

export const getFeed = async (limit: number = 20): Promise<FeedResponse> => {
    const response = await client.get(`/api/content/feed?limit=${limit}`);
    return response.data;
};

export const createContent = async (
    walletId: string,
    title: string,
    description: string,
    type: string = 'TEXT',
    contentUrl?: string,
    tags: string[] = []
): Promise<any> => {
    const payload: any = {
        wallet_id: walletId,
        title,
        description,
        content_type: type,
        tags
    };

    if (contentUrl) {
        payload.content_url = contentUrl;
    }

    const response = await client.post('/api/content/create', payload);
    return response.data;
};

export const getUserContent = async (walletId: string): Promise<FeedResponse> => {
    const response = await client.get(`/api/content/user/${walletId}`);
    return response.data;
};

export const getContent = async (contentId: string): Promise<any> => {
    const response = await client.get(`/api/content/${contentId}`);
    return response.data;
};
