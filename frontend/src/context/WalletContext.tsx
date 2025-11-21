"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { connectWallet as connectWalletUtil, isMobileDevice, isMetaMaskInstalled } from '../utils/walletConnect';

interface WalletContextType {
    address: string | null;
    isConnected: boolean;
    balance: string;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    signer: ethers.providers.JsonRpcSigner | null;
    provider: ethers.providers.Web3Provider | null;
    connecting: boolean;
    error: string | null;
}

const WalletContext = createContext<WalletContextType>({
    address: null,
    isConnected: false,
    balance: '0',
    connectWallet: async () => { },
    disconnectWallet: () => { },
    signer: null,
    provider: null,
    connecting: false,
    error: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [connecting, setConnecting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if wallet is already connected
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                try {
                    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        const signer = provider.getSigner();
                        setProvider(provider);
                        setSigner(signer);
                        setAddress(accounts[0]);
                        const balance = await provider.getBalance(accounts[0]);
                        setBalance(ethers.utils.formatEther(balance));
                    }
                } catch (error) {
                    console.error("Error checking wallet connection:", error);
                }
            }
        };

        checkConnection();
    }, []);

    const connectWallet = async () => {
        try {
            setConnecting(true);
            setError(null);

            const connection = await connectWalletUtil();

            setProvider(connection.provider);
            const signer = connection.provider.getSigner();
            setSigner(signer);
            setAddress(connection.address);

            const balance = await connection.provider.getBalance(connection.address);
            setBalance(ethers.utils.formatEther(balance));
        } catch (error: any) {
            console.error('Wallet connection error:', error);
            setError(error.message || 'Failed to connect wallet');

            // Don't throw error for mobile redirect
            if (!error.message?.includes('Redirecting')) {
                throw error;
            }
        } finally {
            setConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAddress(null);
        setSigner(null);
        setProvider(null);
        setBalance('0');
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                isConnected: !!address,
                balance,
                connectWallet,
                disconnectWallet,
                signer,
                provider,
                connecting,
                error,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
