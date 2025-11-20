# Blockchain Messenger

Decentralized messaging application with end-to-end encryption built on blockchain technology.

## Features

- 🔐 **End-to-End Encryption** - Messages encrypted using ECDH + AES
- 💰 **Cryptocurrency Economy** - Built-in token system with mining rewards
- 🔗 **P2P Network** - Decentralized node communication
- 👛 **Wallet Management** - Generate and manage ECDSA key pairs
- 🌐 **Hybrid Networking** - Cloud and local nodes can communicate

## Tech Stack

**Backend:**
- Node.js + Express
- Custom Blockchain Implementation
- Elliptic Curve Cryptography (secp256k1)

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Quick Start

### Backend
```bash
cd backend
npm install
node networkNode.js 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## Google Cloud Deployment

See [deployment guide](https://console.cloud.google.com/run) for instructions.

Project ID: `blockchain-message-economy`

## License

MIT
