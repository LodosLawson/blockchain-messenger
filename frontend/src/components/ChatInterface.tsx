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
            // Fetch transactions for both sender and recipient
            // Note: This is inefficient for large histories. Ideally backend should provide a chat endpoint.
            // For now, we fetch address data for both and filter.
            const [myResponse, recipientResponse] = await Promise.all([
                axios.get(`${API_URL}/address/${address}`),
                axios.get(`${API_URL}/address/${recipient.address}`)
            ]);

            const myTxs = myResponse.data.addressData.addressTransactions;
            const recipientTxs = recipientResponse.data.addressData.addressTransactions;

            const allTxs = [...myTxs, ...recipientTxs];

            // Filter for messages between me and recipient
            const chatMessages = allTxs.filter((tx: any) => {
                const isFromMe = tx.sender === address && tx.recipient === recipient.address;
                const isToMe = tx.sender === recipient.address && tx.recipient === address;
                return (isFromMe || isToMe) && tx.message; // Only include transactions with messages
            });

            // Deduplicate based on transactionId
            const uniqueMessages = Array.from(new Map(chatMessages.map((m: any) => [m.transactionId, m])).values());

            // Sort by timestamp
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
            // Sign the message
            // Note: The backend expects signature of "amount + recipient"
            // But we should probably include the message in the signature for security?
            // The backend verifyTransaction currently checks: amount.toString() + recipient
            // Let's stick to that for now to pass verification, but ideally we should sign the message too.
            // Wait, if I don't sign the message, anyone can replay the signature with a different message!
            // CRITICAL: The backend verifyTransaction MUST be updated to include message in signature verification if we want secure chat.
            // For now, I will use the existing verification logic: amount + recipient.
            // This means the message content is NOT authenticated by the signature in the current backend logic.
            // I will proceed with this for the prototype, but note it as a security improvement.

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
            fetchMessages(); // Refresh immediately
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
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                        {recipient.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">@{recipient.username}</h3>
                        <p className="text-xs text-gray-500 font-mono">{recipient.address.substring(0, 8)}...</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No messages yet.</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.sender === address;
                        return (
                            <div key={msg.transactionId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                                    }`}>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={sending || !isConnected}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || !isConnected}
                        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
