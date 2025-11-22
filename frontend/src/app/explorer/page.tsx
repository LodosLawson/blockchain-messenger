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

export default function ExplorerPage() {
    const [blockchain, setBlockchain] = useState<BlockchainData | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

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
        const interval = setInterval(fetchBlockchain, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!blockchain) return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-indigo-600 font-semibold">Loading Blockchain Data...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-bold gradient-text-primary mb-2">Blockchain Explorer</h1>
                        <p className="text-gray-600 dark:text-gray-300">Monitor blocks and transactions in real-time</p>
                    </div>
                    <div className="glass-premium px-6 py-3 rounded-xl flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400 block text-xs uppercase tracking-wider">Total Blocks</span>
                            <span className="font-mono font-bold text-xl text-indigo-600 dark:text-indigo-400">{blockchain.chain.length}</span>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Latest Blocks */}
                    <div className="glass-premium rounded-2xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex justify-between items-center">
                            <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <span>📦</span> Latest Blocks
                            </h2>
                            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">Live Updates</span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                            {blockchain.chain.slice().reverse().slice(0, 20).map((block) => (
                                <div
                                    key={block.index}
                                    onClick={() => setSelectedBlock(block)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedBlock?.index === block.index
                                            ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-md'
                                            : 'bg-white/40 dark:bg-gray-800/40 border-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg dark:bg-indigo-900 dark:text-indigo-300 group-hover:scale-105 transition-transform">
                                            Block #{block.index}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{new Date(block.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                                            {block.hash}
                                        </div>
                                        <div className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                                            {block.transactions.length} Txns
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Block Details or Mempool */}
                    <div className="glass-premium rounded-2xl overflow-hidden flex flex-col h-[600px]">
                        {selectedBlock ? (
                            <>
                                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-indigo-50/50 dark:bg-indigo-900/20 backdrop-blur-sm flex justify-between items-center">
                                    <h2 className="font-bold text-lg text-indigo-800 dark:text-indigo-300">Block #{selectedBlock.index}</h2>
                                    <button
                                        onClick={() => setSelectedBlock(null)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all hover:scale-105"
                                    >
                                        Close Details
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Block Hash</label>
                                            <p className="font-mono text-xs sm:text-sm break-all text-gray-800 dark:text-gray-200">{selectedBlock.hash}</p>
                                        </div>
                                        <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Previous Hash</label>
                                            <p className="font-mono text-xs sm:text-sm break-all text-gray-800 dark:text-gray-200">{selectedBlock.previousBlockHash}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nonce</label>
                                                <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{selectedBlock.nonce}</p>
                                            </div>
                                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Timestamp</label>
                                                <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{new Date(selectedBlock.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <span>💸</span> Transactions ({selectedBlock.transactions.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {selectedBlock.transactions.map(tx => (
                                                <div key={tx.transactionId} className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                                    <div className="flex flex-col sm:flex-row sm:justify-between text-xs mb-2 gap-2">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate max-w-[100px]" title={tx.sender}>{tx.sender === "00" ? "MINING REWARD" : tx.sender}</span>
                                                        </div>
                                                        <span className="text-gray-400 hidden sm:inline">➔</span>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                            <span className="text-gray-600 dark:text-gray-400 font-mono truncate max-w-[100px]" title={tx.recipient}>{tx.recipient}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                                                        <span className="text-xs font-mono text-gray-400 truncate w-24">{tx.transactionId}</span>
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                            {tx.amount} COIN
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedBlock.transactions.length === 0 && (
                                                <div className="text-center p-8 text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/30 rounded-xl">
                                                    No transactions in this block
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                        <span>⏳</span> Pending Transactions (Mempool)
                                    </h2>
                                </div>
                                <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                                    {blockchain.pendingTransactions.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl opacity-50">
                                                💤
                                            </div>
                                            <p>No pending transactions</p>
                                        </div>
                                    ) : (
                                        blockchain.pendingTransactions.map((tx) => (
                                            <div key={tx.transactionId} className="p-4 bg-white/40 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">{tx.transactionId.substring(0, 12)}...</span>
                                                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        Pending
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                        <span className="font-mono">{tx.sender.substring(0, 6)}...</span>
                                                        <span className="text-gray-400">➔</span>
                                                        <span className="font-mono">{tx.recipient.substring(0, 6)}...</span>
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-white">
                                                        {tx.amount} COIN
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
