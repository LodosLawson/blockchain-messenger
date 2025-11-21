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
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">My Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol Kolon: Erişim ve Bilgi */}
                <div className="space-y-8">
                    {/* Cüzdan Erişimi / Oluşturma */}
                    <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Access / Create</h2>

                        <div className="space-y-4">
                            <button
                                onClick={createWallet}
                                className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                                Create New Wallet
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or access existing</span>
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter Private Key"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                    onClick={accessWallet}
                                    className="mt-2 w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                                >
                                    Access Wallet
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cüzdan Detayları */}
                    {publicKey && (
                        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
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
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            maxLength={20}
                                        />
                                        <button
                                            onClick={registerNickname}
                                            className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
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
                        <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
                            {/* Transaction Form Component'i buraya ekliyoruz, ancak prop geçmemiz gerekebilir mi? 
                                TransactionForm kendi state'ini tutuyor, ama private key'i otomatik doldurabiliriz.
                                Şimdilik TransactionForm'u olduğu gibi kullanıyoruz, kullanıcı key'i tekrar girebilir veya kopyalayabilir.
                                İdealde TransactionForm'a prop eklemeliyiz.
                             */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Send Transaction</h2>
                            </div>
                            <TransactionForm />
                        </div>
                    )}

                    {/* İşlem Geçmişi */}
                    {transactions.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
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
    );
}
