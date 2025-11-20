'use client';

import React, { useState, useEffect } from 'react';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export default function WalletGenerator() {
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [showPrivate, setShowPrivate] = useState(false);

    useEffect(() => {
        const storedPublic = localStorage.getItem('blockchain_public_key');
        const storedPrivate = localStorage.getItem('blockchain_private_key');
        if (storedPublic && storedPrivate) {
            setPublicKey(storedPublic);
            setPrivateKey(storedPrivate);
        }
    }, []);

    const generateWallet = () => {
        const key = ec.genKeyPair();
        const pub = key.getPublic('hex');
        const priv = key.getPrivate('hex');

        setPublicKey(pub);
        setPrivateKey(priv);

        localStorage.setItem('blockchain_public_key', pub);
        localStorage.setItem('blockchain_private_key', priv);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">My Wallet</h2>

            {!publicKey ? (
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You don't have a wallet yet. Create one to start sending messages and coins.
                    </p>
                    <button
                        onClick={generateWallet}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                    >
                        Create New Wallet
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Public Address (Share this)
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                readOnly
                                value={publicKey}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Private Key (Keep secret!)
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type={showPrivate ? "text" : "password"}
                                readOnly
                                value={privateKey}
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                            />
                            <button
                                onClick={() => setShowPrivate(!showPrivate)}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                                {showPrivate ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={generateWallet}
                            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                            Generate New Wallet (Warning: Overwrites current keys)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
