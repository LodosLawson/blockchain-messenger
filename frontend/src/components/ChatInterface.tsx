"use client";
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config';
import { ethers } from 'ethers';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (address && recipient) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
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
                return (isFromMe || isToMe) && tx.message;
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
        if (!newMessage.trim() || !signer || !address) return;

        setSending(true);
        try {
            const amount = 0;
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
        <div className="flex flex-col h-full relative">
            {/* Chat Header */}
            <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {recipient.username[0].toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">@{recipient.username}</h3>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Online & Encrypted</p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800">
                    <svg className="w-4 h-4 text-indigo-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">Secured by Blockchain</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in-up">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Start the secure conversation!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.sender === address;
                        return (
                            <div key={msg.transactionId} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-scale-in`}>
                                <div className={`max-w-[80%] md:max-w-[60%] group relative`}>
                                    <div className={`
                                        px-5 py-3 rounded-2xl shadow-sm text-sm md:text-base
                                        ${isMe
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-md'
                                        }
                                    `}>
                                        <p className="leading-relaxed">{msg.message}</p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            <span>{formatTime(msg.timestamp)}</span>
                                            {isMe && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transaction Hash Tooltip */}
                                    <div className={`
                                        absolute -bottom-6 ${isMe ? 'right-0' : 'left-0'} 
                                        text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity
                                        flex items-center gap-1
                                    `}>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Tx: {msg.transactionId.substring(0, 8)}...
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-white/20 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a secure message..."
                            className="w-full pl-5 pr-12 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner"
                            disabled={sending || !isConnected}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || !isConnected}
                        className={`
                            p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
                            shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 
                            transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                            flex items-center justify-center
                        `}
                    >
                        {sending ? (
                            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
