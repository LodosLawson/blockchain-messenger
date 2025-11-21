"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { decryptMessage, getPublicFromPrivate } from '../../utils/crypto';
import { Search, Send, Lock, Unlock } from 'lucide-react';

interface User {
    publicKey: string;
    nickname: string;
}

interface Message {
    sender: string;
    recipient: string;
    message: string;
    amount: string;
    timestamp: number;
    transactionId: string;
}

export default function ChatPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [myPublicKey, setMyPublicKey] = useState('');
    const [myPrivateKey, setMyPrivateKey] = useState('');

    useEffect(() => {
        // Load keys from localStorage
        const pubKey = localStorage.getItem('blockchain_public_key');
        const privKey = localStorage.getItem('blockchain_private_key');
        if (pubKey) setMyPublicKey(pubKey);
        if (privKey) setMyPrivateKey(privKey);
    }, []);

    const searchUsers = async () => {
        if (!searchQuery) return;

        try {
            const res = await axios.get(`${API_URL}/search-users/${searchQuery}`);
            setSearchResults(res.data.users);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const selectUser = async (user: User) => {
        setSelectedUser(user);
        setSearchResults([]);
        setSearchQuery('');

        // Fetch messages with this user
        await fetchMessages(user.publicKey);
    };

    const fetchMessages = async (userPublicKey: string) => {
        try {
            const res = await axios.get(`${API_URL}/blockchain`);
            const allTransactions: Message[] = [];

            // Extract all transactions from all blocks
            res.data.chain.forEach((block: any) => {
                block.transactions.forEach((tx: any) => {
                    if (tx.message) {
                        allTransactions.push(tx);
                    }
                });
            });

            // Filter messages between me and selected user
            const conversation = allTransactions.filter(tx =>
                (tx.sender === myPublicKey && tx.recipient === userPublicKey) ||
                (tx.sender === userPublicKey && tx.recipient === myPublicKey)
            );

            // Sort by timestamp
            conversation.sort((a, b) => a.timestamp - b.timestamp);

            setMessages(conversation);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const decryptMsg = (encryptedMsg: string, senderKey: string, recipientKey: string): string => {
        if (!myPrivateKey) return encryptedMsg;

        try {
            const otherPartyKey = senderKey === myPublicKey ? recipientKey : senderKey;
            return decryptMessage(encryptedMsg, myPrivateKey, otherPartyKey);
        } catch (error) {
            return encryptedMsg;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Chat</h1>

            {!myPublicKey ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        Please create or access your wallet first to use chat.
                    </p>
                    <a href="/wallet" className="text-indigo-600 hover:underline mt-2 inline-block">
                        Go to Wallet →
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: User Search */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                Find Users
                            </h2>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search by nickname..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                                    className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                    onClick={searchUsers}
                                    className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    <Search size={20} />
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.publicKey}
                                            onClick={() => selectUser(user)}
                                            className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                        >
                                            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                                                @{user.nickname}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.publicKey.substring(0, 20)}...
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Chat View */}
                    <div className="lg:col-span-2">
                        {selectedUser ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-[600px]">
                                {/* Chat Header */}
                                <div className="p-4 border-b dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        @{selectedUser.nickname}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate">
                                        {selectedUser.publicKey}
                                    </p>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-gray-500">
                                            No messages yet. Start the conversation!
                                        </p>
                                    ) : (
                                        messages.map((msg) => {
                                            const isSent = msg.sender === myPublicKey;
                                            const decrypted = decryptMsg(msg.message, msg.sender, msg.recipient);
                                            const isDecrypted = decrypted !== msg.message;

                                            return (
                                                <div
                                                    key={msg.transactionId}
                                                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] p-3 rounded-lg ${isSent
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            {isDecrypted ? (
                                                                <Unlock size={14} className="mt-1 flex-shrink-0" />
                                                            ) : (
                                                                <Lock size={14} className="mt-1 flex-shrink-0" />
                                                            )}
                                                            <p className="break-words">{decrypted}</p>
                                                        </div>
                                                        <p className="text-xs mt-1 opacity-70">
                                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t dark:border-gray-700">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            disabled
                                        />
                                        <button
                                            className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                            disabled
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Use the main page to send messages for now
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
                                <p className="text-gray-500">
                                    Search for a user to start chatting
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
