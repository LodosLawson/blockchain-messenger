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
  const [status, setStatus] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('blockchain_private_key');
    if (storedKey) {
      setPrivateKey(storedKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Processing...');

    if (!privateKey) {
      setStatus('Error: No wallet found. Please create one first.');
      return;
    }

    try {
      // 1. Private Key'den Public Key (Sender) türet
      const sender = getPublicFromPrivate(privateKey);
      if (!sender) {
        setStatus('Invalid Private Key!');
        return;
      }

      // 2. Encrypt Message
      const encryptedMessage = encryptMessage(privateKey, recipient, message);
      if (!encryptedMessage) {
        setStatus('Error: Encryption failed. Check recipient address.');
        return;
      }

      // 3. İşlemi İmzala
      const signature = signTransaction(privateKey, amount, recipient);

      // 4. Broadcast et
      await axios.post(`${API_URL}/transaction/broadcast`, {
        amount,
        message: encryptedMessage, // Send Encrypted Message
        sender,
        recipient,
        signature
      });

      setStatus('Message sent successfully!');
      setMessage('');
      setRecipient('');
    } catch (error: any) {
      console.error(error);
      setStatus('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!privateKey) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 text-center">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Wallet Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">You need a wallet to send messages.</p>
        <Link href="/wallet" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Create Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Send Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Recipient Public Key"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Type your message here..."
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Optional Coin)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign & Send Message
        </button>
        {status && <p className={`mt-2 text-sm text-center ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}
      </form>
    </div>
  );
}
