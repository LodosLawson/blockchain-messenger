import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, Wallet } from '../types';

interface AuthContextType {
    user: User | null;
    wallet: Wallet | null;
    mnemonic: string | null;
    isLoading: boolean;
    register: (user: User, wallet: Wallet, mnemonic: string, saveToKeychain?: boolean) => Promise<void>;
    logout: () => Promise<void>;
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
                const userJson = await SecureStore.getItemAsync('user');
                const walletJson = await SecureStore.getItemAsync('wallet');
                const savedMnemonic = await SecureStore.getItemAsync('mnemonic');

                if (userJson && walletJson) {
                    setUser(JSON.parse(userJson));
                    setWallet(JSON.parse(walletJson));
                    setMnemonic(savedMnemonic);
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
                await SecureStore.setItemAsync('user', JSON.stringify(newUser));
                await SecureStore.setItemAsync('wallet', JSON.stringify(newWallet));
                if (newMnemonic) {
                    await SecureStore.setItemAsync('mnemonic', newMnemonic);
                }
            }
        } catch (e) {
            console.error('Failed to save auth data', e);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setWallet(null);
        setMnemonic(null);
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('wallet');
        await SecureStore.deleteItemAsync('mnemonic');
    };

    return (
        <AuthContext.Provider value={{ user, wallet, mnemonic, isLoading, register, logout }}>
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
