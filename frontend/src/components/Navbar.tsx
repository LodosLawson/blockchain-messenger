"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';

export default function Navbar() {
    const pathname = usePathname();
    const { isConnected, address, connectWallet, disconnectWallet } = useWallet();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Cüzdan', path: '/wallet' },
        { name: 'Sohbet', path: '/chat' },
        { name: 'Kontratlar', path: '/contracts' },
        { name: 'Keşfet', path: '/explorer' },
    ];

    const formatAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 glass-strong backdrop-blur-xl">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-3 group">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 bg-gradient-to-br from-stitch-blue to-stitch-purple rounded-xl flex items-center justify-center text-white font-bold shadow-glow-blue"
                        >
                            B
                        </motion.div>
                        <span className="hidden font-bold sm:inline-block text-xl text-gradient">
                            Blockchain Messenger
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${isActive(item.path)
                                        ? 'glass-premium text-stitch-blue shadow-glow-blue'
                                        : 'text-muted-dark hover:glass hover:text-white'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isConnected && address ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={disconnectWallet}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30 transition-all shadow-lg"
                        >
                            {formatAddress(address)}
                        </motion.button>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={connectWallet}
                            className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-stitch-blue to-stitch-purple text-white transition-all shadow-glow-blue hover:shadow-glow-purple"
                        >
                            Cüzdan Bağla
                        </motion.button>
                    )}

                    {/* Mobile Menu (Simple) */}
                    <div className="flex md:hidden">
                        <div className="flex items-center gap-4 overflow-x-auto pb-1 custom-scrollbar">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`text-sm whitespace-nowrap font-semibold ${isActive(item.path)
                                            ? 'text-stitch-blue'
                                            : 'text-muted-dark hover:text-white'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
