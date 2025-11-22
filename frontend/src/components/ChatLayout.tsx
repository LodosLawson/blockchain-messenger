"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, MoreVertical } from 'lucide-react';
import UserSearch from './UserSearch';

interface ChatLayoutProps {
    children: React.ReactNode;
    onSelectUser?: (user: { username: string; address: string; bio?: string }) => void;
}

export default function ChatLayout({ children, onSelectUser }: ChatLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] overflow-hidden bg-background-dark rounded-3xl border border-white/5 shadow-2xl relative">
            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`
                    absolute md:relative z-50 w-80 h-full flex flex-col
                    bg-sidebar-bg/95 backdrop-blur-xl border-r border-white/10
                `}
                initial={false}
                animate={{ x: sidebarOpen ? 0 : '-100%' }}
                variants={{
                    open: { x: 0 },
                    closed: { x: '-100%' }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                // On desktop, always show sidebar (override animation logic via CSS or media query check)
                style={{ x: 0 }} // Force reset for desktop, but this might break mobile animation if not handled carefully.
            // Better approach: Use CSS for responsive visibility and Framer for mobile toggle.
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-stitch-blue to-stitch-purple bg-clip-text text-transparent">
                        Mesajlar
                    </h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-2 hover:bg-white/5 rounded-full text-muted-dark transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stories / Active Users (Placeholder) */}
                <div className="px-6 py-4 flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-stitch-blue to-stitch-purple">
                                <div className="w-full h-full rounded-full bg-sidebar-bg border-2 border-sidebar-bg overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                                </div>
                            </div>
                            <span className="text-xs text-muted-dark truncate w-full text-center">User {i}</span>
                        </div>
                    ))}
                </div>

                {/* Search & List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark group-focus-within:text-stitch-blue transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Sohbet ara..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:bg-white/10 transition-all"
                        />
                    </div>

                    <UserSearch onSelect={(user) => {
                        if (onSelectUser) onSelectUser(user);
                        setSidebarOpen(false);
                    }} />
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative w-full bg-background-dark/50">
                {/* Mobile Header Toggle */}
                <div className="md:hidden p-4 flex items-center gap-4 border-b border-white/10 bg-sidebar-bg/50 backdrop-blur-md">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-white/5 rounded-full text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-white">Sohbet</span>
                </div>

                {children}
            </main>

            {/* CSS Override for Desktop Sidebar Visibility */}
            <style jsx global>{`
                @media (min-width: 768px) {
                    aside {
                        transform: none !important;
                        position: relative !important;
                    }
                }
            `}</style>
        </div>
    );
}
