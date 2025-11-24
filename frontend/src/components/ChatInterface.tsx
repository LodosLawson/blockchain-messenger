"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, DollarSign, MoreVertical, Check, CheckCheck } from 'lucide-react';

interface ChatInterfaceProps {
    recipient: {
        username: string;
        address: string;
        bio?: string;
    };
}

export default function ChatInterface({ recipient }: ChatInterfaceProps) {
    const { address, isConnected, signer } = useWallet();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showSendCrypto, setShowSendCrypto] = useState(false);
    const [cryptoAmount, setCryptoAmount] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (address && recipient) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [address, recipient]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!address) return;
        try {
            const [myResponse, recipientResponse] = await Promise.all([
                axios.get(`${API_URL}/address/${address}`),
                axios.get(`${API_URL}/address/${recipient.address}`)
            ]);

            const myTxs = myResponse.data.addressData.addressTransactions;
            const recipientTxs = recipientResponse.data.addressData.addressTransactions;
            const allTxs = [...myTxs, ...recipientTxs];

            const chatMessages = allTxs.filter((tx: any) => {
                const isFromMe = tx.sender === address && tx.recipient === recipient.address;
                const isToMe = tx.sender === recipient.address && tx.recipient === address;
                return (isFromMe || isToMe);
            });

            const uniqueMessages = Array.from(new Map(chatMessages.map((m: any) => [m.transactionId, m])).values());
            uniqueMessages.sort((a: any, b: any) => a.timestamp - b.timestamp);
            setMessages(uniqueMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !cryptoAmount) || !signer || !address) return;

        setSending(true);
        try {
            const amount = cryptoAmount ? parseInt(cryptoAmount) : 0;
            const messageToSign = amount.toString() + recipient.address;
            const signature = await signer.signMessage(messageToSign);

            const transactionData = {
                amount: amount,
                sender: address,
                recipient: recipient.address,
                signature: signature,
                message: newMessage
            };

            await axios.post(`${API_URL}/transaction/broadcast`, transactionData);

            setNewMessage('');
            setCryptoAmount('');
            setShowSendCrypto(false);
            fetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full relative bg-background-dark/50 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-sidebar-bg/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-stitch-blue to-stitch-purple p-[2px]">
                            <div className="w-full h-full rounded-full bg-sidebar-bg flex items-center justify-center overflow-hidden">
                                <span className="text-lg font-bold text-white">{recipient.username[0].toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-bg"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">@{recipient.username}</h3>
                        <p className="text-xs text-stitch-blue flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-stitch-blue animate-pulse"></span>
                            Online & Encrypted
                        </p>
                    </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-full text-muted-dark transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-dark opacity-50">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Send size={32} />
                        </div>
                        <p>No messages yet. Start chatting!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.sender === address;
                        const isCrypto = parseInt(msg.amount) > 0;

                        return (
                            <motion.div
                                key={msg.transactionId}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] md:max-w-[65%] group`}>
                                    <div className={`
                                        p-4 rounded-2xl shadow-lg backdrop-blur-sm border
                                        ${isMe
                                            ? 'bg-gradient-to-br from-stitch-blue to-stitch-purple text-white rounded-br-none border-white/10'
                                            : 'bg-white/10 text-white rounded-bl-none border-white/5'
                                        }
                                    `}>
                                        {/* Crypto Transfer Card */}
                                        {isCrypto && (
                                            <div className="mb-3 p-3 rounded-xl bg-black/20 border border-white/10 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs opacity-70">{isMe ? 'Sent' : 'Received'}</p>
                                                    <p className="font-bold text-lg">{msg.amount} COIN</p>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70`}>
                                            <span>{formatTime(msg.timestamp)}</span>
                                            {isMe && <CheckCheck size={12} />}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-sidebar-bg/80 backdrop-blur-md border-t border-white/10">
                <AnimatePresence>
                    {showSendCrypto && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-4 overflow-hidden"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-stitch-blue/20 flex items-center justify-center text-stitch-blue">
                                    <DollarSign size={20} />
                                </div>
                                <input
                                    type="number"
                                    placeholder="Amount (COIN)"
                                    value={cryptoAmount}
                                    onChange={(e) => setCryptoAmount(e.target.value)}
                                    className="flex-1 bg-transparent border-none text-white placeholder:text-muted-dark focus:ring-0 text-lg font-bold"
                                />
                                <button onClick={() => setShowSendCrypto(false)} className="text-muted-dark hover:text-white">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <button
                        type="button"
                        onClick={() => setShowSendCrypto(!showSendCrypto)}
                        className={`p-3 rounded-xl transition-colors ${showSendCrypto ? 'bg-stitch-blue text-white' : 'bg-white/5 text-muted-dark hover:bg-white/10 hover:text-white'}`}
                    >
                        <DollarSign size={20} />
                    </button>

                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 py-2 focus-within:border-stitch-blue/50 focus-within:bg-white/10 transition-all">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none text-white placeholder:text-muted-dark focus:ring-0 max-h-32 py-2"
                            disabled={sending}
                        />
                        <button type="button" className="text-muted-dark hover:text-white p-1">
                            <Paperclip size={18} />
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={sending || (!newMessage.trim() && !cryptoAmount)}
                        className="p-3 rounded-xl bg-gradient-to-r from-stitch-blue to-stitch-purple text-white shadow-lg hover:shadow-stitch-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
