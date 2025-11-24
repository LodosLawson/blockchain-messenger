const Block = require('./Block');
const Transaction = require('./Transaction');
const Storage = require('../persistence/Storage');

class Blockchain {
    constructor(storageFilename = 'blockchain.json') {
        this.storage = new Storage(storageFilename);
        const storedChain = this.storage.loadBlockchain();
        if (storedChain) {
            this.chain = storedChain.map(blockData => {
                const block = new Block(blockData.timestamp, blockData.transactions, blockData.previousHash);
                block.hash = blockData.hash;
                block.nonce = blockData.nonce;
                return block;
            });
            this.pendingTransactions = [];
        } else {
            this.chain = [this.createGenesisBlock()];
            this.pendingTransactions = [];
            this.save();
        }
        this.difficulty = 2;
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block(1732450000000, [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);

        this.pendingTransactions = [];
        this.save();
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    save() {
        this.storage.saveBlockchain(this.chain);
    }

    replaceChain(newChain) {
        if (newChain.length <= this.chain.length) {
            console.log("Received chain is not longer than the current chain.");
            return;
        } else if (!this.isValidChain(newChain)) {
            console.log("Received chain is not valid.");
            return;
        }

        console.log("Replacing blockchain with the new chain.");
        this.chain = newChain;
        this.save();
    }

    isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(this.createGenesisBlock())) {
            console.log("Genesis block mismatch");
            console.log("Received:", JSON.stringify(chain[0]));
            console.log("Expected:", JSON.stringify(this.createGenesisBlock()));
            return false;
        }

        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];

            // Reconstruct block to verify hash
            const blockObj = new Block(currentBlock.timestamp, currentBlock.transactions, currentBlock.previousHash);
            blockObj.nonce = currentBlock.nonce;
            blockObj.hash = currentBlock.hash;

            if (currentBlock.hash !== blockObj.calculateHash()) {
                console.log("Invalid hash at block " + i);
                console.log("Current:", currentBlock.hash);
                console.log("Calculated:", blockObj.calculateHash());
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log("Invalid previous hash at block " + i);
                return false;
            }
        }
        return true;
    }
}

module.exports = Blockchain;
