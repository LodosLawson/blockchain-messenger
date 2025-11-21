"use client";
import React, { useState } from 'react';
import UserSearch from './UserSearch';

interface ChatLayoutProps {
    children: React.ReactNode;
    onSelectUser?: (user: { username: string; address: string; bio?: string }) => void;
}

export default function ChatLayout({ children, onSelectUser }: ChatLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
                <UserSearch onSelect={onSelectUser} />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col w-full">
                <div className="md:hidden p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold">Chat</span>
                </div>
                {children}
            </div>
        </div>
    );
}
