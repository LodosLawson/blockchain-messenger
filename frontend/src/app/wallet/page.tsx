"use client";
import { useState, useEffect } from 'react';
import { generateKeys, getPublicFromPrivate } from '../../utils/crypto';
import axios from 'axios';
import TransactionForm from '../../components/TransactionForm';
import CreateWalletWizard from '../../components/CreateWalletWizard';
import { API_URL } from '../../config';
import { useWallet } from '../../context/WalletContext';

export default function WalletPage() {
    const { address, balance, nickname, refreshBalance } = useWallet();
    const [transactions, setTransactions] = useState([]);
    const [showCreateWizard, setShowCreateWizard] = useState(false);
    const [privateKeyInput, setPrivateKeyInput] = useState('');

    // Local state for non-connected wallet management (if needed)
    // Ideally we use the global context, but for "Access" we might need local input.

    useEffect(() => {
        if (address) {
            fetchTransactions(address);
        }
    }, [address]);

    const fetchTransactions = async (addr: string) => {
        try {
            const res = await axios.get(`${API_URL}/address/${addr}`);
            setTransactions(res.data.addressData.addressTransactions);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateWallet = (password: string) => {
        // In a real app, we would encrypt the key with the password.
        // For now, we just generate keys and show them (or save to context).
        const keys = generateKeys();
        // We should probably show the private key to the user here or in a "Success" step of the wizard.
        // For this "bire bir" implementation, I'll just alert it or log it, 
        // as the wizard flow in the image ends at "Devam Et".
        // I'll close the wizard and maybe show a "Wallet Created" modal or just set the wallet.

        // For demonstration, let's just set it in local storage or alert.
        alert(`Cüzdan Oluşturuldu!\nPrivate Key: ${keys.privateKey}\n(Bunu güvenli bir yere kaydedin!)`);
        setShowCreateWizard(false);
        // We could also auto-connect here if we had a way to "login" with private key in context.
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display p-6 lg:p-10">
            <div className="max-w-7xl mx-auto">
                {/* PageHeading */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Cüzdanım</h1>
                    {!address && (
                        <button
                            onClick={() => setShowCreateWizard(true)}
                            className="bg-stitch-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Yeni Cüzdan Oluştur
                        </button>
                    )}
                </div>

                {/* Card and ButtonGroup */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 p-6 bg-stitch-surface-darker rounded-xl flex flex-col justify-between shadow-lg">
                        <div>
                            <p className="text-muted-dark text-sm font-normal leading-normal">Toplam Bakiye</p>
                            <p className="text-white text-4xl font-bold leading-tight tracking-[-0.015em] mt-1">
                                {address ? `${parseFloat(balance).toFixed(4)} COIN` : '0.00 COIN'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="material-symbols-outlined text-green-500 text-lg">arrow_upward</span>
                                <p className="text-green-500 text-base font-normal leading-normal">+0.0% (son 24s)</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <p className="text-muted-dark text-sm font-normal leading-normal mb-2">Cüzdan Adresi</p>
                            <div className="flex items-center justify-between gap-3 p-3 bg-border-dark rounded-lg">
                                <p className="text-white text-sm font-mono truncate">
                                    {address || 'Cüzdan bağlı değil'}
                                </p>
                                <button
                                    onClick={() => address && navigator.clipboard.writeText(address)}
                                    aria-label="Adresi kopyala"
                                    className="p-2 rounded-md hover:bg-stitch-primary/20 transition-colors text-muted-dark hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 justify-center bg-stitch-surface-darker rounded-xl p-6 shadow-lg">
                        <button className="flex w-full min-w-[84px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 bg-stitch-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-stitch-primary/90 transition-colors shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                            <span className="material-symbols-outlined">arrow_upward</span>
                            <span className="truncate">Gönder</span>
                        </button>
                        <button className="flex w-full min-w-[84px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 bg-border-dark text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#344463] transition-colors">
                            <span className="material-symbols-outlined">arrow_downward</span>
                            <span className="truncate">Al</span>
                        </button>
                        <button className="flex w-full min-w-[84px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-lg h-12 px-5 bg-border-dark text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#344463] transition-colors">
                            <span className="material-symbols-outlined">swap_horiz</span>
                            <span className="truncate">Takas Et</span>
                        </button>
                    </div>
                </div>

                {/* Assets & Transactions Section */}
                <div className="bg-stitch-surface-darker rounded-xl p-6 shadow-lg mb-8">
                    {/* SectionHeader */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">Varlıklarım</h2>
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark">search</span>
                            <input className="w-full bg-border-dark border-none rounded-lg h-10 pl-10 pr-4 text-white text-sm placeholder:text-muted-dark focus:ring-2 focus:ring-stitch-primary outline-none" placeholder="Varlıklarda ara..." type="text" />
                        </div>
                    </div>
                    {/* Assets Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 text-sm font-medium text-muted-dark">Varlık</th>
                                    <th className="p-4 text-sm font-medium text-muted-dark">Bakiye</th>
                                    <th className="p-4 text-sm font-medium text-muted-dark">Değer</th>
                                    <th className="p-4 text-sm font-medium text-muted-dark">24s Değişim</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-stitch-primary flex items-center justify-center text-white font-bold text-xs">SC</div>
                                        <div>
                                            <p className="font-bold text-white">Stitch Coin</p>
                                            <p className="text-sm text-muted-dark">COIN</p>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-white">{address ? parseFloat(balance).toFixed(4) : '0.00'} COIN</td>
                                    <td className="p-4 font-mono text-white">$ {address ? (parseFloat(balance) * 1.0).toFixed(2) : '0.00'}</td>
                                    <td className="p-4 text-green-500 font-medium">+0.00%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-stitch-surface-darker rounded-xl p-6">
                    <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">İşlem Geçmişi</h2>
                    <div className="border-b border-white/10 mb-4">
                        <nav className="flex space-x-4">
                            <button className="px-3 py-2 text-sm font-medium border-b-2 border-stitch-primary text-stitch-primary">Tümü</button>
                            <button className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-muted-dark hover:text-white">Gelen</button>
                            <button className="px-3 py-2 text-sm font-medium border-b-2 border-transparent text-muted-dark hover:text-white">Giden</button>
                        </nav>
                    </div>
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <p className="text-muted-dark text-center py-4">Henüz işlem yok.</p>
                        ) : (
                            transactions.map((tx: any, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${tx.sender === address ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                            <span className={`material-symbols-outlined ${tx.sender === address ? 'text-red-400' : 'text-green-400'}`}>
                                                {tx.sender === address ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {tx.sender === address ? 'Gönderilen' : 'Alınan'} COIN
                                            </p>
                                            <p className="text-sm text-muted-dark">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-medium ${tx.sender === address ? 'text-red-400' : 'text-green-400'}`}>
                                            {tx.sender === address ? '-' : '+'}{tx.amount} COIN
                                        </p>
                                        <p className="text-sm text-muted-dark">Başarılı</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Wallet Wizard Modal */}
            {showCreateWizard && (
                <CreateWalletWizard
                    onComplete={handleCreateWallet}
                    onCancel={() => setShowCreateWizard(false)}
                />
            )}
        </div>
    );
}
