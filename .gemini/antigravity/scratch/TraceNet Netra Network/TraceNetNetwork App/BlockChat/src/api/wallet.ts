import client from './client';
import { BalanceResponse, WalletListResponse } from '../types';

export const getBalance = async (walletId: string): Promise<number> => {
    const response = await client.get<BalanceResponse>(`/rpc/balance/${walletId}`);
    // API returns balance in smallest unit, we might want to format it later or return as is.
    // Based on examples: data.balance / 100000000 is LT.
    return response.data.balance;
};

export const listUserWallets = async (userId: string): Promise<string[]> => {
    const response = await client.get<WalletListResponse>(`/api/wallet/list/${userId}`);
    return response.data.wallets.map(w => w.wallet_id);
};

export const createWallet = async (userId: string): Promise<any> => {
    const response = await client.post('/api/wallet/create', { userId: userId });
    return response.data;
};

export const getWallet = async (walletId: string): Promise<any> => {
    const response = await client.get(`/api/wallet/${walletId}`);
    return response.data;
};
