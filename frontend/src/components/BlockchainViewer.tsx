"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface Transaction {
  amount: number;
  sender: string;
  recipient: string;
  transactionId: string;
  timestamp?: number;
  version?: string;
  message?: string;
}

interface Block {
  index: number;
  timestamp: number;
  createdAt?: string;
  version?: string;
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;
}

interface BlockchainData {
  chain: Block[];
  pendingTransactions: Transaction[];
}

interface BlockchainViewerProps {
  data?: BlockchainData | null;
}

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function BlockchainViewer({ data: initialData }: BlockchainViewerProps) {
  const [data, setData] = useState<BlockchainData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetchBlockchainData();
      const interval = setInterval(fetchBlockchainData, 5000); // Auto-refresh
      return () => clearInterval(interval);
    }
  }, [initialData]);

  const fetchBlockchainData = async () => {
    try {
      const response = await axios.get(`${API_URL}/blockchain`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="clean-card p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading blockchain data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="clean-card p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Blocks</div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{data.chain.length}</div>
        </div>
        <div className="clean-card p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Pending Tx</div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{data.pendingTransactions.length}</div>
        </div>
        <div className="clean-card p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Latest Hash</div>
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate" title={data.chain[data.chain.length - 1]?.hash}>
            {data.chain[data.chain.length - 1]?.hash || 'Genesis'}
          </div>
        </div>
      </div>

      {/* Recent Blocks Timeline */}
      <div className="clean-card">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white">Recent Blocks</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.chain.slice().reverse().map((block) => (
            <div key={block.hash} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">
                    #{block.index}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white">Block #{block.index}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(block.timestamp)} • {new Date(block.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                {block.version && (
                  <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    v{block.version}
                  </span>
                )}
              </div>

              <div className="grid gap-2 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Hash:</span>
                  <span className="font-mono text-xs truncate text-gray-700 dark:text-gray-300">{block.hash}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Prev Hash:</span>
                  <span className="font-mono text-xs truncate text-gray-700 dark:text-gray-300">{block.previousBlockHash}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Nonce:</span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">{block.nonce}</span>
                </div>
              </div>

              {block.transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {block.transactions.length} Transactions
                  </div>
                  <div className="space-y-2">
                    {block.transactions.map((tx) => (
                      <div key={tx.transactionId} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {tx.sender === '00' ? '🪙 MINT' : '💸 TX'}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-white">{tx.amount} coins</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] ml-2">
                          {tx.transactionId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
