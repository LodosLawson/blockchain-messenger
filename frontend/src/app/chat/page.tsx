"use client";
import React, { useState } from 'react';
import ChatLayout from '../../components/ChatLayout';
import ChatInterface from '../../components/ChatInterface';

export default function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<any>(null);

    return (
        <ChatLayout onSelectUser={setSelectedUser}>
            {selectedUser ? (
                <ChatInterface recipient={selectedUser} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Select a conversation</h2>
                    <p className="max-w-xs text-center">
                        Choose a user from the sidebar or search for someone to start chatting securely on the blockchain.
                    </p>
                </div>
            )}
        </ChatLayout>
    );
}
