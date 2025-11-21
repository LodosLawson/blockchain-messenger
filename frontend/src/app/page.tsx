import TransactionForm from '../components/TransactionForm';
import BlockchainViewer from '../components/BlockchainViewer';
import Link from 'next/link';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center py-16 animate-fade-in-up">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                🔒 End-to-End Encrypted Messaging
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text-primary">
              Blockchain
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">
              Messenger
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Send secure, encrypted messages on the blockchain.
            <span className="font-semibold text-indigo-600 dark:text-indigo-400"> Decentralized</span>,
            <span className="font-semibold text-purple-600 dark:text-purple-400"> Immutable</span>, and
            <span className="font-semibold text-pink-600 dark:text-pink-400"> Private</span>.
          </p>

          <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/chat">
              <Button
                variant="gradient"
                size="lg"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              >
                Start Chatting
              </Button>
            </Link>
            <Link href="/explorer">
              <Button
                variant="secondary"
                size="lg"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Explore Blockchain
              </Button>
            </Link>
          </div>
        </div>

        {/* Transaction Form */}
        <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <Card variant="glass" glow>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Message
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Broadcast your encrypted message to the blockchain network
              </p>
            </div>
            <TransactionForm />
          </Card>
        </div>

        {/* Blockchain Viewer */}
        <div className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <Card variant="glass">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 -m-6 mb-6 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Recent Blocks
              </h2>
              <p className="text-green-100 mt-1">Live blockchain data - updated in real-time</p>
            </div>
            <BlockchainViewer />
          </Card>
        </div>

        {/* Features Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose <span className="gradient-text-primary">Blockchain Messenger</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card variant="glass" hover glow>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300 animate-float">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                  End-to-End Encryption
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Military-grade encryption with <span className="font-semibold text-indigo-600 dark:text-indigo-400">ECDH + AES-256</span>.
                  Only you and the recipient can read your messages.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card variant="glass" hover glow>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.5s' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                  Fully Decentralized
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  No central server, no single point of failure. Your messages are stored on a
                  <span className="font-semibold text-green-600 dark:text-green-400"> distributed blockchain network</span>.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card variant="glass" hover glow>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '1s' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                  Immutable & Permanent
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Once sent, messages cannot be deleted or modified.
                  <span className="font-semibold text-pink-600 dark:text-pink-400"> Tamper-proof</span> and
                  <span className="font-semibold text-red-600 dark:text-red-400"> permanent</span> record.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-scale-in" style={{ animationDelay: '0.7s' }}>
          <Card variant="glass" hover>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text-primary mb-2">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Encrypted</div>
            </div>
          </Card>
          <Card variant="glass" hover>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text-primary mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Available</div>
            </div>
          </Card>
          <Card variant="glass" hover>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text-primary mb-2">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Downtime</div>
            </div>
          </Card>
          <Card variant="glass" hover>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text-primary mb-2">∞</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Scalable</div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
