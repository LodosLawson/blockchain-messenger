export default function AboutPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-white">
                About Blockchain Messenger
            </h1>

            {/* What is it */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                    What is Blockchain Messenger?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Blockchain Messenger is a decentralized messaging application built on blockchain technology.
                    Unlike traditional messaging apps, your messages are stored on an immutable blockchain,
                    ensuring they cannot be deleted, modified, or censored by any central authority.
                </p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <p className="text-indigo-800 dark:text-indigo-200">
                        <strong>Key Features:</strong>
                    </p>
                    <ul className="list-disc list-inside mt-2 text-indigo-700 dark:text-indigo-300 space-y-1">
                        <li>End-to-end encryption (E2EE)</li>
                        <li>Decentralized storage</li>
                        <li>No central server control</li>
                        <li>Built-in cryptocurrency economy</li>
                        <li>Immutable message history</li>
                    </ul>
                </div>
            </section>

            {/* How Encryption Works */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                    🔐 How Encryption Works
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                    <p>
                        Your messages are protected using military-grade encryption:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>
                            <strong>ECDH (Elliptic Curve Diffie-Hellman):</strong> Creates a shared secret between you and the recipient
                        </li>
                        <li>
                            <strong>AES-256:</strong> Encrypts your message using the shared secret
                        </li>
                        <li>
                            <strong>Digital Signatures:</strong> Proves the message is from you and hasn't been tampered with
                        </li>
                    </ol>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm font-mono">
                            Plain text: "Hello, Alice!" <br />
                            Encrypted: "U2FsdGVkX1+3K7..." <br />
                            Only you and Alice can decrypt it!
                        </p>
                    </div>
                </div>
            </section>

            {/* How to Use */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                    📖 How to Use
                </h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            1. Create Your Wallet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Go to the <a href="/wallet" className="text-indigo-600 hover:underline">Wallet</a> page and click "Create New Wallet".
                            Save your private key securely - you'll need it to access your account!
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            2. Register a Nickname
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Choose a unique nickname so others can find you easily. Your nickname is linked to your public key.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            3. Find Friends
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Use the <a href="/chat" className="text-indigo-600 hover:underline">Chat</a> page to search for users by nickname.
                            You can also share your public key directly.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            4. Send Messages
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            On the home page, enter the recipient's public key, type your message, and click "Sign & Send Message".
                            Your message will be encrypted and added to the blockchain!
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            5. View Messages
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Check the <a href="/explorer" className="text-indigo-600 hover:underline">Blockchain Explorer</a> to see all transactions.
                            Messages you sent or received will be automatically decrypted for you.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                    ❓ FAQ
                </h2>
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            Can I delete my messages?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            No. Once a message is added to the blockchain, it's permanent. This is by design -
                            it ensures no one can censor or modify your messages.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            What if I lose my private key?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Unfortunately, there's no way to recover it. Your private key is the only way to access
                            your wallet and decrypt your messages. Keep it safe!
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            Can others see my messages?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            They can see that a message exists, but they cannot read it. Only you and the recipient
                            have the keys needed to decrypt the message content.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            What are coins for?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Coins are the built-in cryptocurrency. You can send coins along with messages, or just
                            send messages without any coins (amount = 0).
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                            How do I get coins?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Mining! When you mine a block (visit /mine endpoint), you receive a mining reward.
                            You can also receive coins from other users.
                        </p>
                    </div>
                </div>
            </section>

            {/* Security Notes */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
                    🛡️ Security Notes
                </h2>
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <h3 className="font-semibold text-red-800 dark:text-red-200 mb-3">
                        Important Security Reminders:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-red-700 dark:text-red-300">
                        <li>Never share your private key with anyone</li>
                        <li>Store your private key in a secure location (not just localStorage)</li>
                        <li>This is a demonstration app - don't use it for sensitive communications</li>
                        <li>Messages are permanent and cannot be deleted</li>
                        <li>Your nickname is public and linked to your public key</li>
                    </ul>
                </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t dark:border-gray-700 text-center text-gray-500">
                <p>Built with ❤️ using blockchain technology</p>
                <p className="text-sm mt-2">
                    <a href="/" className="text-indigo-600 hover:underline">Home</a> ·
                    <a href="/wallet" className="text-indigo-600 hover:underline ml-2">Wallet</a> ·
                    <a href="/chat" className="text-indigo-600 hover:underline ml-2">Chat</a> ·
                    <a href="/explorer" className="text-indigo-600 hover:underline ml-2">Explorer</a>
                </p>
            </div>
        </div>
    );
}
