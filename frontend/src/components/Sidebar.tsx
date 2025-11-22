"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../context/WalletContext';

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
        <aside className="flex flex-col w-64 bg-sidebar-bg p-4 shrink-0 h-screen sticky top-0 border-r border-border-dark/50 hidden md:flex">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-stitch-primary/20"
                        style={{ backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=' + (address || 'guest') + '")' }}
                    ></div>
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-white text-base font-medium leading-normal truncate">
                            {nickname || (address ? `${address.substring(0, 6)}...` : 'Misafir')}
                        </h1>
                        <p className="text-green-400 text-sm font-normal leading-normal flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Çevrimiçi
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-grow">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${isActive(item.path)
                                ? 'bg-stitch-primary/20 text-stitch-primary shadow-glow-sm'
                                : 'text-muted-dark hover:bg-surface-dark hover:text-white'
                            }`}
                    >
                        <span
                            className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isActive(item.path) ? 'font-variation-fill' : ''}`}
                            style={{ fontVariationSettings: isActive(item.path) ? "'FILL' 1" : "'FILL' 0" }}
                        >
                            {item.icon}
                        </span>
                        <p className="text-sm font-medium leading-normal">{item.name}</p>
                    </Link>
                ))}
            </nav>

            <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-stitch-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-stitch-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                <span className="truncate">Yeni Mesaj</span>
            </button>
        </aside>
    );
}
