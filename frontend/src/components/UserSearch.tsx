"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';
import { Search, UserPlus, Users, Clock } from 'lucide-react';

interface UserSearchProps {
    onSelect?: (user: any) => void;
}

export default function UserSearch({ onSelect }: UserSearchProps) {
    const { address } = useWallet();
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [recentContacts, setRecentContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [registryContractId, setRegistryContractId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');

    useEffect(() => {
        fetchRegistryContract();
    }, []);

    useEffect(() => {
        if (registryContractId) {
            fetchAllUsers();
            if (address) {
                fetchRecentContacts();
            }
        }
    }, [registryContractId, address]);

    useEffect(() => {
        // Real-time filtering
        if (searchQuery.trim()) {
            const filtered = allUsers.filter(user =>
                user.username.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(allUsers);
        }
    }, [searchQuery, allUsers]);

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

    const fetchAllUsers = async () => {
        if (!registryContractId) return;
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: registryContractId,
                method: 'getAllUsers',
                params: {},
                caller: address || '00'
            });

            if (response.data.success && Array.isArray(response.data.data)) {
                setAllUsers(response.data.data);
                setFilteredUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentContacts = async () => {
        if (!address) return;
        try {
            const response = await axios.get(`${API_URL}/address/${address}`);
            const transactions = response.data.addressData.addressTransactions;

            // Extract unique addresses from transactions
            const contactAddresses = new Set<string>();
            transactions.forEach((tx: any) => {
                if (tx.sender === address && tx.recipient !== '00') {
                    contactAddresses.add(tx.recipient);
                } else if (tx.recipient === address && tx.sender !== '00') {
                    contactAddresses.add(tx.sender);
                }
            });

            // Fetch user details for each contact
            const contactPromises = Array.from(contactAddresses).slice(0, 5).map(async (addr) => {
                try {
                    const userResponse = await axios.post(`${API_URL}/contract/execute`, {
                        contractId: registryContractId,
                        method: 'getUser',
                        params: { address: addr },
                        caller: address
                    });
                    return userResponse.data.success ? userResponse.data.data : null;
                } catch {
                    return null;
                }
            });

            const contacts = (await Promise.all(contactPromises)).filter(c => c !== null);
            setRecentContacts(contacts);
        } catch (error) {
            console.error("Error fetching recent contacts:", error);
        }
    };

    const displayUsers = activeTab === 'recent' ? recentContacts : filteredUsers;

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark group-focus-within:text-stitch-blue transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:bg-white/10 transition-all"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'all'
                            ? 'border-stitch-blue text-stitch-blue'
                            : 'border-transparent text-muted-dark hover:text-white'
                        }`}
                >
                    <Users size={14} />
                    Tüm Kullanıcılar ({allUsers.length})
                </button>
                <button
                    onClick={() => setActiveTab('recent')}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'recent'
                            ? 'border-stitch-blue text-stitch-blue'
                            : 'border-transparent text-muted-dark hover:text-white'
                        }`}
                >
                    <Clock size={14} />
                    Son Sohbetler ({recentContacts.length})
                </button>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-muted-dark text-xs animate-pulse">
                        Kullanıcılar yükleniyor...
                    </div>
                ) : displayUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-dark text-xs">
                        {activeTab === 'recent' ? 'Henüz sohbet geçmişi yok' : 'Kullanıcı bulunamadı'}
                    </div>
                ) : (
                    displayUsers.map((user) => (
                        <div
                            key={user.address}
                            onClick={() => onSelect && onSelect(user)}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all flex items-center gap-3 group"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stitch-blue to-stitch-purple p-[1px]">
                                    <div className="w-full h-full rounded-full bg-sidebar-bg flex items-center justify-center text-white font-bold text-sm">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm truncate">@{user.username}</p>
                                <p className="text-xs text-muted-dark truncate">{user.bio || "Durum mesajı yok"}</p>
                            </div>
                            <UserPlus size={16} className="text-muted-dark group-hover:text-stitch-blue transition-colors" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
