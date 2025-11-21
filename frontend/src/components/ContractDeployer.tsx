import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ContractTemplate {
    type: string;
    name: string;
    description: string;
    requiredParams: string[];
    methods: string[];
    example: Record<string, any>;
}

export default function ContractDeployer() {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [params, setParams] = useState<Record<string, any>>({});
    const [creator, setCreator] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTemplates();
        // Load wallet address from localStorage if available
        const savedWallet = localStorage.getItem('wallet');
        if (savedWallet) {
            const { publicKey } = JSON.parse(savedWallet);
            setCreator(publicKey);
        }
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('http://localhost:3005/contract/templates');
            setTemplates(response.data.templates);
            if (response.data.templates.length > 0) {
                setSelectedType(response.data.templates[0].type);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleParamChange = (key: string, value: string) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const deployContract = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            // Format parameters based on type
            const formattedParams = { ...params };
            if (selectedType === 'TOKEN') {
                formattedParams.totalSupply = Number(formattedParams.totalSupply);
            } else if (selectedType === 'ESCROW') {
                formattedParams.amount = Number(formattedParams.amount);
            } else if (selectedType === 'VOTING') {
                formattedParams.options = (formattedParams.options as string).split(',').map(o => o.trim());
                formattedParams.endTime = Date.now() + (Number(formattedParams.endTime) * 3600000);
            }

            const response = await axios.post('http://localhost:3005/contract/deploy', {
                type: selectedType,
                creator,
                params: formattedParams
            });

            setStatus({
                type: 'success',
                message: `Contract deployed! ID: ${response.data.contract.contractId}`
            });
            setParams({});
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.error || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedTemplate = templates.find(t => t.type === selectedType);

    return (
        <div className="clean-card p-6 animate-slide-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                <span>🚀</span> Deploy New Contract
            </h2>

            <form onSubmit={deployContract} className="space-y-6">
                {/* Contract Type Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contract Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {templates.map(t => (
                            <button
                                key={t.type}
                                type="button"
                                onClick={() => {
                                    setSelectedType(t.type);
                                    setParams({});
                                }}
                                className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${selectedType === t.type
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                                    }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                    {selectedTemplate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                            {selectedTemplate.description}
                        </p>
                    )}
                </div>

                {/* Creator Address */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Creator Address</label>
                    <input
                        type="text"
                        value={creator}
                        onChange={(e) => setCreator(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        placeholder="Enter your wallet address"
                        required
                    />
                </div>

                {/* Dynamic Parameters */}
                {selectedTemplate && (
                    <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">Contract Parameters</h3>

                        {selectedType === 'TOKEN' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Token Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="e.g. My Custom Token"
                                        onChange={e => handleParamChange('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Symbol</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="e.g. MCT"
                                        onChange={e => handleParamChange('symbol', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Total Supply</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="e.g. 1000000"
                                        onChange={e => handleParamChange('totalSupply', e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {selectedType === 'ESCROW' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Buyer Address</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm"
                                        placeholder="0x..."
                                        onChange={e => handleParamChange('buyer', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Seller Address</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm"
                                        placeholder="0x..."
                                        onChange={e => handleParamChange('seller', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Amount</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="0.00"
                                        onChange={e => handleParamChange('amount', e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        {selectedType === 'VOTING' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Poll Title</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="What should we vote on?"
                                        onChange={e => handleParamChange('title', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Options (comma separated)</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="Yes, No, Maybe"
                                        onChange={e => handleParamChange('options', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-gray-500">Duration (hours)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600"
                                        placeholder="24"
                                        onChange={e => handleParamChange('endTime', e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !creator}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Deploying...' : 'Deploy Contract'}
                </button>

                {status && (
                    <div className={`p-4 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                            status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                        {status.message}
                    </div>
                )}
            </form>
        </div>
    );
}
