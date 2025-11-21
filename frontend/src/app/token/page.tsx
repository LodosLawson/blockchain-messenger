"use client";
import TokenDeployer from '../../components/TokenDeployer';
import { useWallet } from '../../context/WalletContext';
import Link from 'next/link';

export default function TokenPage() {
    const { isConnected } = useWallet();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Navigation Breadcrumb */}
                <div className="mb-6">
                    <Link href="/contracts" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Contracts
                    </Link>
                </div>

                {isConnected ? (
                    <TokenDeployer />
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Wallet Connection Required
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Please connect your MetaMask wallet to deploy tokens
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                Click the "Connect Wallet" button in the navigation bar to get started
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
