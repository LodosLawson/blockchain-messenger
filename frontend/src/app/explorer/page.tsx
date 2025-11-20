"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

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
            const response = await axios.get('http://localhost:3001/blockchain');
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

    if (!blockchain) return <div className="flex justify-center items-center h-screen text-gray-500">Loading Blockchain Data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blockchain Explorer</h1>
                    <div className="text-sm text-gray-500">
                        Total Blocks: <span className="font-mono font-bold text-indigo-600">{blockchain.chain.length}</span>
                    </div>
                </div>

                {/* Son Bloklar ve İşlemler Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Son Bloklar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-800 dark:text-white">Latest Blocks</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {blockchain.chain.slice().reverse().slice(0, 10).map((block) => (
                                <div key={block.index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer" onClick={() => setSelectedBlock(block)}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300">
                                            #{block.index}
                                        </span>
                                        <span className="text-xs text-gray-500">{new Date(block.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate w-48">
                                            {block.hash}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {block.transactions.length} Txns
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Blok Detayı (Seçili ise) veya Bekleyen İşlemler */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                        {selectedBlock ? (
                            <>
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                                    <h2 className="font-semibold text-indigo-800 dark:text-indigo-300">Block #{selectedBlock.index} Details</h2>
                                    <button onClick={() => setSelectedBlock(null)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Hash</label>
                                        <p className="font-mono text-sm break-all text-gray-800 dark:text-gray-200">{selectedBlock.hash}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Previous Hash</label>
                                        <p className="font-mono text-sm break-all text-gray-800 dark:text-gray-200">{selectedBlock.previousBlockHash}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Nonce</label>
                                        <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{selectedBlock.nonce}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase mb-2 block">Transactions</label>
                                        <div className="space-y-2">
                                            {selectedBlock.transactions.map(tx => (
                                                <div key={tx.transactionId} className="bg-gray-50 p-3 rounded border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-indigo-600 font-mono truncate w-24" title={tx.sender}>{tx.sender === "00" ? "MINING REWARD" : tx.sender}</span>
                                                        <span className="text-gray-400">➔</span>
                                                        <span className="text-indigo-600 font-mono truncate w-24" title={tx.recipient}>{tx.recipient}</span>
                                                    </div>
                                                    <div className="text-right font-bold text-gray-800 dark:text-gray-200">
                                                        {tx.amount} COIN
                                                    </div>
                                                </div>
                                            ))}
                                            {selectedBlock.transactions.length === 0 && <p className="text-sm text-gray-400 italic">No transactions</p>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="font-semibold text-gray-800 dark:text-white">Pending Transactions (Mempool)</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {blockchain.pendingTransactions.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">No pending transactions</div>
                                    ) : (
                                        blockchain.pendingTransactions.map((tx) => (
                                            <div key={tx.transactionId} className="p-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-mono text-indigo-600 truncate w-32">{tx.transactionId}</span>
                                                    <span className="text-xs text-gray-400">Pending</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="font-mono">{tx.sender.substring(0, 8)}...</span> ➔ <span className="font-mono">{tx.recipient.substring(0, 8)}...</span>
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-white">
                                                        {tx.amount}
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
