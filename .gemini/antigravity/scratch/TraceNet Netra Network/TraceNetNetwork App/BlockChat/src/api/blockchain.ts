import client from './client';

export interface NetworkStatus {
    blockHeight: number;
    totalCoins: number;
    activeValidators: number;
    status: 'online' | 'offline';
}

export interface TransferFeeRequest {
    recipient_address: string;
    amount: number;
    priority?: 'LOW' | 'STANDARD' | 'HIGH';
}

export interface TransferFeeResponse {
    base_fee: number;
    priority_fee: number;
    total_fee: number;
    total_fee_readable: string;
}

export interface SendTransferRequest {
    from_wallet: string;
    to_wallet: string;
    amount: number;
    sender_public_key: string;
    sender_signature: string;
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
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            // Block not found yet (race condition or future block), ignore silently
            return null;
        } else {
            console.error('Failed to fetch block', error);
        }
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

export const calculateTransferFee = async (request: TransferFeeRequest): Promise<TransferFeeResponse> => {
    try {
        const response = await client.post<TransferFeeResponse>('/rpc/calculateTransferFee', request);
        return response.data;
    } catch (error) {
        console.error('Failed to calculate transfer fee', error);
        throw error;
    }
};

export const sendTransfer = async (request: SendTransferRequest): Promise<any> => {
    try {
        const response = await client.post('/rpc/transfer', request);
        return response.data;
    } catch (error) {
        console.error('Failed to send transfer', error);
        throw error;
    }
};

export const sendRawTransaction = async (transaction: any): Promise<any> => {
    try {
        // Expects transaction object directly, matching backend requirement
        const response = await client.post('/rpc/sendRawTx', transaction);
        return response.data;
    } catch (error) {
        console.error('Failed to send raw transaction', error);
        throw error;
    }
};
