"use client";
import { useState } from 'react';

interface CreateWalletWizardProps {
    onComplete: (password: string) => void;
    onCancel: () => void;
}

export default function CreateWalletWizard({ onComplete, onCancel }: CreateWalletWizardProps) {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed1, setAgreed1] = useState(false);
    const [agreed2, setAgreed2] = useState(false);

    const handleContinue = () => {
        if (step === 1) {
            if (!password || password !== confirmPassword) {
                alert("Şifreler eşleşmiyor veya boş.");
                return;
            }
            if (!agreed1 || !agreed2) {
                alert("Lütfen tüm kutucukları işaretleyin.");
                return;
            }
            // For now, we just complete step 1 and assume flow continues or finishes.
            // The user image only showed step 1. I'll assume completing step 1 triggers the wallet creation for now, 
            // or moves to step 2 (Recovery Phrase).
            // I'll implement a mock Step 2 for completeness if needed, but for "bire bir" of the image, Step 1 is key.
            // I'll call onComplete with password.
            onComplete(password);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#101622] border border-[#232f48] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-8 md:p-12">
                    <h2 className="text-white text-3xl font-bold mb-2">Yeni Cüzdan Oluştur</h2>
                    <p className="text-[#92a4c9] text-sm mb-8">
                        Cüzdanınızı oluşturmak için adımları takip edin. Bu süreçte size bir dizi kurtarma ifadesi verilecek. Bunları güvenli bir şekilde sakladığınızdan emin olun.
                    </p>

                    <div className="bg-[#161d2b] border border-[#232f48] rounded-xl p-6 md:p-8">
                        <div className="mb-8">
                            <div className="flex justify-between text-sm font-medium text-white mb-2">
                                <span>Adım 1/3: Şifre Oluşturma</span>
                            </div>
                            <div className="h-2 bg-[#232f48] rounded-full overflow-hidden">
                                <div className="h-full bg-stitch-primary w-1/3 rounded-full"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Yeni Şifre</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-[#232f48] border border-transparent focus:border-stitch-primary rounded-lg px-4 py-3 text-white placeholder-[#64748b] outline-none transition-all"
                                        placeholder="Güçlü bir şifre girin"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92a4c9] hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-xl">visibility</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">Şifreyi Onayla</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full bg-[#232f48] border border-transparent focus:border-stitch-primary rounded-lg px-4 py-3 text-white placeholder-[#64748b] outline-none transition-all"
                                        placeholder="Şifrenizi tekrar girin"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#92a4c9] hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-xl">visibility_off</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreed1 ? 'bg-stitch-primary border-stitch-primary' : 'border-[#64748b] group-hover:border-white'}`}>
                                    {agreed1 && <span className="material-symbols-outlined text-sm text-white font-bold">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={agreed1} onChange={() => setAgreed1(!agreed1)} />
                                <span className="text-sm text-[#92a4c9] group-hover:text-white transition-colors">Kurtarma ifadelerimi kaybedersem, cüzdanıma erişimimi kaybedeceğimi anlıyorum.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreed2 ? 'bg-stitch-primary border-stitch-primary' : 'border-[#64748b] group-hover:border-white'}`}>
                                    {agreed2 && <span className="material-symbols-outlined text-sm text-white font-bold">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={agreed2} onChange={() => setAgreed2(!agreed2)} />
                                <span className="text-sm text-[#92a4c9] group-hover:text-white transition-colors">Şifremi unutursam cüzdanımı sadece kurtarma ifadelerimle geri yükleyebilirim.</span>
                            </label>
                        </div>

                        <div className="pt-6 border-t border-[#232f48] flex justify-end">
                            <button
                                onClick={handleContinue}
                                className="bg-stitch-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
                            >
                                Devam Et
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
