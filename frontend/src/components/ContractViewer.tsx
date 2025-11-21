"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { getPublicFromPrivate } from '../utils/crypto';

interface Contract {
    contractId: string;
    type: string;
    creator: string;
    state: any;
    createdAt: number;
    version: string;
    executionCount: number;
}

export default function ContractViewer() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [publicKey, setPublicKey] = useState('');
    const [executing, setExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);

    // Execution params
    const [method, setMethod] = useState('');
    const [execParams, setExecParams] = useState<any>({});

    useEffect(() => {
        fetchContracts();
        const key = localStorage.getItem('blockchain_private_key');
        if (key) {
            const pub = getPublicFromPrivate(key);
            if (pub) setPublicKey(pub);
        }
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await axios.get(`${API_URL}/contracts`);
            setContracts(response.data.contracts);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        }
    };

    const executeContract = async () => {
        if (!selectedContract || !method || !publicKey) return;

        setExecuting(true);
        setExecutionResult(null);

        try {
            const response = await axios.post(`${API_URL}/contract/execute`, {
                contractId: selectedContract.contractId,
                method: method,
                params: execParams,
                caller: publicKey
            });

            setExecutionResult(response.data);
            // Refresh contract data
            setTimeout(fetchContracts, 500);
        } catch (error: any) {
            setExecutionResult({
                success: false,
                message: error.response?.data?.error || 'Execution failed'
            });
        } finally {
            setExecuting(false);
        }
    };

    const getContractIcon = (type: string) => {
        switch (type) {
            case 'TOKEN': return '📜';
            case 'ESCROW': return '🔒';
            case 'VOTING': return '🗳️';
            default: return '📄';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Contracts List */}
            <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Deployed Contracts ({contracts.length})
                    </h2>
                    <button
                        onClick={fetchContracts}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {contracts.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No contracts deployed yet. Deploy your first contract!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contracts.map((contract) => (
                            <button
                                key={contract.contractId}
                                onClick={() => {
                                    setSelectedContract(contract);
                                    setMethod('');
                                    setExecParams({});
                                    setExecutionResult(null);
                                }}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${selectedContract?.contractId === contract.contractId
                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{getContractIcon(contract.type)}</span>
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {contract.type}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">
                                    ID: {contract.contractId.substring(0, 12)}...
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    Executions: {contract.executionCount}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimestamp(contract.createdAt)}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Contract Details & Execution */}
            {selectedContract && (
                <div className="glass-card p-8">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="text-2xl">{getContractIcon(selectedContract.type)}</span>
                        {selectedContract.type} Contract
                    </h3>

                    {/* Contract Info */}
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Contract ID</p>
                                <p className="font-mono text-gray-800 dark:text-white">{selectedContract.contractId}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Version</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{selectedContract.version}</p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Creator</p>
                                <p className="font-mono text-xs text-gray-800 dark:text-white">{selectedContract.creator.substring(0, 20)}...</p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Executions</p>
                                <p className="font-semibold text-gray-800 dark:text-white">{selectedContract.executionCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contract State */}
                    <div className="mb-6">
                        <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Contract State</h4>
                        <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-auto text-gray-800 dark:text-white">
                            {JSON.stringify(selectedContract.state, null, 2)}
                        </pre>
                    </div>

                    {/* Execute Method */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="font-semibold mb-4 text-gray-800 dark:text-white">Execute Method</h4>

                        {!publicKey && (
                            <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg">
                                <p className="text-yellow-800 dark:text-yellow-200">
                                    ⚠️ Please create a wallet to execute contract methods!
                                </p>
                            </div>
                        )}

                        {/* Method Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Method
                            </label>
                            <select
                                value={method}
                                onChange={(e) => {
                                    setMethod(e.target.value);
                                    setExecParams({});
                                    setExecutionResult(null);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Select Method --</option>
                                {selectedContract.type === 'TOKEN' && (
                                    <>
                                        <option value="transfer">transfer</option>
                                        <option value="balanceOf">balanceOf</option>
                                        <option value="mint">mint</option>
                                    </>
                                )}
                                {selectedContract.type === 'ESCROW' && (
                                    <>
                                        <option value="deposit">deposit</option>
                                        <option value="release">release</option>
                                        <option value="refund">refund</option>
                                    </>
                                )}
                                {selectedContract.type === 'VOTING' && (
                                    <>
                                        <option value="vote">vote</option>
                                        <option value="getResults">getResults</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Method Parameters */}
                        {method && (
                            <div className="space-y-4 mb-4">
                                {/* TOKEN Methods */}
                                {selectedContract.type === 'TOKEN' && method === 'transfer' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                To Address
                                            </label>
                                            <input
                                                type="text"
                                                value={execParams.to || ''}
                                                onChange={(e) => setExecParams({ ...execParams, to: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                                placeholder="0x123..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                value={execParams.amount || ''}
                                                onChange={(e) => setExecParams({ ...execParams, amount: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="100"
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedContract.type === 'TOKEN' && method === 'balanceOf' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={execParams.address || publicKey}
                                            onChange={(e) => setExecParams({ ...execParams, address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                            placeholder="0x123..."
                                        />
                                    </div>
                                )}

                                {selectedContract.type === 'TOKEN' && method === 'mint' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mint To
                                            </label>
                                            <input
                                                type="text"
                                                value={execParams.mintTo || ''}
                                                onChange={(e) => setExecParams({ ...execParams, mintTo: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                                placeholder="0x123..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Amount
                                            </label>
                                            <input
                                                type="number"
                                                value={execParams.mintAmount || ''}
                                                onChange={(e) => setExecParams({ ...execParams, mintAmount: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ESCROW Methods */}
                                {selectedContract.type === 'ESCROW' && method === 'deposit' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            value={execParams.amount || ''}
                                            onChange={(e) => setExecParams({ ...execParams, amount: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="100"
                                        />
                                    </div>
                                )}

                                {/* VOTING Methods */}
                                {selectedContract.type === 'VOTING' && method === 'vote' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select Option
                                        </label>
                                        <select
                                            value={execParams.option || ''}
                                            onChange={(e) => setExecParams({ ...execParams, option: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            <option value="">-- Select Option --</option>
                                            {selectedContract.state.options?.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Execute Button */}
                                <button
                                    onClick={executeContract}
                                    disabled={executing || !publicKey}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {executing ? 'Executing...' : 'Execute'}
                                </button>
                            </div>
                        )}

                        {/* Execution Result */}
                        {executionResult && (
                            <div className={`mt-4 p-4 rounded-lg ${executionResult.success
                                    ? 'bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600'
                                    : 'bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600'
                                }`}>
                                {executionResult.success ? (
                                    <div>
                                        <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                                            ✅ {executionResult.message}
                                        </p>
                                        {executionResult.data && (
                                            <pre className="text-xs text-green-700 dark:text-green-300 mt-2">
                                                {JSON.stringify(executionResult.data, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-red-800 dark:text-red-200">
                                        ❌ {executionResult.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
