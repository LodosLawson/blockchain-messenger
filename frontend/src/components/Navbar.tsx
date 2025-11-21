"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../context/WalletContext';

export default function Navbar() {
    const pathname = usePathname();
    const { isConnected, address, connectWallet, disconnectWallet } = useWallet();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Wallet', path: '/wallet' },
        { name: 'Chat', path: '/chat' },
        { name: 'Contracts', path: '/contracts' },
        { name: 'Explorer', path: '/explorer' },
    ];

    const formatAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all">
                            B
                        </div>
                        <span className="hidden font-bold sm:inline-block text-xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            Blockchain Messenger
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive(item.path)
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isConnected && address ? (
                        <button
                            onClick={disconnectWallet}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                            {formatAddress(address)}
                        </button>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                        >
                            Connect Wallet
                        </button>
                    )}

                    {/* Mobile Menu (Simple) */}
                    <div className="flex md:hidden">
                        <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`text-sm whitespace-nowrap ${isActive(item.path)
                                        ? 'font-bold text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-500 dark:text-gray-400'
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
