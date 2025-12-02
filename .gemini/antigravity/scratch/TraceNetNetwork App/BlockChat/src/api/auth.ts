import client from './client';
import { RegisterRequest, RegisterResponse, UserResponse, User } from '../types';

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await client.post<RegisterResponse>('/api/user/create', data);
    return response.data;
};

export const getUser = async (nickname: string): Promise<UserResponse> => {
    const response = await client.get<UserResponse>(`/api/user/nickname/${nickname}`);
    return response.data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
    const response = await client.get(`/api/user/search?q=${query}`);
    return response.data.users;
};

export const getUserById = async (userId: string): Promise<UserResponse> => {
    const response = await client.get<UserResponse>(`/api/user/${userId}`);
    return response.data;
};

export const checkNickname = async (nickname: string): Promise<boolean> => {
    try {
        const response = await client.get(`/api/user/check-nickname/${nickname}`);
        return response.data.available;
    } catch (error) {
        return false;
    }
};

// Encryption Key Management

export const getEncryptionKey = async (identifier: string): Promise<any> => {
    const response = await client.get(`/api/user/encryption-key/${identifier}`);
    return response.data;
};

export const updateMessagingPrivacy = async (userId: string, privacy: 'public' | 'followers' | 'private'): Promise<any> => {
    const response = await client.post(`/api/user/${userId}/messaging-privacy`, { privacy });
    return response.data;
};

export const generateQRCode = async (userId: string): Promise<any> => {
    const response = await client.get(`/api/user/${userId}/qr-code`);
    return response.data;
};

