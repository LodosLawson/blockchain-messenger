const sha256 = require('sha256');
const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const SmartContract = require('./smartContract');

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    this.contracts = []; // Smart contracts
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

    // Mining Parametreleri
    this.difficulty = 4; // Başlangıç difficulty (hash'in başında kaç sıfır olacak)
    this.targetBlockTime = 10000; // Hedef blok süresi (ms) - 10 saniye
    this.difficultyAdjustmentInterval = 10; // Her 10 blokta bir difficulty ayarla

    // Genesis Block
    this.createNewBlock(100, '0', '0');

    // Deploy System Contracts
    this.deployContract('USER_REGISTRY', '00', {});

    // Initialize Account Balances
    this.accountBalances = {};
    this.initializeBalances();
}

Blockchain.prototype.initializeBalances = function () {
    this.accountBalances = {};
    this.chain.forEach(block => {
        this.updateBalancesForBlock(block);
    });
    console.log('Account balances initialized:', this.accountBalances);
};

Blockchain.prototype.updateBalancesForBlock = function (block) {
    block.transactions.forEach(transaction => {
        const { sender, recipient, amount } = transaction;
        const amountInt = parseInt(amount);

        if (sender !== "00") {
            if (!this.accountBalances[sender]) this.accountBalances[sender] = 0;
            this.accountBalances[sender] -= amountInt;
        }

        if (!this.accountBalances[recipient]) this.accountBalances[recipient] = 0;
        this.accountBalances[recipient] += amountInt;
    });
};

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        version: this.version,
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash,
        difficulty: this.difficulty // Bloğun oluşturulduğu andaki difficulty
    };

    // Mining ödülü ile toplam arzı güncelle
    if (this.totalSupply < this.maxSupply) {
        this.totalSupply += this.miningReward;
    }

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    // Update balances with the new block
    this.updateBalancesForBlock(newBlock);

    // Update blockchain timestamp
    this.updatedAt = new Date().toISOString();

    // Difficulty ayarlama (her difficultyAdjustmentInterval blokta bir)
    this.adjustDifficulty();

    return newBlock;
};

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
};

// Yeni Transaction Yapısı (İmzalı)
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient, signature, message = '') {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        message: message, // Chat message
        transactionId: uuidv4().split('-').join(''),
        timestamp: Date.now(),
        version: this.version,
        signature: signature
    };

    return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {
    // İşlem geçerli mi kontrol et (İmza doğrulama ve Bakiye kontrolü)
    const verification = this.verifyTransaction(transactionObj);
    if (!verification.valid) {
        throw new Error(`Invalid transaction: ${verification.reason}`);
    }

    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
};

