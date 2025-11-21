import { ethers } from 'ethers';

export interface WalletConnection {
    provider: any;
    address: string;
    chainId: number;
}

/**
 * Connect to MetaMask wallet
 * Supports both desktop extension and mobile app
 */
export async function connectWallet(): Promise<WalletConnection> {
    // Check if MetaMask is available (desktop or mobile in-app browser)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
            const provider = new ethers.providers.Web3Provider((window as any).ethereum);
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            return {
                provider,
                address,
                chainId: network.chainId
            };
        } catch (error) {
            console.error('MetaMask connection error:', error);
            throw error;
        }
    }

    // Mobile device without MetaMask in-app browser
    if (isMobileDevice() && typeof window !== 'undefined' && !(window as any).ethereum) {
        // Deep link to MetaMask app
        const dappUrl = window.location.href.replace(/^https?:\/\//, '');
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${dappUrl}`;

        // Show user-friendly message
        alert('Opening MetaMask app... If it doesn\'t open automatically, please open this page in MetaMask app browser.');

        window.location.href = metamaskAppDeepLink;
        throw new Error('Redirecting to MetaMask app...');
    }

    throw new Error('MetaMask not found. Please install MetaMask extension or app.');
}

/**
 * Check if current device is mobile
 */
export function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

/**
 * Get user-friendly connection instructions
 */
export function getConnectionInstructions(): string {
    if (isMobileDevice()) {
        if (isMetaMaskInstalled()) {
            return '📱 Tap "Connect Wallet" to connect your MetaMask';
        }
        return '📱 Please open this page in MetaMask app browser';
    }

    if (isMetaMaskInstalled()) {
        return '🦊 Click "Connect Wallet" to connect your MetaMask';
    }

    return '🦊 Please install MetaMask extension to continue';
}
