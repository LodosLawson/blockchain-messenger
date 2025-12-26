import { Buffer } from 'buffer';
import crypto from 'crypto';
import client from './client';
import { RegisterRequest, RegisterResponse, UserResponse, User } from '../types';
import { deriveSigningKeyPair, signData } from '../utils/signing';
import { deriveEncryptionKeyFromMnemonic } from '../utils/encryption';

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await client.post<RegisterResponse>('/api/user/create', data);
    return response.data;
};

export const getUser = async (nickname: string): Promise<UserResponse> => {
    const response = await client.get<UserResponse>(`/api/user/nickname/${nickname}`);
    return response.data;
};

// Search users from blockchain directly
const searchUsersFromBlockchain = async (query: string): Promise<User[]> => {
    try {


        // Get blockchain status to know how many blocks to scan
        const statusResponse = await client.get('/rpc/status');


        const users: User[] = [];
        const userMap = new Map<string, User>(); // Prevent duplicates
        const lowerQuery = query.toLowerCase();

        // Scan recent blocks (last 200 to catch more users)


        for (let i = blockCount; i >= startBlock; i--) {
            try {
                const blockResponse = await client.get(`/rpc/block/${i}`);
                const block = blockResponse.data.block || blockResponse.data;

                if (block && block.transactions) {
                    for (const tx of block.transactions) {
                        // Look for PROFILE_UPDATE with USER_CREATED action
                        if (tx.type === 'PROFILE_UPDATE' && tx.payload?.action === 'USER_CREATED') {
                            const nickname = tx.payload.nickname || '';
                            const userId = tx.from_wallet || tx.to_wallet || '';

                            // Check if matches search query
                            if (nickname.toLowerCase().includes(lowerQuery)) {
                                if (!userMap.has(userId)) {
                                    const user: User = {
                                        user_id: userId,
                                        nickname: nickname,
                                        name: nickname, // Use nickname as name if not available
                                        surname: '',
                                        email: '',
                                    };


                                }
                            }
                        }
                    }
                }
            } catch (err) {
                // Skip blocks that fail
                continue;
            }
        }



    } catch (error: any) {
        if (process.env.NODE_ENV === 'development') console.error('Blockchain search error:', error.message);
        return [];
    }
};

export const searchUsers = async (query: string): Promise<User[]> => {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `/api/user/search?q=${encodedQuery}`;

        const response = await client.get(url);

        return response.data.users || [];
    } catch (error: any) {



        return await searchUsersFromBlockchain(query);
    }
};

// Simple in-memory cache for user profiles
const userProfileCache = new Map<string, UserResponse>();

export const getUserById = async (userId: string): Promise<UserResponse> => {
    // 1. Check Cache
    if (userProfileCache.has(userId)) {
        return userProfileCache.get(userId)!;
    }

    try {
        // 2. Fetch from API
        const response = await client.get<UserResponse>(`/api/user/${userId}`);

        // 3. Update Cache
        if (response.data) {
            userProfileCache.set(userId, response.data);
        }
        return response.data;
    } catch (error: any) {
        // console.warn(`Failed to fetch user ${userId}, falling back to wallet ID.`);

        // 4. Fallback Construction
        // If API fails (404 etc), construct a valid User object so UI doesn't crash or show "Unknown"
        const fallbackUser: User = {
            user_id: userId,
            // Create a deterministically readable nickname: "User_MHm...2b"
            nickname: userId.length > 8
                ? `User_${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`
                : `User_${userId}`,
            name: 'Unknown User',
            surname: '',
            email: '',
            // profile_image: 'https://via.placeholder.com/150' // Optional: visual indicator
        };

        const fallbackResponse: UserResponse = {
            user: fallbackUser,
            wallet_id: userId // Assuming userId passed is the wallet_id usually
        };

        // Cache the fallback so we don't retry failed API calls repeatedly
        userProfileCache.set(userId, fallbackResponse);

        return fallbackResponse;
    }
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
    try {
        const response = await client.get(`/api/user/encryption-key/${identifier}`);
        return response.data;
    } catch (error: any) {
        throw new Error(`Şifreleme anahtarı alınamadı: ${error.response?.data?.message || error.message}`);
    }
};

export const updateMessagingPrivacy = async (userId: string, privacy: 'public' | 'followers' | 'private'): Promise<any> => {
    const response = await client.post(`/api/user/${userId}/messaging-privacy`, { privacy });
    return response.data;
};


export const generateQRCode = async (userId: string): Promise<any> => {
    const response = await client.get(`/api/user/${userId}/qr-code`);
    return response.data;
};

// --- Key Rotation / Sync ---
// Remove sha256 import if not strictly needed or use a standard crypto lib if we were doing PoW.

/**
 * Syncs the client's derived encryption key with the blockchain by sending a PROFILE_UPDATE transaction.
 * This fixes the "Key Mismatch" error.
 */
