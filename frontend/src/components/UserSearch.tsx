"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';
import { Search, UserPlus, AlertCircle, Check } from 'lucide-react';

interface UserSearchProps {
    onSelect?: (user: any) => void;
}

export default function UserSearch({ onSelect }: UserSearchProps) {
    const { address } = useWallet();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [registryContractId, setRegistryContractId] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistryContract();
    }, []);

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

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query || !registryContractId) {
            setSearchResult(null);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: registryContractId,
                method: 'getUser',
                params: { username: query },
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

    return (
        <div className="space-y-4">
            {/* Search Input (Integrated here for self-containment, though ChatLayout has one too. 
                We can hide this if ChatLayout passes query, but for now let's keep it simple) */}
            {/* Actually, ChatLayout has a visual input. Let's use this component's input for logic. */}

            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark group-focus-within:text-stitch-blue transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Kullanıcı adı ara..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:bg-white/10 transition-all"
                />
            </div>

            {/* Results */}
            <div className="space-y-2">
                {loading && (
                    <div className="text-center py-4 text-muted-dark text-xs animate-pulse">
                        Aranıyor...
                    </div>
                )}

                {!loading && searchResult && (
                    <>
                        {searchResult.notFound ? (
                            <div className="text-center py-4 text-muted-dark text-xs">
                                Kullanıcı bulunamadı
                            </div>
                        ) : searchResult.error ? (
                            <div className="text-center py-4 text-red-400 text-xs">
                                Bir hata oluştu
                            </div>
                        ) : (
                            <div
                                onClick={() => onSelect && onSelect(searchResult)}
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all flex items-center gap-3 group"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stitch-blue to-stitch-purple p-[1px]">
                                        <div className="w-full h-full rounded-full bg-sidebar-bg flex items-center justify-center text-white font-bold text-sm">
                                            {searchResult.username[0].toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">@{searchResult.username}</p>
                                    <p className="text-xs text-muted-dark truncate">{searchResult.bio || "No bio"}</p>
                                </div>
                                <UserPlus size={16} className="text-muted-dark group-hover:text-stitch-blue transition-colors" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
