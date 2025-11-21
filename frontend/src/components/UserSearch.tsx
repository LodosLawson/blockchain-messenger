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
            <div className="glass-premium rounded-2xl p-5 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                </h3>
                {isConnected ? (
                    myProfile ? (
                        <div className="flex items-center space-x-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {myProfile.username[0].toUpperCase()}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white text-lg">@{myProfile.username}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{myProfile.bio || "No bio yet"}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {!isRegistering ? (
                                <button
                                    onClick={() => setIsRegistering(true)}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Profile
                                    </span>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="input-premium"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Bio (optional)"
                                        value={newBio}
                                        onChange={(e) => setNewBio(e.target.value)}
                                        className="input-premium"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRegister}
                                            disabled={loading || !newUsername}
                                            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                        >
                                            {loading ? 'Creating...' : 'Create'}
                                        </button>
                                        <button
                                            onClick={() => setIsRegistering(false)}
                                            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <div className="text-center py-6 px-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <svg className="w-12 h-12 mx-auto mb-3 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Connect your wallet to create a profile
                        </p>
                    </div>
                )}
            </div>

            {/* Search Section */}
            <div className="glass-premium rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Users
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search by username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="input-premium pl-11"
                            />
                            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading || !searchQuery}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResult && (
                        <div className="mt-4 animate-scale-in">
                            {searchResult.notFound ? (
                                <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-600 dark:text-gray-400 font-medium">User not found</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try a different username</p>
                                </div>
                            ) : searchResult.error ? (
                                <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                    <svg className="w-16 h-16 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-600 dark:text-red-400 font-medium">Search failed</p>
                                    <p className="text-sm text-red-500 dark:text-red-500 mt-1">Please try again</p>
                                </div>
                            ) : (
                                <div
                                    onClick={() => onSelect && onSelect(searchResult)}
                                    className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                                {searchResult.username[0].toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">@{searchResult.username}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{searchResult.bio || "No bio"}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono truncate">{searchResult.address}</p>
                                        </div>
                                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
