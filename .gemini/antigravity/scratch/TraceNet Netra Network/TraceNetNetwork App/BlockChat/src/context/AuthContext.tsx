import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { User, Wallet } from '../types';

// Cross-platform storage helper
// Uses SecureStore on native, localStorage on web
const storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        } else {
            try {
                const SecureStore = require('expo-secure-store');
                return await SecureStore.getItemAsync(key);
            } catch {
                return null;
            }
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            try {
                localStorage.setItem(key, value);
            } catch {
                console.warn('localStorage not available');
            }
        } else {
            try {
                const SecureStore = require('expo-secure-store');
                await SecureStore.setItemAsync(key, value);
            } catch (e) {
                console.warn('SecureStore not available', e);
            }
        }
    },
    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            try {
                localStorage.removeItem(key);
            } catch {
                // ignore
            }
        } else {
            try {
                const SecureStore = require('expo-secure-store');
                await SecureStore.deleteItemAsync(key);
            } catch {
                // ignore
            }
        }
    }
};

interface AuthContextType {
    user: User | null;
    wallet: Wallet | null;
    mnemonic: string | null;
    isLoading: boolean;
    register: (user: User, wallet: Wallet, mnemonic: string, saveToKeychain?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const userJson = await storage.getItem('user');
                const walletJson = await storage.getItem('wallet');
                const savedMnemonic = await storage.getItem('mnemonic');

                if (userJson && walletJson) {
                    setUser(JSON.parse(userJson));
                    setWallet(JSON.parse(walletJson));
                    setMnemonic(savedMnemonic);
                    console.log('✅ Auth data loaded successfully');
                }
            } catch (e) {
                console.error('Failed to load auth data', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadStorageData();
    }, []);

    const register = async (newUser: User, newWallet: Wallet, newMnemonic: string, saveToKeychain: boolean = true) => {
        setIsLoading(true);
        try {
            setUser(newUser);
            setWallet(newWallet);
            setMnemonic(newMnemonic);

            if (saveToKeychain) {
                await storage.setItem('user', JSON.stringify(newUser));
                await storage.setItem('wallet', JSON.stringify(newWallet));
                if (newMnemonic) {
                    await storage.setItem('mnemonic', newMnemonic);
                }
                console.log('✅ Auth data saved successfully');
            }
        } catch (e) {
            console.error('Failed to save auth data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBalance = async () => {
        if (!wallet) return;
        try {
            const { getUserById } = require('../api/auth');
            const data = await getUserById(wallet.wallet_id);
            if (data && data.block_account) {
                const refreshedWallet = {
                    ...wallet,
                    balance: data.block_account.balance, // Update balance from blockchain
                };
                setWallet(refreshedWallet);
                // Update storage silently
                try {
                    await storage.setItem('wallet', JSON.stringify(refreshedWallet));
                } catch (e) { }
                console.log('💰 Balance refreshed:', refreshedWallet.balance);
            }
        } catch (error) {
            console.error('Failed to refresh balance', error);
        }
    };

    const logout = async () => {
        setUser(null);
        setWallet(null);
        setMnemonic(null);
        await storage.deleteItem('user');
        await storage.deleteItem('wallet');
        await storage.deleteItem('mnemonic');
        console.log('✅ Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, wallet, mnemonic, isLoading, register, logout, refreshBalance }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

