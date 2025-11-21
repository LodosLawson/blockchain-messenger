"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
    address: string | null;
    isConnected: boolean;
    balance: string;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    signer: ethers.providers.JsonRpcSigner | null;
    provider: ethers.providers.Web3Provider | null;
}

const WalletContext = createContext<WalletContextType>({
    address: null,
    isConnected: false,
    balance: '0',
    connectWallet: async () => { },
    disconnectWallet: () => { },
    signer: null,
    provider: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

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
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                const balance = await provider.getBalance(address);

                setProvider(provider);
                setSigner(signer);
                setAddress(address);
                setBalance(ethers.utils.formatEther(balance));
            } catch (error) {
                console.error("Error connecting wallet:", error);
                alert("Failed to connect wallet. Please try again.");
            }
        } else {
            alert("MetaMask is not installed. Please install it to use this app.");
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
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};
