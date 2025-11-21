"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { getPublicFromPrivate } from '../utils/crypto';

interface Template {
    type: string;
    name: string;
    description: string;
    requiredParams: string[];
    methods: string[];
    example: any;
}

export default function ContractDeployer() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [params, setParams] = useState<any>({});
    const [publicKey, setPublicKey] = useState('');
    const [deploying, setDeploying] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetchTemplates();
        const key = localStorage.getItem('blockchain_private_key');
        if (key) {
            const pub = getPublicFromPrivate(key);
            if (pub) setPublicKey(pub);
        }
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get(`${API_URL}/contract/templates`);
            setTemplates(response.data.templates);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleTemplateSelect = (type: string) => {
        setSelectedType(type);
        const template = templates.find(t => t.type === type);
        if (template) {
            // Initialize params with example values
            const initialParams: any = { ...template.example };
            initialParams.creator = publicKey;
            setParams(initialParams);
        }
        setResult(null);
    };

    const handleParamChange = (key: string, value: any) => {
        setParams({ ...params, [key]: value });
    };

    const deployContract = async () => {
        if (!publicKey) {
            setResult({ success: false, message: 'Please create a wallet first!' });
            return;
        }

        setDeploying(true);
        setResult(null);

        try {
            const response = await axios.post(`${API_URL}/contract/deploy`, {
                type: selectedType,
                creator: publicKey,
                params: params
            });

            setResult({ success: true, data: response.data });
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error || 'Deployment failed'
            });
        } finally {
            setDeploying(false);
        }
    };

    const selectedTemplate = templates.find(t => t.type === selectedType);

    return (
        <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                Deploy New Contract
            </h2>

            {!publicKey && (
                <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        ⚠️ Please create a wallet first to deploy contracts!
                    </p>
                </div>
            )}

            {/* Template Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Contract Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map((template) => (
                        <button
                            key={template.type}
                            onClick={() => handleTemplateSelect(template.type)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${selectedType === template.type
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                                {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {template.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Parameter Form */}
            {selectedTemplate && (
                <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Contract Parameters
                    </h3>

                    {selectedTemplate.type === 'TOKEN' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Token Name
                                </label>
                                <input
                                    type="text"
                                    value={params.name || ''}
                                    onChange={(e) => handleParamChange('name', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="MyToken"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Symbol
                                </label>
                                <input
                                    type="text"
                                    value={params.symbol || ''}
                                    onChange={(e) => handleParamChange('symbol', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="MTK"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Total Supply
                                </label>
                                <input
                                    type="number"
                                    value={params.totalSupply || ''}
                                    onChange={(e) => handleParamChange('totalSupply', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="1000000"
                                />
                            </div>
                        </>
                    )}

                    {selectedTemplate.type === 'ESCROW' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Buyer Address
                                </label>
                                <input
                                    type="text"
                                    value={params.buyer || publicKey}
                                    onChange={(e) => handleParamChange('buyer', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="0x123..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Seller Address
                                </label>
                                <input
                                    type="text"
                                    value={params.seller || ''}
                                    onChange={(e) => handleParamChange('seller', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                                    placeholder="0x456..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    value={params.amount || ''}
                                    onChange={(e) => handleParamChange('amount', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="100"
                                />
                            </div>
                        </>
                    )}

                    {selectedTemplate.type === 'VOTING' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Voting Title
                                </label>
                                <input
                                    type="text"
                                    value={params.title || ''}
                                    onChange={(e) => handleParamChange('title', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Choose next feature"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Options (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={params.options?.join(', ') || ''}
                                    onChange={(e) => handleParamChange('options', e.target.value.split(',').map((s: string) => s.trim()))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="Option A, Option B, Option C"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    End Time (hours from now)
                                </label>
                                <input
                                    type="number"
                                    value={params.endTime ? Math.floor((params.endTime - Date.now()) / 3600000) : 24}
                                    onChange={(e) => handleParamChange('endTime', Date.now() + parseInt(e.target.value) * 3600000)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="24"
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Deploy Button */}
            {selectedTemplate && (
                <button
                    onClick={deployContract}
                    disabled={deploying || !publicKey}
                    className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {deploying ? 'Deploying...' : 'Deploy Contract'}
                </button>
            )}

            {/* Result */}
            {result && (
                <div className={`mt-6 p-4 rounded-lg ${result.success
                        ? 'bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600'
                        : 'bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600'
                    }`}>
                    {result.success ? (
                        <div>
                            <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                                ✅ Contract Deployed Successfully!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                                Contract ID: {result.data.contract.contractId}
                            </p>
                        </div>
                    ) : (
                        <p className="text-red-800 dark:text-red-200">
                            ❌ {result.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
