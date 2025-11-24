"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';

export default function TokenDeployer() {
    const { address, isConnected, signer } = useWallet();
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [totalSupply, setTotalSupply] = useState('1000000');
    const [deploying, setDeploying] = useState(false);
    const [deployedToken, setDeployedToken] = useState<any>(null);
    const [error, setError] = useState('');

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected || !signer || !address) {
            setError('Please connect your wallet first');
            return;
        }

        if (!tokenName || !tokenSymbol || !totalSupply) {
            setError('Please fill in all fields');
            return;
        }

        setDeploying(true);
        setError('');

        try {
            // Sign deployment message
            const deploymentMessage = `Deploy Token: ${tokenName} (${tokenSymbol}) - Supply: ${totalSupply}`;
            const signature = await signer.signMessage(deploymentMessage);

            // Deploy token via backend
            const response = await axios.post(`${API_URL}/contract/deploy`, {
                type: 'TOKEN',
                creator: address,
                params: {
                    name: tokenName,
                    symbol: tokenSymbol,
                    totalSupply: parseInt(totalSupply)
                },
                signature: signature
            });

            setDeployedToken(response.data.contract);
            setTokenName('');
            setTokenSymbol('');
            setTotalSupply('1000000');
        } catch (err: any) {
            console.error('Deployment error:', err);
            setError(err.response?.data?.error || 'Failed to deploy token');
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Create Your Token
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Deploy your own custom token on the blockchain
                </p>
            </div>

            {/* Deployment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Token Configuration
                    </h2>
                    <p className="text-purple-100 mt-1 text-sm">Configure your token parameters</p>
                </div>

                <form onSubmit={handleDeploy} className="p-6 space-y-6">
                    {/* Token Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Token Name
                        </label>
                        <input
                            type="text"
                            value={tokenName}
                            onChange={(e) => setTokenName(e.target.value)}
                            placeholder="e.g., My Awesome Token"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            disabled={deploying}
                        />
                    </div>

                    {/* Token Symbol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Token Symbol
                        </label>
                        <input
                            type="text"
                            value={tokenSymbol}
                            onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                            placeholder="e.g., MAT"
                            maxLength={10}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            disabled={deploying}
                        />
                        <p className="text-xs text-gray-500 mt-1">Usually 3-5 characters (e.g., BTC, ETH)</p>
                    </div>

                    {/* Total Supply */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Total Supply
                        </label>
                        <input
                            type="number"
                            value={totalSupply}
                            onChange={(e) => setTotalSupply(e.target.value)}
                            placeholder="1000000"
                            min="1"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                            disabled={deploying}
                        />
                        <p className="text-xs text-gray-500 mt-1">Total number of tokens to create</p>
                    </div>

                    {/* Preview */}
                    {tokenName && tokenSymbol && totalSupply && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Preview</h3>
                            <div className="space-y-1 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Name:</span> {tokenName}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Symbol:</span> {tokenSymbol}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Supply:</span> {parseInt(totalSupply).toLocaleString()} {tokenSymbol}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">Creator:</span> {address?.substring(0, 10)}...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {deployedToken && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                                ✅ Token Deployed Successfully!
                            </h3>
                            <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                                Contract ID: <span className="font-mono">{deployedToken.contractId}</span>
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-400">
                                Your token has been deployed to the blockchain. You can now view it in the Contracts page.
                            </p>
                        </div>
                    )}

                    {/* Deploy Button */}
                    <button
                        type="submit"
                        disabled={deploying || !isConnected || !tokenName || !tokenSymbol || !totalSupply}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        {deploying ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deploying Token...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Deploy Token
                            </>
                        )}
                    </button>

                    {!isConnected && (
                        <p className="text-center text-sm text-gray-500">
                            Please connect your wallet to deploy a token
                        </p>
                    )}
                </form>
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    What happens when you deploy?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>A new TOKEN smart contract is created on the blockchain</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>The total supply is minted to your wallet address</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>You can transfer tokens to other users</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>The contract is immutable and permanent on the blockchain</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
