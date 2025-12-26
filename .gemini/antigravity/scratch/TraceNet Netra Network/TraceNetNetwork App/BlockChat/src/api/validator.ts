import client from './client';
import { Validator, ValidatorListResponse, ValidatorRegistration, ValidatorHeartbeat } from '../types';

export const registerValidator = async (data: ValidatorRegistration): Promise<any> => {
    const response = await client.post('/api/validator/register', data);
    return response.data;
};

export const registerValidatorWallet = async (validatorId: string, walletAddress: string): Promise<any> => {
    const response = await client.post(`/api/validator/${validatorId}/wallet`, {
        wallet_address: walletAddress
    });
    return response.data;
};

export const getValidatorWallet = async (validatorId: string): Promise<any> => {
    const response = await client.get(`/api/validator/${validatorId}/wallet`);
    return response.data;
};

export const sendHeartbeat = async (data: ValidatorHeartbeat): Promise<any> => {
    const response = await client.post('/api/validator/heartbeat', data);
    return response.data;
};

export const getValidators = async (online: boolean = false): Promise<ValidatorListResponse> => {
    const url = online ? '/api/validator/list?online=true' : '/api/validator/list';
    const response = await client.get<ValidatorListResponse>(url);
    return response.data;
};
