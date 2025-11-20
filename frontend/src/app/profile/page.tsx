"use client";
import { useState } from 'react';
import axios from 'axios';
import { signTransaction, getPublicFromPrivate } from '../../utils/crypto';

export default function ProfilePage() {
    const [privateKey, setPrivateKey] = useState('');
    const [myAddress, setMyAddress] = useState('');
    const [targetAddress, setTargetAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

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
        setStatus('Sending gift...');

        try {
            const signature = signTransaction(privateKey, amount, targetAddress);

            await axios.post('http://localhost:3001/transaction/broadcast', {
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
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">User Profile</h1>

            {!myAddress ? (
                <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Enter Private Key to Access Profile</label>
                    <input
                        type="text"
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button onClick={handleLogin} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        Access Profile
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                                👤
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Anonymous User</h2>
                                <p className="text-xs font-mono text-gray-500 break-all">{myAddress}</p>
                            </div>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Following: 0</span>
                            <span>Followers: 0</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Send Gift / Follow</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Address</label>
                                <input
                                    type="text"
                                    value={targetAddress}
                                    onChange={(e) => setTargetAddress(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="Public Key of user to gift"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (COIN)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="10"
                                />
                            </div>
                            <button onClick={sendGift} className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700">
                                Send Gift 🎁
                            </button>
                            {status && <p className="text-center text-sm mt-2 text-gray-600">{status}</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
