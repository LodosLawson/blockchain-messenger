import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Contract {
    contractId: string;
    type: string;
    creator: string;
    params: any;
    state: any;
    version: string;
    executionCount: number;
}

export default function ContractViewer() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [method, setMethod] = useState('');
    const [methodParams, setMethodParams] = useState<Record<string, any>>({});
    const [caller, setCaller] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchContracts();
        const savedWallet = localStorage.getItem('wallet');
        if (savedWallet) {
            const { publicKey } = JSON.parse(savedWallet);
            setCaller(publicKey);
        }
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await axios.get('http://localhost:3005/contracts');
            setContracts(response.data.contracts);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        }
    };

    const executeMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContract) return;
        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post('http://localhost:3005/contract/execute', {
                contractId: selectedContract.contractId,
                method,
                params: methodParams,
                caller
            });

            setResult(response.data);
            // Refresh contract state
            fetchContracts();
            const updated = await axios.get(`http://localhost:3005/contract/${selectedContract.contractId}`);
            setSelectedContract(updated.data.contract);
        } catch (error: any) {
            setResult({ success: false, message: error.response?.data?.error || error.message });
        } finally {
            setLoading(false);
        }
    };

    const getMethods = (type: string) => {
        switch (type) {
            case 'TOKEN': return ['transfer', 'balanceOf', 'mint'];
            case 'ESCROW': return ['deposit', 'release', 'refund'];
            case 'VOTING': return ['vote', 'getResults'];
            default: return [];
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Contract List */}
            <div className="clean-card p-4 lg:col-span-1 h-fit">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Deployed Contracts</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {contracts.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No contracts found.</p>
                    )}
                    {contracts.map(c => (
                        <div
                            key={c.contractId}
                            onClick={() => {
                                setSelectedContract(c);
                                setMethod('');
                                setMethodParams({});
                                setResult(null);
                            }}
                            className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedContract?.contractId === c.contractId
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md'
                                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-indigo-200'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-indigo-600">{c.type}</span>
                                <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">v{c.version}</span>
                            </div>
                            <div className="text-xs font-mono text-gray-500 truncate mb-2">
                                {c.contractId}
                            </div>
                            {c.type === 'TOKEN' && <div className="text-sm font-medium">{c.state.name} ({c.state.symbol})</div>}
                            {c.type === 'VOTING' && <div className="text-sm font-medium truncate">{c.state.title}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contract Details & Interaction */}
            <div className="lg:col-span-2 space-y-6">
                {selectedContract ? (
                    <>
                        {/* Details Card */}
                        <div className="clean-card p-6 animate-slide-in">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        {selectedContract.type === 'TOKEN' && '🪙'}
                                        {selectedContract.type === 'ESCROW' && '🔒'}
                                        {selectedContract.type === 'VOTING' && '🗳️'}
                                        Contract Details
                                    </h2>
                                    <p className="text-sm font-mono text-gray-500 mt-1">{selectedContract.contractId}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Executions</div>
                                    <div className="text-3xl font-bold text-indigo-600">{selectedContract.executionCount}</div>
                                </div>
                            </div>

                            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto shadow-inner">
                                <pre>{JSON.stringify(selectedContract.state, null, 2)}</pre>
                            </div>
                        </div>

                        {/* Execution Card */}
                        <div className="clean-card p-6 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                            <h3 className="text-xl font-bold mb-4">Execute Method</h3>
                            <form onSubmit={executeMethod} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Method</label>
                                        <select
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                            required
                                        >
                                            <option value="">Select Method</option>
                                            {getMethods(selectedContract.type).map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Caller Address</label>
                                        <input
                                            type="text"
                                            value={caller}
                                            onChange={(e) => setCaller(e.target.value)}
                                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Inputs based on Method */}
                                {method === 'transfer' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="To Address" className="p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, to: e.target.value })} required />
                                        <input placeholder="Amount" type="number" className="p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, amount: Number(e.target.value) })} required />
                                    </div>
                                )}
                                {method === 'balanceOf' && (
                                    <input placeholder="Address" className="w-full p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, address: e.target.value })} required />
                                )}
                                {method === 'mint' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Mint To" className="p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, mintTo: e.target.value })} required />
                                        <input placeholder="Amount" type="number" className="p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, mintAmount: Number(e.target.value) })} required />
                                    </div>
                                )}
                                {method === 'deposit' && (
                                    <input placeholder="Amount" type="number" className="w-full p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, amount: Number(e.target.value) })} required />
                                )}
                                {method === 'vote' && (
                                    <select className="w-full p-2 border rounded" onChange={e => setMethodParams({ ...methodParams, option: e.target.value })} required>
                                        <option value="">Select Option</option>
                                        {selectedContract.state.options?.map((o: string) => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                )}

                                <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                                    {loading ? 'Executing...' : 'Execute Transaction'}
                                </button>
                            </form>

                            {result && (
                                <div className={`mt-4 p-4 rounded-lg text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    <div className="font-bold">{result.success ? 'Success' : 'Error'}</div>
                                    <div>{result.message}</div>
                                    {result.data && <div className="mt-2 font-mono text-xs">{JSON.stringify(result.data)}</div>}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="clean-card p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                        <div className="text-6xl mb-4 opacity-20">📜</div>
                        <p>Select a contract to view details and interact</p>
                    </div>
                )}
            </div>
        </div>
    );
}
