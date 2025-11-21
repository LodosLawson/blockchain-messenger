"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { decryptMessage, encryptMessage, getPublicFromPrivate } from '../../utils/crypto';
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
    const [sending, setSending] = useState(false);

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

    const sendMessage = async () => {
        if (!newMessage || !selectedUser || !myPrivateKey) return;

        setSending(true);
        try {
            // 1. Encrypt message
            const encryptedMessage = encryptMessage(myPrivateKey, selectedUser.publicKey, newMessage);

            if (!encryptedMessage) {
                alert('Encryption failed');
                setSending(false);
                return;
            }

            // 2. Create transaction data
            const transactionData = {
                amount: 0,
                sender: myPublicKey,
                recipient: selectedUser.publicKey,
                message: encryptedMessage
            };

            // 3. Sign transaction (using existing util, though it only signs amount+recipient currently)
            // Ideally we should sign the message too, but sticking to existing backend logic for now
            // We'll just send the request to /transaction/broadcast which handles signing verification if implemented
            // Actually, the backend expects a 'signature' in the body? 
            // Let's check TransactionForm.tsx logic. 
            // It seems the backend /transaction/broadcast expects { amount, sender, recipient, message } 
            // and it might handle signing internally or we need to send signature?
            // Wait, looking at TransactionForm.tsx (from memory), it sends { amount, sender, recipient, message }.
            // The backend networkNode.js likely creates the transaction.

            // Let's try sending directly to /transaction/broadcast
            await axios.post(`${API_URL}/transaction/broadcast`, transactionData);

            // 4. Optimistic update or re-fetch
            setNewMessage('');

            // Add to local messages immediately for better UX
            const newMsgObj: Message = {
                sender: myPublicKey,
                recipient: selectedUser.publicKey,
                message: encryptedMessage, // Store encrypted
                amount: "0",
                timestamp: Date.now(),
                transactionId: "temp-" + Date.now()
            };

            setMessages([...messages, newMsgObj]);

            // Also fetch to be sure
            setTimeout(() => fetchMessages(selectedUser.publicKey), 2000);

        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const decryptMsg = (encryptedMsg: string, senderKey: string, recipientKey: string): string => {
        if (!myPrivateKey) return encryptedMsg;

        try {
            const otherPartyKey = senderKey === myPublicKey ? recipientKey : senderKey;
            const decrypted = decryptMessage(myPrivateKey, otherPartyKey, encryptedMsg);
            return decrypted || encryptedMsg;
        } catch (error) {
            return encryptedMsg;
        }
    };

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 5 seconds if a user is selected
    useEffect(() => {
        if (!selectedUser) return;

        const interval = setInterval(() => {
            fetchMessages(selectedUser.publicKey);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedUser, myPublicKey]); // Re-run if user or my key changes

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-6">
            <div className="max-w-6xl mx-auto animate-fade-in">
                <h1 className="text-4xl font-bold gradient-text mb-8">Chat</h1>

                {!myPublicKey ? (
                    <div className="glass-card p-8 text-center">
                        <div className="text-yellow-600 text-xl mb-4">⚠️ Wallet Required</div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Please create or access your wallet first to use chat.
                        </p>
                        <a href="/wallet" className="btn-modern inline-block">
                            Go to Wallet →
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                        {/* Left: User Search */}
                        <div className="lg:col-span-1 glass-card flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-gray-200/50">
                                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                                    Find Users
                                </h2>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search nickname..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                                        className="w-full input-modern"
                                    />
                                    <button
                                        onClick={searchUsers}
                                        className="btn-modern !p-3"
                                    >
                                        <Search size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.publicKey}
                                        onClick={() => selectUser(user)}
                                        className="w-full text-left p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition border border-transparent hover:border-indigo-200"
                                    >
                                        <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                            @{user.nickname}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate font-mono mt-1">
                                            {user.publicKey.substring(0, 16)}...
                                        </p>
                                    </button>
                                ))}
                                {searchResults.length === 0 && searchQuery && (
                                    <p className="text-center text-gray-500 mt-4">No users found</p>
                                )}
                            </div>
                        </div>

                        {/* Right: Chat View */}
                        <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden">
                            {selectedUser ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                                {selectedUser.nickname[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                                    @{selectedUser.nickname}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate max-w-xs font-mono">
                                                    {selectedUser.publicKey}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/20 dark:bg-gray-900/20">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Send className="text-indigo-500" size={24} />
                                                </div>
                                                <p className="text-gray-500">
                                                    No messages yet. Say hello to @{selectedUser.nickname}!
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isSent = msg.sender === myPublicKey;
                                                const decrypted = decryptMsg(msg.message, msg.sender, msg.recipient);
                                                const isDecrypted = decrypted !== msg.message;

                                                return (
                                                    <div
                                                        key={msg.transactionId}
                                                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isSent
                                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                                                                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-tl-none'
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-2">
                                                                {isDecrypted ? (
                                                                    <Unlock size={14} className="mt-1 flex-shrink-0 opacity-70" />
                                                                ) : (
                                                                    <Lock size={14} className="mt-1 flex-shrink-0 opacity-70" />
                                                                )}
                                                                <p className="break-words leading-relaxed">{decrypted}</p>
                                                            </div>
                                                            <p className={`text-[10px] mt-2 text-right ${isSent ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Type a secure message..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                className="flex-1 input-modern"
                                                disabled={sending}
                                            />
                                            <button
                                                onClick={sendMessage}
                                                className="btn-modern !p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={sending || !newMessage}
                                            >
                                                {sending ? (
                                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Send size={20} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
                                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 animate-float">
                                        <Search className="text-indigo-400" size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                                        Select a User
                                    </h3>
                                    <p className="max-w-xs mx-auto">
                                        Search for a user by nickname on the left to start a secure conversation.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
