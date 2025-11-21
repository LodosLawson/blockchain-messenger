"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';

interface UserSearchProps {
    onSelect?: (user: any) => void;
}

export default function UserSearch({ onSelect }: UserSearchProps) {
    const { address, isConnected } = useWallet();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [registryContractId, setRegistryContractId] = useState<string | null>(null);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newBio, setNewBio] = useState('');

    useEffect(() => {
        fetchRegistryContract();
    }, []);

    useEffect(() => {
        if (registryContractId && address) {
            fetchMyProfile();
        }
    }, [registryContractId, address]);

    const fetchRegistryContract = async () => {
        try {
            const response = await axios.get(`${API_URL}/contracts`);
            const contracts = response.data.contracts;
            const registry = contracts.find((c: any) => c.type === 'USER_REGISTRY');
            if (registry) {
                setRegistryContractId(registry.contractId);
            }
        } catch (error) {
            console.error("Error fetching contracts:", error);
        }
    };

    const fetchMyProfile = async () => {
        if (!registryContractId || !address) return;
        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: registryContractId,
                method: 'getUser',
                params: { address },
                caller: address
            });
            if (response.data.success) {
                setMyProfile(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery || !registryContractId) return;
        setLoading(true);
        setSearchResult(null);
        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: registryContractId,
                method: 'getUser',
                params: { username: searchQuery },
                caller: address || '00'
            });

            if (response.data.success) {
                setSearchResult(response.data.data);
            } else {
                setSearchResult({ notFound: true });
            }
        } catch (error) {
            console.error("Error searching user:", error);
            setSearchResult({ error: true });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!newUsername || !registryContractId || !address) return;
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: registryContractId,
                method: 'register',
                params: { username: newUsername, bio: newBio, avatar: '' },
                caller: address
            });

            if (response.data.success) {
                alert("Profile registered successfully!");
                setIsRegistering(false);
                fetchMyProfile();
            } else {
                alert("Registration failed: " + response.data.message);
            }
        } catch (error) {
            console.error("Error registering:", error);
            alert("Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* My Profile Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">My Profile</h3>
                {isConnected ? (
                    myProfile ? (
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
                                {myProfile.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">@{myProfile.username}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{myProfile.bio || "No bio"}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {!isRegistering ? (
                                <button
                                    onClick={() => setIsRegistering(true)}
                                    className="w-full py-2 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    Create Profile
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Bio (optional)"
                                        value={newBio}
                                        onChange={(e) => setNewBio(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleRegister}
                                            disabled={loading}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {loading ? '...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setIsRegistering(false)}
                                            className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <p className="text-sm text-gray-500 italic">Connect wallet to view profile</p>
                )}
            </div>

            {/* Search Section */}
            <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Find Users</h3>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Search Results */}
                {loading && !isRegistering && (
                    <div className="mt-4 text-center text-gray-500 text-sm">Searching...</div>
                )}

                {searchResult && (
                    <div className="mt-4">
                        {searchResult.notFound ? (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                                User not found
                            </div>
                        ) : searchResult.error ? (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                                Error occurred
                            </div>
                        ) : (
                            <div
                                onClick={() => onSelect && onSelect(searchResult)}
                                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                        {searchResult.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">@{searchResult.username}</p>
                                        <p className="text-xs text-gray-500">{searchResult.address.substring(0, 6)}...{searchResult.address.substring(searchResult.address.length - 4)}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