export const syncEncryptionKey = async (mnemonic: string, existingUser?: User | null): Promise<any> => {
    try {


        // 1. Derive Keys
        const signingKeys = deriveSigningKeyPair(mnemonic);
        const encryptionKeys = deriveEncryptionKeyFromMnemonic(mnemonic);
        const derivedPublicKey = signingKeys.publicKey; // Raw hex public key for signing

        // 1.5 Fetch Current User Details to prevent "Missing required fields"
        // PROFILE_UPDATE often requires all profile fields to be present.
        // CRITICAL: We need the REAL wallet_id with TRN prefix from the server!
        let userProfile = {
            nickname: existingUser?.nickname || '',
            name: existingUser?.name || '',
            surname: existingUser?.surname || '',
            birth_date: existingUser?.birth_date || '',
            email: ''
        };

        // Store the real wallet_id from server (with TRN prefix)
        let realWalletId = (existingUser as any)?.user_id || '';

        // Try to fetch from server by nickname if we have one
        if (userProfile.nickname) {
            try {
                const userResponse = await getUser(userProfile.nickname);
                if (userResponse) {
                    realWalletId = (userResponse as any).wallet_id || (userResponse.user as any)?.user_id || realWalletId;
                }
            } catch (e: any) {
                // Ignore fallback error
            }
        }

        // Fallback: Try to fetch from server using derived key if needed
        if (!realWalletId || !userProfile.nickname) {
            try {
                const userResponse = await getUserById(derivedPublicKey);
                if (userResponse?.user) {
                    const u = userResponse.user;
                    userProfile = {
                        nickname: u.nickname || '',
                        name: u.name || '',
                        surname: u.surname || '',
                        birth_date: u.birth_date || '',
                        email: (u as any).email || ''
                    };
                    realWalletId = (userResponse as any).wallet_id || u.user_id || realWalletId;
                }
            } catch (e: any) {
                // Ignore fallback error
            }
        }

        // Use the real wallet_id for transactions (with TRN prefix)
        const walletAddress = realWalletId || derivedPublicKey;

        // Validate and Fill Missing Fields with Defaults
        if (!userProfile.nickname) {
            userProfile.nickname = `User_${walletAddress.substring(0, 8)}`;
            userProfile.name = userProfile.name || 'Anonymous';
            userProfile.surname = userProfile.surname || 'User';
            userProfile.birth_date = userProfile.birth_date || '2000-01-01';
        } else {
            // Ensure other fields are not empty if they are required
            userProfile.name = userProfile.name || userProfile.nickname;
            userProfile.surname = userProfile.surname || '.';
            userProfile.birth_date = userProfile.birth_date || '2000-01-01';
        }



        // Construct Payload - Clean up empty email to avoid validation errors
        const payload: any = {
            ...userProfile,
            action: 'KEY_ROTATION',
            encryption_public_key: encryptionKeys.publicKey,
        };

        if (!payload.email) payload.email = "user@tracenet.org"; // Provide dummy email if empty to satisfy strict validation

        // Add potentially other missing required fields
        if (!payload.user_id) payload.user_id = walletAddress; // Critical: User ID is usually required
        if (!payload.wallet_id) payload.wallet_id = walletAddress; // Critical: Wallet ID is required!
        if (!payload.bio) payload.bio = "Crypto enthusiast";
        if (!payload.profile_image) payload.profile_image = "";
        if (!payload.banner_image) payload.banner_image = "";
        if (!payload.location) payload.location = "Global";
        if (!payload.interests) payload.interests = ["Blockchain", "Privacy"]; // Changed to Array
        // if (!payload.ver) payload.ver = 1; // Removed ver field to test if it causes issues



        // 2. Construct Transaction Data
        // Generate deterministic tx_id
        // from+to+amount+timestamp
        // amount is 0 for PROFILE_UPDATE.
        // We capture timestamp first to ensure consistency in ID and object
        const timestamp = Date.now();
        const txDataForId = `${walletAddress}${walletAddress}0${timestamp}`;

        // Use crypto-browserify which matches backend logic exactly
        const tx_id = crypto.createHash('sha256').update(txDataForId).digest('hex');

        const transactionData = {
            tx_id, // Critical: Required by server validation
            from_wallet: walletAddress,
            to_wallet: walletAddress, // Self-transaction
            type: 'PROFILE_UPDATE',
            amount: 0,
            fee: 0.000005, // Standard profile update fee
            timestamp: timestamp, // Use the captured timestamp
            priority: 'STANDARD',
            payload: payload
        };

        // 3. Create Signature
        // We need to sign a deterministic representation of the transaction.
        // For simplicity and matching typical lightweight logic:
        const signableString = JSON.stringify(transactionData);
        const signature = signData(signableString, signingKeys.privateKey);

        // 4. Construct Final Transaction Object
        const finalTransaction = {
            ...transactionData,
            sender_public_key: signingKeys.publicKey,
            sender_signature: signature
        };

        // 5. Submit to Blockchain
        const response = await client.post('/rpc/sendRawTx', finalTransaction);
        return response.data;

    } catch (error: any) {
        throw error;
    }
};
