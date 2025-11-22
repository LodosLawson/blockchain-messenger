"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';

export default function Sidebar() {
    const pathname = usePathname();
    const { address, nickname } = useWallet();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: 'Sohbetler', path: '/chat', icon: 'chat' },
        { name: 'Kişiler', path: '/contacts', icon: 'group' },
        { name: 'Cüzdan', path: '/wallet', icon: 'account_balance_wallet' },
        { name: 'Ayarlar', path: '/profile', icon: 'settings' },
        { name: 'Keşfet', path: '/explorer', icon: 'explore' },
    ];

    return (
        <aside className="flex flex-col w-72 glass-strong p-6 shrink-0 h-screen sticky top-0 border-r border-white/10 hidden md:flex backdrop-blur-xl">
            {/* User Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 mb-8 p-4 glass rounded-2xl"
            >
                <div className="flex items-center gap-4">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-14 border-2 border-stitch-blue/40 shadow-glow-blue ring-2 ring-white/10"
                        style={{ backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=' + (address || 'guest') + '")' }}
                    ></div>
                    <div className="flex flex-col overflow-hidden flex-1">
                        <h1 className="text-white text-lg font-bold leading-normal truncate">
                            {nickname || (address ? `${address.substring(0, 6)}...` : 'Misafir')}
                        </h1>
                        <p className="text-accent-green text-sm font-medium leading-normal flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse shadow-glow-blue"></span>
                            Çevrimiçi
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 flex-grow">
                {navItems.map((item, index) => (
                    <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive(item.path)
                                    ? 'glass-premium text-stitch-blue shadow-glow-blue'
                                    : 'text-muted-dark hover:glass hover:text-white'
                                }`}
                        >
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-gradient-to-r from-stitch-blue/20 to-stitch-purple/20 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span
                                className={`material-symbols-outlined transition-all duration-300 group-hover:scale-110 relative z-10 ${isActive(item.path) ? 'text-stitch-blue' : ''
                                    }`}
                                style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {item.icon}
                            </span>
                            <p className="text-sm font-semibold leading-normal relative z-10">{item.name}</p>
                        </Link>
                    </motion.div>
                ))}
            </nav>

            {/* New Message Button */}
            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-4 bg-gradient-to-r from-stitch-blue to-stitch-purple text-white text-sm font-bold leading-normal tracking-wide transition-all shadow-glow-blue hover:shadow-glow-purple mt-4"
            >
                <span className="material-symbols-outlined">add</span>
                <span className="truncate">Yeni Mesaj</span>
            </motion.button>
        </aside>
    );
}
