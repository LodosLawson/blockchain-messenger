
"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

interface Transaction {
    amount: string;
    sender: string;
    recipient: string;
    transactionId: string;
    timestamp: number;
    signature: string;
    status?: 'pending' | 'confirmed' | 'failed';
}

interface Block {
    index: number;
    timestamp: number;
    transactions: Transaction[];
    nonce: number;
    hash: string;
    previousBlockHash: string;
}

interface BlockchainData {
    chain: Block[];
    pendingTransactions: Transaction[];
}

type ActivityType = 'Block' | 'Transaction' | 'Contract';

interface Activity {
    hash: string;
    type: ActivityType;
    status: 'Confirmed' | 'Pending' | 'Failed';
    blockHeight: string;
    timestamp: number;
    details?: any;
}

export default function ExplorerPage() {
    const [blockchain, setBlockchain] = useState<BlockchainData | null>(null);
    const [filter, setFilter] = useState<'All' | 'Blocks' | 'Transactions'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBlockchain = async () => {
        try {
            const response = await axios.get(`${API_URL}/blockchain`);
            setBlockchain(response.data);
        } catch (error) {
            console.error("Error fetching blockchain:", error);
        }
    };

    useEffect(() => {
        fetchBlockchain();
        const interval = setInterval(fetchBlockchain, 5000);
        return () => clearInterval(interval);
    }, []);

    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds} saniye önce`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} dakika önce`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} saat önce`;
        return new Date(timestamp).toLocaleDateString();
    };

    const getActivities = (): Activity[] => {
        if (!blockchain) return [];

        const activities: Activity[] = [];

        // Add Blocks
        blockchain.chain.forEach(block => {
            activities.push({
                hash: block.hash,
                type: 'Block',
                status: 'Confirmed',
                blockHeight: block.index.toString(),
                timestamp: block.timestamp,
                details: block
            });

            // Add Transactions in Block
            block.transactions.forEach(tx => {
                activities.push({
                    hash: tx.transactionId,
                    type: 'Transaction',
                    status: 'Confirmed',
                    blockHeight: block.index.toString(),
                    timestamp: tx.timestamp || block.timestamp, // Fallback to block time if tx time missing
                    details: tx
                });
            });
        });

        // Add Pending Transactions
        blockchain.pendingTransactions.forEach(tx => {
            activities.push({
                hash: tx.transactionId,
                type: 'Transaction',
                status: 'Pending',
                blockHeight: '-',
                timestamp: tx.timestamp || Date.now(),
                details: tx
            });
        });

        return activities.sort((a, b) => b.timestamp - a.timestamp);
    };

    const filteredActivities = getActivities().filter(activity => {
        const matchesFilter = filter === 'All' ||
            (filter === 'Blocks' && activity.type === 'Block') ||
            (filter === 'Transactions' && activity.type === 'Transaction');

        const matchesSearch = searchTerm === '' ||
            activity.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.blockHeight.includes(searchTerm);

        return matchesFilter && matchesSearch;
    });

    if (!blockchain) return (
        <div className="flex justify-center items-center h-screen bg-background-light dark:bg-background-dark">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-stitch-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-stitch-primary font-display font-medium">Yükleniyor...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display p-6 lg:p-10">
            <div className="w-full max-w-7xl mx-auto">
                {/* PageHeading */}
                <div className="flex flex-wrap justify-between gap-3 mb-6">
                    <p className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Blok Zinciri Gezgini</p>
                </div>

                {/* SearchBar */}
                <div className="mb-6">
                    <label className="flex flex-col min-w-40 h-14 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark focus-within:border-stitch-primary focus-within:ring-2 focus-within:ring-stitch-primary/20 transition-all">
                            <div className="text-muted-light dark:text-muted-dark flex items-center justify-center pl-4">
                                <span className="material-symbols-outlined text-2xl">search</span>
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-slate-900 dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-muted-light dark:placeholder:text-muted-dark px-4 pl-2 text-base font-normal leading-normal"
                                placeholder="Blok, İşlem, Adres veya Akıllı Sözleşme Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {/* SegmentedButtons */}
                <div className="mb-8">
                    <div className="flex h-10 w-full max-w-lg items-center justify-center rounded-lg bg-slate-200 dark:bg-border-dark p-1">
                        {['All', 'Blocks', 'Transactions'].map((f) => (
                            <label key={f} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium leading-normal transition-colors ${filter === f
                                ? 'bg-surface-light dark:bg-background-dark shadow-sm text-slate-900 dark:text-white'
                                : 'text-muted-light dark:text-muted-dark hover:text-slate-700 dark:hover:text-slate-300'
                                }`}>
                                <span className="truncate">{f === 'All' ? 'Tümü' : f === 'Blocks' ? 'Bloklar' : 'İşlemler'}</span>
                                <input
                                    type="radio"
                                    name="filter-group"
                                    value={f}
                                    className="invisible w-0"
                                    checked={filter === f}
                                    onChange={() => setFilter(f as any)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* SectionHeader */}
                <h2 className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4 pt-2">Son Aktiviteler</h2>

                {/* Results Table */}
                <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                            <thead className="bg-slate-50 dark:bg-black/20">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider" scope="col">Hash</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider" scope="col">Tip</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider" scope="col">Durum</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider" scope="col">Blok</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-light dark:text-muted-dark uppercase tracking-wider" scope="col">Zaman</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-light dark:text-muted-dark">
                                            Kayıt bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredActivities.slice(0, 20).map((activity, index) => (
                                        <tr key={`${activity.hash}-${index}`} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-stitch-primary">
                                                {activity.hash.substring(0, 10)}...{activity.hash.substring(activity.hash.length - 4)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                                {activity.type === 'Block' ? 'Blok' : 'İşlem'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${activity.status === 'Confirmed'
                                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                                    : activity.status === 'Pending'
                                                        ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                                                    }`}>
                                                    {activity.status === 'Confirmed' ? 'Onaylandı' : activity.status === 'Pending' ? 'Beklemede' : 'Başarısız'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                                {activity.blockHeight}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-light dark:text-muted-dark">
                                                {getTimeAgo(activity.timestamp)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
