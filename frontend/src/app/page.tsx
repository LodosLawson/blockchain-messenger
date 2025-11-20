import TransactionForm from '../components/TransactionForm';
import BlockchainViewer from '../components/BlockchainViewer';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Decentralized Messenger & Economy
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Secure, Encrypted, Blockchain-based.
          </p>

          <div className="mt-6 flex justify-center space-x-4">
            <Link href="/wallet" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              My Wallet
            </Link>
            <Link href="/explorer" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Explorer
            </Link>
            <Link href="/profile" className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
              Profile & Gifts
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <TransactionForm />
          </div>
          <div>
            <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 h-full">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Network Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="text-green-500 font-semibold">Active</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Consensus</span>
                  <span className="text-gray-800 dark:text-gray-200">Proof of Work</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max Supply</span>
                  <span className="text-gray-800 dark:text-gray-200">100,000,000 COIN</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BlockchainViewer />
      </div>
    </main>
  );
}
