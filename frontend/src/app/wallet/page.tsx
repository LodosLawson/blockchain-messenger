"use client";
import { useState } from 'react';
import { generateKeys, getPublicFromPrivate } from '../../utils/crypto';
import axios from 'axios';
import TransactionForm from '../../components/TransactionForm';
import { API_URL } from '../../config';

export default function WalletPage() {
    const [privateKey, setPrivateKey] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [showPrivate, setShowPrivate] = useState(false);
    const [nickname, setNickname] = useState('');
    const [currentNickname, setCurrentNickname] = useState('');
    const [nicknameInput, setNicknameInput] = useState('');

    const createWallet = () => {
        const keys = generateKeys();
        setPrivateKey(keys.privateKey);
        setPublicKey(keys.publicKey);
        setBalance(0);
        setTransactions([]);
    };

    const accessWallet = async () => {
        const pub = getPublicFromPrivate(privateKey);
        if (pub) {
            setPublicKey(pub);
            fetchBalance(pub);
        } else {
            alert('Invalid Private Key');
        }
    };

    const fetchBalance = async (address: string) => {
        try {
            const res = await axios.get(`${API_URL}/address/${address}`);
            setBalance(res.data.addressData.addressBalance);
            setTransactions(res.data.addressData.addressTransactions);

            // Also fetch nickname
            fetchNickname(address);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchNickname = async (publicKey: string) => {
        try {
            const res = await axios.get(`${API_URL}/get-nickname/${publicKey}`);
            setCurrentNickname(res.data.nickname);
        } catch (error) {
            // Nickname not found, that's okay
            setCurrentNickname('');
        }
    };

    const registerNickname = async () => {
        if (!nicknameInput || !publicKey) {
            alert('Please enter a nickname');
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/register-nickname`, {
                publicKey,
                nickname: nicknameInput
            });
            setCurrentNickname(nicknameInput);
            setNicknameInput('');
            alert('Nickname registered successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to register nickname');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-6">
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold gradient-text mb-2">My Wallet</h1>
                    <p className="text-gray-600 dark:text-gray-300">Manage your blockchain identity</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sol Kolon: Erişim ve Bilgi */}
                    <div className="space-y-8">
                        {/* Cüzdan Erişimi / Oluşturma */}
                        <div className="glass-premium p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Access / Create</h2>

                            <div className="space-y-4">
                                <button
                                    onClick={createWallet}
                                    className="w-full btn-premium py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg"
                                >
                                    Create New Wallet
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-500 rounded-full">Or access existing</span>
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        placeholder="Enter Private Key"
                                        value={privateKey}
                                        onChange={(e) => setPrivateKey(e.target.value)}
                                        className="w-full input-premium mb-3"
                                    />
                                    <button
                                        onClick={accessWallet}
                                        className="w-full btn-premium py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Access Wallet
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cüzdan Detayları */}
                        {publicKey && (
                            <div className="glass-premium p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Wallet Info</h2>

                                <div className="mb-4">
                                    <label className="block text-xs text-gray-500 uppercase">Public Address</label>
                                    <p className="text-sm font-mono break-all bg-gray-100 p-2 rounded dark:bg-gray-700 dark:text-gray-300">
                                        {publicKey}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-gray-500 uppercase">Private Key</label>
                                    <div className="flex gap-2">
                                        <p className="text-sm font-mono break-all bg-gray-100 p-2 rounded flex-1 dark:bg-gray-700 dark:text-gray-300">
                                            {showPrivate ? privateKey : '••••••••••••••••••••••••••••••••'}
                                        </p>
                                        <button
                                            onClick={() => setShowPrivate(!showPrivate)}
                                            className="text-xs text-indigo-600 hover:underline"
                                        >
                                            {showPrivate ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-red-500 mt-1">Do not share your private key!</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-gray-500 uppercase mb-2">Nickname</label>
                                    {currentNickname ? (
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded">
                                            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                                @{currentNickname}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Choose a nickname"
                                                value={nicknameInput}
                                                onChange={(e) => setNicknameInput(e.target.value)}
                                                className="w-full input-premium"
                                                maxLength={20}
                                            />
                                            <button
                                                onClick={registerNickname}
                                                className="w-full btn-premium py-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                                            >
                                                Register Nickname
                                            </button>
                                            <p className="text-xs text-gray-500">3-20 characters, alphanumeric and underscore only</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <label className="block text-xs text-gray-500 uppercase">Balance</label>
                                    <p className="text-3xl font-bold text-indigo-600">{balance} COIN</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sağ Kolon: İşlem Yapma ve Geçmiş */}
                    <div className="space-y-8">
                        {publicKey && (
                            <div className="glass-premium overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                                    <h2 className="text-xl font-semibold text-white">Send Transaction</h2>
                                </div>
                                <div className="p-6">
                                    <TransactionForm />
                                </div>
                            </div>
                        )}

                        {/* İşlem Geçmişi */}
                        {transactions.length > 0 && (
                            <div className="glass-premium p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Transaction History</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700">
                                                <th className="p-2 text-left">Type</th>
                                                <th className="p-2 text-left">Amount</th>
                                                <th className="p-2 text-left">From/To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx: any, idx) => (
                                                <tr key={idx} className="border-b dark:border-gray-700">
                                                    <td className="p-2">
                                                        {tx.sender === publicKey ?
                                                            <span className="text-red-500">Sent</span> :
                                                            <span className="text-green-500">Received</span>
                                                        }
                                                    </td>
                                                    <td className="p-2 font-medium">{tx.amount}</td>
                                                    <td className="p-2 font-mono text-xs truncate max-w-xs">
                                                        {tx.sender === publicKey ? tx.recipient : tx.sender}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
