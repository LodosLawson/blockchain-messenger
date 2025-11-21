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
          <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/wallet" className="p-4 bg-indigo-100 dark:bg-indigo-900 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition text-center">
                <p className="font-semibold text-indigo-700 dark:text-indigo-300">💼 My Wallet</p>
              </Link>
              <Link href="/explorer" className="p-4 bg-green-100 dark:bg-green-900 rounded hover:bg-green-200 dark:hover:bg-green-800 transition text-center">
                <p className="font-semibold text-green-700 dark:text-green-300">🔍 Explorer</p>
              </Link>
              <Link href="/chat" className="p-4 bg-purple-100 dark:bg-purple-900 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition text-center">
                <p className="font-semibold text-purple-700 dark:text-purple-300">💬 Chat</p>
              </Link>
              <Link href="/about" className="p-4 bg-blue-100 dark:bg-blue-900 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-center">
                <p className="font-semibold text-blue-700 dark:text-blue-300">ℹ️ About</p>
              </Link>
            </div>
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
