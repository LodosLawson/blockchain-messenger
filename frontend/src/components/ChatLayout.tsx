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
        <div className="flex h-[calc(100vh-5rem)] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 overflow-hidden rounded-2xl shadow-2xl border border-white/20 m-4">
            {/* Sidebar Backdrop (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                absolute md:relative z-30 w-80 h-full 
                bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-700
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                    <div className="flex items-center justify-between mb-6 md:hidden">
                        <h2 className="text-xl font-bold gradient-text-primary">Contacts</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <UserSearch onSelect={(user) => {
                        if (onSelectUser) onSelectUser(user);
                        setSidebarOpen(false);
                    }} />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col w-full relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
                {/* Mobile Header */}
                <div className="md:hidden p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-white/20 dark:border-gray-700 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-lg gradient-text-primary">Blockchain Chat</span>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </div>
        </div>
    );
}
