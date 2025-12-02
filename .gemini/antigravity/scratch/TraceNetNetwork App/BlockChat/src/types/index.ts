export interface User {
    user_id: string;
    nickname: string;
    name: string;
    surname: string;
    birth_date: string;
}

export interface Wallet {
    wallet_id: string;
    public_key: string;
}

export interface RegisterResponse {
    user: User;
    wallet: Wallet;
    mnemonic: string;
    airdrop_tx_id?: string;
    airdrop_amount?: string;
}

export interface UserResponse {
    user: User;
    balance: number;
}

export interface BalanceResponse {
    balance: number;
    public_key: string;
}

export interface RegisterRequest {
    nickname: string;
    name: string;
    surname: string;
    birth_date: string;
}

export type Priority = 'STANDARD' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface TransferRequest {
    from_wallet: string;
    to_wallet: string;
    amount: number;
    priority: Priority;
    sender_public_key: string;
    sender_signature: string;
}

export interface FeeResponse {
    recipient_address: string;
    amount: number;
    priority: Priority;
    recipient_incoming_transfers: number;
    base_tier: string;
    base_rate: number;
    priority_rate: number;
    total_fee: number;
    total_fee_readable: string;
}

export interface TransferResponse {
    tx_id: string;
    fee_readable: string;
}

export interface WalletListResponse {
    wallets: Wallet[];
}

export interface Content {
    content_id: string;
    wallet_id: string;
    content_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PHOTO';
    title: string;
    description: string;
    content_url?: string;
    likes_count: number;
    created_at: string;
    tx_id?: string;
    block_height?: number;
    user?: User; // Optional user information from backend
    nickname?: string; // Fallback if full user not available
}

export interface FeedResponse {
    feed?: Content[]; // Legacy support
    contents?: any[]; // Backend actual response
    total?: number;
    limit?: number;
    offset?: number;
}

export interface FollowersResponse {
    followers: string[];
}

export interface SearchResponse {
    users: User[];
}

export interface SendMessageRequest {
    from_wallet: string;
    to_wallet: string;
    encrypted_message: string;
    sender_public_key: string;
    sender_signature: string;
}

export interface SocialResponse {
    tx_id: string;
}

export interface MessageResponse {
    tx_id: string;
}

export interface RawTransactionRequest {
    raw_tx: string;
}

export interface RawTransactionResponse {
    tx_id: string;
    status: string;
}

export interface ValidatorRegistration {
    wallet_id: string;
    validator_name: string;
    stake_amount: number;
    public_key: string;
    signature: string;
}

export interface ValidatorHeartbeat {
    validator_id: string;
    timestamp: number;
    signature: string;
}

export interface Validator {
    validator_id: string;
    wallet_id: string;
    validator_name: string;
    stake_amount: number;
    is_active: boolean;
    last_heartbeat?: string;
    created_at: string;
}

export interface ValidatorListResponse {
    validators: Validator[];
}

// Encryption and Messaging Privacy Types

export interface EncryptionKeyResponse {
    user_id: string;
    nickname: string;
    wallet_id: string;
    encryption_public_key: string;
    messaging_privacy: 'public' | 'followers' | 'private';
}

export interface MessagingPrivacyRequest {
    privacy: 'public' | 'followers' | 'private';
}

export interface QRCodeResponse {
    qr_data: {
        type: string;
        nickname: string;
        wallet_id: string;
        encryption_public_key: string;
        messaging_privacy: string;
    };
    qr_string: string;
}

export interface EncryptionKeyPair {
    publicKey: string;
    privateKey: string;
}

