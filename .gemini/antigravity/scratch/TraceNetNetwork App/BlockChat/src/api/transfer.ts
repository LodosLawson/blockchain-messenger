import client from './client';
import { FeeResponse, Priority, TransferRequest, TransferResponse } from '../types';

export const calculateTransferFee = async (
    recipientAddress: string,
    amount: number,
    priority: Priority
): Promise<FeeResponse> => {
    const response = await client.post<FeeResponse>('/rpc/calculateTransferFee', {
        recipient_address: recipientAddress,
        amount,
        priority,
    });
    return response.data;
};

export const transfer = async (data: TransferRequest): Promise<TransferResponse> => {
    const response = await client.post<TransferResponse>('/rpc/transfer', data);
    return response.data;
};
