const Blockchain = require('./blockchain');
const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');

(async () => {
    console.log('Starting Backend Verification...');

    const bitcoin = new Blockchain();

    // 1. Test Genesis Block
    console.log('\n1. Testing Genesis Block...');
    const genesisBlock = bitcoin.getLastBlock();
    if (genesisBlock.index === 1 && genesisBlock.nonce === 100) {
        console.log('✅ Genesis block valid.');
    } else {
        console.error('❌ Genesis block invalid.');
    }

    // 2. Test Balance Initialization
    console.log('\n2. Testing Balance Initialization...');
    // Genesis block has no transactions usually, or maybe a mining reward?
    // In our code: this.createNewBlock(100, '0', '0'); -> No transactions initially.
    // But verifyTransaction allows sender "00" (mining reward).

    // Let's mine a block to get some rewards.
    // Mining reward is 100.
    console.log('Mining block 1...');
    bitcoin.createNewBlock(234, 'PREV_HASH', 'HASH');
    // Block 2 created. Mining reward should be added?
    // In createNewBlock: if (this.totalSupply < this.maxSupply) this.totalSupply += this.miningReward;
    // But it doesn't automatically create a transaction for the reward in the block itself?
    // networkNode.js handles creating the reward transaction *after* mining.
    // Blockchain.js doesn't auto-add reward tx in createNewBlock.
    // So we need to manually add a reward tx to pending transactions before mining.

    const nodeAddress = uuidv4().split('-').join('');
    const rewardTx = bitcoin.createNewTransaction(100, "00", nodeAddress, "");
    bitcoin.addTransactionToPendingTransactions(rewardTx);

    console.log('Mining block 2 with reward...');
    bitcoin.createNewBlock(345, 'PREV_HASH_2', 'HASH_2');

    // Check balance
    const data = bitcoin.getAddressData(nodeAddress);
    console.log(`Balance for ${nodeAddress}: ${data.addressBalance}`);

    if (data.addressBalance === 100) {
        console.log('✅ Mining reward balance correct.');
    } else {
        console.error(`❌ Mining reward balance incorrect. Expected 100, got ${data.addressBalance}`);
    }

    // 3. Test Insufficient Balance
    console.log('\n3. Testing Insufficient Balance Security Fix...');
    const wallet = ethers.Wallet.createRandom();
    const recipient = uuidv4().split('-').join('');

    // Try to send 50 coins (Balance is 0)
    const tx1 = bitcoin.createNewTransaction(50, wallet.address, recipient, "");
    // Sign it
    const message1 = tx1.amount.toString() + tx1.recipient;
    tx1.signature = await wallet.signMessage(message1);

    try {
        bitcoin.addTransactionToPendingTransactions(tx1);
        console.error('❌ Failed: Transaction with insufficient balance was accepted!');
    } catch (e) {
        console.log('✅ Success: Transaction rejected as expected:', e.message);
    }

    // 4. Test Valid Transaction
    console.log('\n4. Testing Valid Transaction...');
    // Transfer from nodeAddress (balance 100) to wallet.address
    // We need to sign this? "00" doesn't need signature, but nodeAddress is a regular user?
    // Wait, nodeAddress is just a string. We don't have its private key to sign!
    // In networkNode.js, the nodeAddress is generated randomly. It doesn't seem to have a private key associated in the simple implementation?
    // Ah, networkNode.js: const nodeAddress = uuidv4()...
    // It seems the node acts as a wallet but without a private key in this simple demo?
    // Or maybe verifyTransaction skips signature for nodeAddress?
    // No, verifyTransaction checks signature for everyone except "00".
    // So networkNode.js implementation of mining reward (sender "00") is fine.
    // But if I want to spend FROM nodeAddress, I need its private key.
    // The current implementation of networkNode.js generates a random string as address, so it CANNOT sign transactions!
    // This means the node cannot spend its mining rewards!
    // That's a logic flaw in the original code, but I'm testing my changes.

    // Let's simulate a user with balance.
    // I'll manually inject a balance for testing purposes or mine to a wallet I control.

    const myWallet = ethers.Wallet.createRandom();
    const myAddress = myWallet.address;

    // Mine a reward to myWallet
    const rewardTx2 = bitcoin.createNewTransaction(100, "00", myAddress, "");
    bitcoin.addTransactionToPendingTransactions(rewardTx2);
    bitcoin.createNewBlock(456, 'PREV_HASH_3', 'HASH_3');

    // Check my balance
    const myData = bitcoin.getAddressData(myAddress);
    console.log(`My Balance: ${myData.addressBalance}`); // Should be 100

    // Now try to spend 50
    const tx2 = bitcoin.createNewTransaction(50, myAddress, recipient, "");
    const message2 = tx2.amount.toString() + tx2.recipient;
    tx2.signature = await myWallet.signMessage(message2);

    try {
        bitcoin.addTransactionToPendingTransactions(tx2);
        console.log('✅ Valid transaction accepted.');
    } catch (e) {
        console.error('❌ Valid transaction rejected:', e.message);
    }

    // 5. Test Double Spend (Pending Balance Check)
    console.log('\n5. Testing Double Spend (Pending Balance)...');
    // I have 100, spent 50 (pending). Remaining effective balance should be 50.
    // Try to spend 60.
    const tx3 = bitcoin.createNewTransaction(60, myAddress, recipient, "");
    const message3 = tx3.amount.toString() + tx3.recipient;
    tx3.signature = await myWallet.signMessage(message3);

    try {
        bitcoin.addTransactionToPendingTransactions(tx3);
        console.error('❌ Failed: Double spend accepted!');
    } catch (e) {
        console.log('✅ Success: Double spend rejected:', e.message);
    }

    console.log('\nVerification Complete.');
})();
