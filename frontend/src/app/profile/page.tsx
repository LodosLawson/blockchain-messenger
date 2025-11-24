"use client";
import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Copy, Check, Edit2 } from 'lucide-react';

export default function ProfilePage() {
    const { address, nickname, isConnected } = useWallet();
    const [activeTab, setActiveTab] = useState('profile');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [status, setStatus] = useState('online');
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = () => {
        alert('Profil kaydedildi!');
    };

    return (
        <div className="min-h-screen bg-background-dark">
            <div className="mx-auto max-w-4xl p-6 lg:p-10">
                <div className="mb-8">
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        Profil ve Ayarlar
                    </h1>
                    <p className="text-muted-dark text-base">
                        Profil bilgilerinizi ve gizlilik tercihlerinizi yönetin.
                    </p>
                </div>

                <div className="mb-8 border-b border-white/10">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 pt-4 border-b-[3px] transition-colors ${activeTab === 'profile'
                                    ? 'border-stitch-blue text-stitch-blue'
                                    : 'border-transparent text-muted-dark hover:text-white'
                                }`}
                        >
                            <p className="text-sm font-bold tracking-wide">Profil Bilgileri</p>
                        </button>
                        <button
                            onClick={() => setActiveTab('privacy')}
                            className={`pb-3 pt-4 border-b-[3px] transition-colors ${activeTab === 'privacy'
                                    ? 'border-stitch-blue text-stitch-blue'
                                    : 'border-transparent text-muted-dark hover:text-white'
                                }`}
                        >
                            <p className="text-sm font-bold tracking-wide">Gizlilik ve Güvenlik</p>
                        </button>
                    </div>
                </div>

                {activeTab === 'profile' && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-stitch-blue to-stitch-purple flex items-center justify-center text-white text-4xl font-bold">
                                    {nickname ? nickname[0].toUpperCase() : 'U'}
                                </div>
                                <button className="absolute bottom-1 right-1 w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border-2 border-sidebar-bg transition-colors">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {nickname || 'Kullanıcı Adı'}
                                </h2>
                                <p className="text-muted-dark">
                                    Durum mesajı burada yer alacak.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-white text-base font-medium mb-2">
                                        Ad
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:ring-2 focus:ring-stitch-blue/20 transition-all"
                                        placeholder="Adınız"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white text-base font-medium mb-2">
                                        Soyad
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:ring-2 focus:ring-stitch-blue/20 transition-all"
                                        placeholder="Soyadınız"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white text-base font-medium mb-2">
                                    Durum Mesajı
                                </label>
                                <input
                                    type="text"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-muted-dark focus:outline-none focus:border-stitch-blue/50 focus:ring-2 focus:ring-stitch-blue/20 transition-all"
                                    placeholder="Bir durum mesajı yazın..."
                                />
                            </div>

                            <div>
                                <label className="block text-white text-base font-medium mb-2">
                                    Durum
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-stitch-blue/50 focus:ring-2 focus:ring-stitch-blue/20 transition-all"
                                >
                                    <option value="online">Çevrimiçi</option>
                                    <option value="away">Dışarıda</option>
                                    <option value="dnd">Rahatsız Etmeyin</option>
                                    <option value="invisible">Görünmez</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-white text-base font-medium mb-2">
                                    Cüzdan Adresi
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address || 'Bağlı değil'}
                                        readOnly
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-muted-dark font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCopyAddress}
                                        disabled={!address}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md text-muted-dark hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                            <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-colors">
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-gradient-to-r from-stitch-blue to-stitch-purple hover:opacity-90 text-white rounded-lg font-bold transition-opacity"
                            >
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Gizlilik Ayarları</h3>
                            <p className="text-muted-dark">
                                Gizlilik ayarları yakında eklenecek...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
