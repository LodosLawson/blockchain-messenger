const sha256 = require('sha256');
const { v4: uuidv4 } = require('uuid');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    const port = process.argv[2] || 3001;
    this.currentNodeUrl = process.argv[3] || `http://localhost:${port}`;
    this.networkNodes = [];

    // Version System
    this.version = "1.0.0";
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();

    // Ekonomi Modeli
    this.miningReward = 100; // Blok başına ödül
    this.totalSupply = 0;
    this.maxSupply = 100000000; // 100 Milyon Coin

    // Genesis Block
    this.createNewBlock(100, '0', '0');
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        version: this.version,
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };

    // Mining ödülü ile toplam arzı güncelle
    if (this.totalSupply < this.maxSupply) {
        this.totalSupply += this.miningReward;
    }

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    // Update blockchain timestamp
    this.updatedAt = new Date().toISOString();

    return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
};

// Yeni Transaction Yapısı (İmzalı)
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient, signature) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuidv4().split('-').join(''),
        timestamp: Date.now(),
        version: this.version,
        signature: signature
    };

    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {
    // İşlem geçerli mi kontrol et (İmza doğrulama)
    if (!this.verifyTransaction(transactionObj)) {
        throw new Error('Invalid transaction signature!');
    }

    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};

// İşlem İmza Doğrulama
Blockchain.prototype.verifyTransaction = function (transaction) {
    // Mining ödülleri (sender = "00") imza gerektirmez
    if (transaction.sender === "00") return true;

    if (!transaction.signature || transaction.signature.length === 0) {
        return false;
    }

    const key = ec.keyFromPublic(transaction.sender, 'hex');
    const msgHash = sha256(transaction.amount.toString() + transaction.recipient);

    return key.verify(msgHash, transaction.signature);
};

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;

    for (var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];

        const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
        if (blockHash.substring(0, 4) !== '0000') validChain = false;

        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;

        // Blok içindeki işlemleri doğrula
        for (const tx of currentBlock.transactions) {
            if (!this.verifyTransaction(tx)) {
                console.log('Invalid transaction found in chain:', tx);
                validChain = false;
            }
        }
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;

    if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;

    return validChain;
};

// Adres verilerini getir (Bakiye ve İşlemler)
Blockchain.prototype.getAddressData = function (address) {
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.sender === address || transaction.recipient === address) {
                addressTransactions.push(transaction);
            }
        });
    });

    let balance = 0;
    addressTransactions.forEach(transaction => {
        if (transaction.recipient === address) balance += parseInt(transaction.amount);
        if (transaction.sender === address) balance -= parseInt(transaction.amount);
    });

    return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    };
};

// Get Blockchain Info (Version, Stats, Last Update)
Blockchain.prototype.getBlockchainInfo = function () {
    return {
        version: this.version,
        blockCount: this.chain.length,
        pendingTransactions: this.pendingTransactions.length,
        totalSupply: this.totalSupply,
        maxSupply: this.maxSupply,
        miningReward: this.miningReward,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        lastBlock: this.getLastBlock()
    };
};

module.exports = Blockchain;
