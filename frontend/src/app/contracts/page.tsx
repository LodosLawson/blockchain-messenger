"use client";
import { useState, useEffect } from 'react';
import ContractDeployer from '../../components/ContractDeployer';
import ContractViewer from '../../components/ContractViewer';
import Link from 'next/link';

export default function ContractsPage() {
    const [activeTab, setActiveTab] = useState<'deploy' | 'view'>('deploy');

    return (
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-block mb-4 text-indigo-600 dark:text-indigo-400 hover:underline">
                        ← Back to Home
                    </Link>

                    <div className="animate-float inline-block mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
                        <span className="gradient-text">Smart Contracts</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        Deploy and Manage Decentralized Contracts
                    </p>

                    {/* Quick Actions */}
                    <div className="flex justify-center mb-8">
                        <Link
                            href="/token"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Create Your Token
                        </Link>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-md">
                            📜 Token Contracts
                        </span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-md">
                            🔒 Escrow Contracts
                        </span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-md">
                            🗳️ Voting Contracts
                        </span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="glass-card p-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('deploy')}
                            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'deploy'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Deploy Contract
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'view'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Contracts
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="animate-slide-in">
                    {activeTab === 'deploy' ? <ContractDeployer /> : <ContractViewer />}
                </div>
            </div>
        </main>
    );
}
