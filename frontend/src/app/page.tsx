import TransactionForm from '../components/TransactionForm';
import BlockchainViewer from '../components/BlockchainViewer';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Send Message
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-300">
            Encrypted & Secure Decentralized Messaging
          </p>
        </div>

        <div className="p-6">
          <TransactionForm />
        </div>

        {/* Blockchain Viewer */}
        <div className="glass-card overflow-hidden rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recent Blocks
            </h2>
            <p className="text-green-100 mt-1">Live blockchain data</p>
          </div>
          <div className="p-6">
            <BlockchainViewer />
          </div>
        </div>

        {/* Features Section */}
        <div className="glass-card p-8 rounded-2xl shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-white/20">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
            Why Blockchain Messenger?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">End-to-End Encryption</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Your messages are encrypted with ECDH + AES-256. Only you and the recipient can read them.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Decentralized</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                No central server. Your messages are stored on a distributed blockchain network.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Immutable</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Once sent, messages cannot be deleted or modified. Permanent and tamper-proof.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          <p>Built with ❤️ using Next.js, TypeScript, and Blockchain Technology</p>
        </div>
      </div>
    </main>
  );
}
