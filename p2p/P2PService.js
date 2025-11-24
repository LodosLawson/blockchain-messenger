const WebSocket = require('ws');

const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
const MESSAGE_TYPES = {
    CHAIN: 'CHAIN',
    TRANSACTION: 'TRANSACTION',
    REQUEST_CHAIN: 'REQUEST_CHAIN'
};

class P2PService {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    listen() {
        const server = new WebSocket.Server({ port: P2P_PORT });
        server.on('connection', socket => this.connectSocket(socket));
        console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
        this.connectToPeers();
    }

    connectToPeers() {
        peers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => this.connectSocket(socket));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');
        this.messageHandler(socket);
        this.sendChain(socket);
    }

    messageHandler(socket) {
        socket.on('message', message => {
            const data = JSON.parse(message);
            switch (data.type) {
                case MESSAGE_TYPES.CHAIN:
                    this.blockchain.replaceChain(data.chain);
                    break;
                case MESSAGE_TYPES.TRANSACTION:
                    this.blockchain.addTransaction(data.transaction);
                    break;
                case MESSAGE_TYPES.REQUEST_CHAIN:
                    this.sendChain(socket);
                    break;
            }
        });
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.CHAIN,
            chain: this.blockchain.chain
        }));
    }

    syncChains() {
        this.sockets.forEach(socket => this.sendChain(socket));
    }

    broadcastTransaction(transaction) {
        this.sockets.forEach(socket => socket.send(JSON.stringify({
            type: MESSAGE_TYPES.TRANSACTION,
            transaction
        })));
    }

    broadcastChain() {
        this.sockets.forEach(socket => {
            this.sendChain(socket);
        });
    }
}

module.exports = P2PService;
