import client from './client';

export interface NetworkStatus {
    blockHeight: number;
    totalCoins: number;
    activeValidators: number;
    status: 'online' | 'offline';
}

export const getNetworkStatus = async (): Promise<NetworkStatus> => {
    try {
        const response = await client.get('/rpc/status');
        const data = response.data;
        return {
            blockHeight: data.blockchain?.blockCount || 0,
            totalCoins: data.blockchain?.totalDistributedCoins || 0,
            activeValidators: data.validators?.onlineValidators || 0,
            status: 'online'
        };
    } catch (error) {
        console.warn('Failed to fetch network status, defaulting to offline.', error);
        return {
            blockHeight: 0,
            totalCoins: 0,
            activeValidators: 0,
            status: 'offline'
        };
    }
};

export const getBlock = async (blockHeight: number): Promise<any> => {
    try {
        const response = await client.get(`/rpc/block/${blockHeight}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch block', error);
        return null;
    }
};

export const getTransaction = async (txId: string): Promise<any> => {
    try {
        const response = await client.get(`/rpc/transaction/${txId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch transaction', error);
        return null;
    }
};

export const getAccounts = async (): Promise<any[]> => {
    try {
        const response = await client.get('/rpc/accounts');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch accounts', error);
        return [];
    }
};

export const sendRawTransaction = async (rawTx: string): Promise<any> => {
    try {
        const response = await client.post('/rpc/sendRawTx', { raw_tx: rawTx });
        return response.data;
    } catch (error) {
        console.error('Failed to send raw transaction', error);
        throw error;
    }
};
