"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { signTransaction, getPublicFromPrivate, encryptMessage } from '../utils/crypto';
import Link from 'next/link';
import { API_URL } from '../config';

export default function TransactionForm() {
  const [amount, setAmount] = useState('0');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('blockchain_private_key');
    if (storedKey) {
      setPrivateKey(storedKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing transaction...' });

    if (!privateKey) {
      setStatus({ type: 'error', message: 'No wallet found. Please create one first.' });
      setLoading(false);
      return;
    }

    try {
      // 1. Derive Public Key (Sender) from Private Key
      const sender = getPublicFromPrivate(privateKey);
      if (!sender) {
        setStatus({ type: 'error', message: 'Invalid Private Key!' });
        setLoading(false);
        return;
      }

      // 2. Encrypt Message
      const encryptedMessage = encryptMessage(privateKey, recipient, message);
      if (!encryptedMessage) {
        setStatus({ type: 'error', message: 'Encryption failed. Check recipient address.' });
        setLoading(false);
        return;
      }

      // 3. Sign Transaction
      const signature = signTransaction(privateKey, amount, recipient);

      // 4. Broadcast
      await axios.post(`${API_URL}/transaction/broadcast`, {
        amount,
        message: encryptedMessage, // Send Encrypted Message
        sender,
        recipient,
        signature
      });

      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setMessage('');
      setRecipient('');
      setAmount('0');
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!privateKey) {
    return (
      <div className="clean-card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Wallet Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You need a wallet to send secure messages.</p>
        <Link href="/wallet" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl">
          Create Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="clean-card p-8 animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <span>✉️</span> Send Message
        </h2>
        <div className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-mono">
          Encrypted
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
            placeholder="Enter recipient's public key..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[120px]"
            placeholder="Type your secure message here..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Amount (Optional Coin)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
            <div className="absolute right-4 top-3 text-gray-400 font-bold text-sm">COIN</div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>Sign & Send Message 🚀</>
          )}
        </button>

        {status && (
          <div className={`p-4 rounded-lg text-sm font-medium animate-fade-in ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}
