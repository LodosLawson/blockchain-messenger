"use client";
import { useState } from 'react';
import axios from 'axios';
import { signTransaction, getPublicFromPrivate } from '../../utils/crypto';
import { API_URL } from '../../config';

export default function ProfilePage() {
    const [privateKey, setPrivateKey] = useState('');
    const [myAddress, setMyAddress] = useState('');
    const [targetAddress, setTargetAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        const pub = getPublicFromPrivate(privateKey);
        if (pub) {
            setMyAddress(pub);
        } else {
            alert('Invalid Private Key');
        }
    };

    const sendGift = async () => {
        if (!myAddress) return;
        setLoading(true);
        setStatus('Sending gift...');

        try {
            const signature = signTransaction(privateKey, amount, targetAddress);

            await axios.post(`${API_URL}/transaction/broadcast`, {
                amount,
                sender: myAddress,
                recipient: targetAddress,
                signature
            });

            setStatus('Gift sent successfully!');
            setAmount('');
        } catch (error) {
            console.error(error);
            setStatus('Failed to send gift.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto animate-fade-in-up">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold gradient-text-primary mb-2">User Profile</h1>
                    <p className="text-gray-600 dark:text-gray-300">Manage your identity and interactions</p>
                </div>

                {!myAddress ? (
                    <div className="glass-premium p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-center mb-6 text-gray-800 dark:text-white">Access Profile</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Private Key</label>
                                <input
                                    type="text"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    className="input-premium"
                                    placeholder="Enter your private key"
                                />
                            </div>
                            <button
                                onClick={handleLogin}
                                className="w-full btn-premium py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg"
                            >
                                Access Profile
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Profile Card */}
                        <div className="glass-premium p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20"></div>
                            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl shadow-xl border-4 border-white dark:border-gray-800">
                                    👤
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Anonymous User</h2>
                                    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 mb-4 inline-block max-w-full">
                                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">{myAddress}</p>
                                    </div>
                                    <div className="flex justify-center md:justify-start space-x-6 text-sm">
                                        <div className="text-center">
                                            <span className="block font-bold text-lg text-gray-900 dark:text-white">0</span>
                                            <span className="text-gray-500">Following</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold text-lg text-gray-900 dark:text-white">0</span>
                                            <span className="text-gray-500">Followers</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Card */}
                        <div className="glass-premium p-8">
                            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                                <span>🎁</span> Send Gift / Follow
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target Address</label>
                                    <input
                                        type="text"
                                        value={targetAddress}
                                        onChange={(e) => setTargetAddress(e.target.value)}
                                        className="input-premium font-mono text-sm"
                                        placeholder="Public Key of user to gift"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Amount (COIN)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="input-premium"
                                            placeholder="10"
                                        />
                                        <div className="absolute right-4 top-3 text-gray-400 font-bold text-sm">COIN</div>
                                    </div>
                                </div>
                                <button
                                    onClick={sendGift}
                                    disabled={loading}
                                    className="w-full btn-premium py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>Send Gift 🎁</>
                                    )}
                                </button>
                                {status && (
                                    <div className={`p-4 rounded-xl text-center text-sm font-medium animate-fade-in ${status.includes('success')
                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                        }`}>
                                        {status}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
