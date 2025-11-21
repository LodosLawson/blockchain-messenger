import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './modern.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Blockchain Messenger - Secure Decentralized Chat',
    description: 'End-to-end encrypted messaging on blockchain. Secure, private, and decentralized.',
    manifest: '/manifest.json',
    themeColor: '#667eea',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Blockchain Messenger',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#667eea" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={inter.className}>
                {children}
                <script dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js').then(
                                    function(registration) {
                                        console.log('ServiceWorker registration successful');
                                    },
                                    function(err) {
                                        console.log('ServiceWorker registration failed: ', err);
                                    }
                                );
                            });
                        }
                    `
                }} />
            </body>
        </html>
    )
}
