"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { decryptMessage, getPublicFromPrivate } from '../utils/crypto';
import { API_URL } from '../config';

interface Transaction {
  amount: string;
  message?: string;
  sender: string;
  recipient: string;
  transactionId: string;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  hash: string;
  previousBlockHash: string;
}

interface BlockchainData {
  chain: Block[];
  pendingTransactions: Transaction[];
}

export default function BlockchainViewer() {
  const [blockchain, setBlockchain] = useState<BlockchainData | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [myPublicKey, setMyPublicKey] = useState('');

  useEffect(() => {
    const key = localStorage.getItem('blockchain_private_key');
    if (key) {
      setPrivateKey(key);
      const pub = getPublicFromPrivate(key);
      if (pub) setMyPublicKey(pub);
    }
  }, []);

  const fetchBlockchain = async () => {
    try {
      const response = await axios.get(`${API_URL}/blockchain`);
      setBlockchain(response.data);
    } catch (error) {
      console.error("Error fetching blockchain:", error);
    }
  };

  useEffect(() => {
    fetchBlockchain();
    const interval = setInterval(fetchBlockchain, 5000);
    return () => clearInterval(interval);
  }, []);

  const getDecryptedMessage = (tx: Transaction) => {
    if (!tx.message) return null;

    // If I am the recipient, try to decrypt
    if (privateKey && tx.recipient === myPublicKey) {
      const decrypted = decryptMessage(privateKey, tx.sender, tx.message);
      if (decrypted) return { text: decrypted, isDecrypted: true };
    }

    // If I am the sender, try to decrypt (using recipient's public key? No, I need my private key and recipient's public key... wait.
    // ECDH Shared Secret is same for (MyPriv + TheirPub) AND (TheirPriv + MyPub).
    // So if I am sender, I can decrypt using MyPriv + RecipientPub.
    if (privateKey && tx.sender === myPublicKey) {
      const decrypted = decryptMessage(privateKey, tx.recipient, tx.message);
      if (decrypted) return { text: decrypted, isDecrypted: true };
    }

    return { text: tx.message, isDecrypted: false };
  };

  if (!blockchain) return <div className="text-center p-4">Loading Blockchain...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Blockchain Explorer</h2>
        <button
          onClick={fetchBlockchain}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {blockchain.chain.slice().reverse().map((block) => (
          <div key={block.index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                  Block #{block.index}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(block.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                Hash: {block.hash.substring(0, 15)}...
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transactions ({block.transactions.length})</h4>
              {block.transactions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No transactions in this block.</p>
              ) : (
                <ul className="space-y-2">
                  {block.transactions.map((tx) => {
                    const msgData = getDecryptedMessage(tx);
                    return (
                      <li key={tx.transactionId} className="text-sm bg-gray-50 p-2 rounded dark:bg-gray-700">
                        <div className="flex justify-between">
                          <span className="font-semibold text-indigo-600 truncate w-1/3" title={tx.sender}>
                            {tx.sender === myPublicKey ? "Me" : tx.sender}
                          </span>
                          <span className="text-gray-500 text-xs">to</span>
                          <span className="font-semibold text-indigo-600 truncate w-1/3" title={tx.recipient}>
                            {tx.recipient === myPublicKey ? "Me" : tx.recipient}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                          {msgData ? (
                            <p className={`font-medium ${msgData.isDecrypted ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'}`}>
                              {msgData.isDecrypted ? '🔓 ' : '🔒 '}
                              {msgData.isDecrypted ? msgData.text : "Encrypted Message"}
                            </p>
                          ) : (
                            <p className="text-gray-500 italic text-xs">No message</p>
                          )}
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                            {tx.amount} Coin
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