// İşlem İmza Doğrulama (EVM Compatible)
Blockchain.prototype.verifyTransaction = function (transaction) {
    // Mining ödülleri (sender = "00") imza gerektirmez
    if (transaction.sender === "00") return { valid: true };

    if (!transaction.signature || transaction.signature.length === 0) {
        return { valid: false, reason: 'No signature' };
    }

    try {
        // 1. İmza Doğrulama
        // Mesajı oluştur (imzalanan veri)
        // Not: Frontend tarafında da aynı formatta imzalanmalı!
        const message = transaction.amount.toString() + transaction.recipient;

        // İmzayı doğrulayan adresi bul
        const recoveredAddress = ethers.utils.verifyMessage(message, transaction.signature);

        // Gönderen adresi ile eşleşiyor mu?
        if (recoveredAddress.toLowerCase() !== transaction.sender.toLowerCase()) {
            return { valid: false, reason: 'Invalid signature' };
        }

        // 2. Bakiye Kontrolü (Security Fix)
        const senderBalance = this.accountBalances[transaction.sender] || 0;
        // Bekleyen işlemleri de hesaba katmak gerekebilir ama şimdilik confirmed balance yeterli
        // Daha güvenli olması için pendingTransactions içindeki harcamaları da düşmeliyiz
        let pendingDebit = 0;
        this.pendingTransactions.forEach(tx => {
            if (tx.sender === transaction.sender) {
                pendingDebit += parseInt(tx.amount);
            }
        });

        if (senderBalance < (parseInt(transaction.amount) + pendingDebit)) {
            return { valid: false, reason: 'Insufficient balance' };
        }

        return { valid: true };

    } catch (error) {
        console.error('Signature verification failed:', error);
        return { valid: false, reason: 'Verification error' };
    }
};

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
};

Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    const target = '0'.repeat(this.difficulty); // Dinamik difficulty

    while (hash.substring(0, this.difficulty) !== target) {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
};

Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;

    // Chain validasyonu sırasında bakiyeleri yeniden hesaplayarak tutarlılığı kontrol edebiliriz
    // Ancak bu işlem pahalı olabilir. Şimdilik temel blok validasyonuna odaklanalım.

    for (var i = 1; i < blockchain.length; i++) {
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i - 1];

        const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
        // Dinamik difficulty kontrolü
        // Not: Eski bloklar o anki difficulty ile oluşturuldu, ancak burada güncel difficulty kontrol ediliyor olabilir.
        // Doğrusu her bloğun kendi difficulty değerini kaydetmesi ve ona göre kontrol edilmesidir.
        // Bizim yapımızda block.difficulty var.
        const target = '0'.repeat(currentBlock.difficulty || this.difficulty);
        if (blockHash.substring(0, (currentBlock.difficulty || this.difficulty)) !== target) validChain = false;

        if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;

        // Blok içindeki işlemleri doğrula
        // Not: Geçmiş işlemleri doğrularken o anki bakiyeyi bilmek zordur.
        // Bu yüzden sadece imza kontrolü yapıyoruz.
        // Full node senkronizasyonunda genesis'ten itibaren bakiye hesaplayarak gitmek gerekir.
        for (const tx of currentBlock.transactions) {
            // İmza kontrolü (Bakiye kontrolü geçmiş için zor, atlıyoruz)
            if (tx.sender !== "00") {
                try {
                    const message = tx.amount.toString() + tx.recipient;
                    const recoveredAddress = ethers.utils.verifyMessage(message, tx.signature);
                    if (recoveredAddress.toLowerCase() !== tx.sender.toLowerCase()) validChain = false;
                } catch (e) {
                    validChain = false;
                }
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

// Difficulty ayarlama fonksiyonu
Blockchain.prototype.adjustDifficulty = function () {
    // Her difficultyAdjustmentInterval blokta bir difficulty ayarla
    if (this.chain.length % this.difficultyAdjustmentInterval !== 0) {
        return;
    }

    // Son difficultyAdjustmentInterval bloğun ortalama süresini hesapla
    const recentBlocks = this.chain.slice(-this.difficultyAdjustmentInterval);
    if (recentBlocks.length < 2) return;

    const timeDiff = recentBlocks[recentBlocks.length - 1].timestamp - recentBlocks[0].timestamp;
    const averageTime = timeDiff / (recentBlocks.length - 1);

    // Hedef süre ile karşılaştır
    const expectedTime = this.targetBlockTime;

    if (averageTime < expectedTime / 2) {
        // Çok hızlı - difficulty artır
        this.difficulty++;
        console.log(`Difficulty increased to ${this.difficulty}`);
    } else if (averageTime > expectedTime * 2) {
        // Çok yavaş - difficulty azalt (minimum 1)
        if (this.difficulty > 1) {
            this.difficulty--;
            console.log(`Difficulty decreased to ${this.difficulty}`);
        }
    }
};

Blockchain.prototype.getBlock = function (blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            }
        });
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    };
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

    // Bakiyeyi cache'den al (Optimization)
    let balance = this.accountBalances[address] || 0;

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
        lastBlock: this.getLastBlock(),
        difficulty: this.difficulty
    };
};

// Deploy Smart Contract
Blockchain.prototype.deployContract = function (type, creator, params) {
    const contract = new SmartContract(type, creator, params);
    this.contracts.push(contract);
    return contract;
};

// Execute Smart Contract
Blockchain.prototype.executeContract = function (contractId, method, params, caller) {
    const contract = this.contracts.find(c => c.contractId === contractId);
    if (!contract) {
        return { success: false, message: 'Contract not found' };
    }

    return contract.execute(method, params, caller);
};

// Get Contract by ID
Blockchain.prototype.getContract = function (contractId) {
    return this.contracts.find(c => c.contractId === contractId);
};

// Get All Contracts
Blockchain.prototype.getAllContracts = function () {
    return this.contracts;
};

module.exports = Blockchain;
