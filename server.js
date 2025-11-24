const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Blockchain = require('./blockchain/Blockchain');
const Transaction = require('./blockchain/Transaction');
const P2PService = require('./p2p/P2PService');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3001;

const blockchain = new Blockchain(process.env.BLOCKCHAIN_FILE || 'blockchain.json');
const p2pService = new P2PService(blockchain);

app.use(bodyParser.json());
app.use(cors());

app.get('/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/mine', (req, res) => {
    const { rewardAddress } = req.body;
    blockchain.minePendingTransactions(rewardAddress || 'system-reward');
    p2pService.broadcastChain();
    res.json({ message: 'Block successfully mined', chain: blockchain.chain });
});

app.post('/transact', (req, res) => {
    const { from, to, amount } = req.body;
    const transaction = new Transaction(from, to, amount);
    blockchain.addTransaction(transaction);
    p2pService.broadcastTransaction(transaction);
    res.json({ message: 'Transaction added to pending transactions.' });
});

app.get('/peers', (req, res) => {
    res.json(p2pService.sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
});

app.post('/addPeer', (req, res) => {
    const { peer } = req.body;
    p2pService.connectToPeers([peer]);
    res.json({ message: 'Peer added.' });
});

app.listen(HTTP_PORT, () => {
    console.log(`Listening on port ${HTTP_PORT}`);
    p2pService.listen();
});
