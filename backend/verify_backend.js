const rp = require('request-promise');
const { ethers } = require('ethers');

const BASE_URL = 'http://localhost:3001';

async function runTests() {
    console.log('Starting Backend Verification...');

    try {
        // 1. Test Root Endpoint
        console.log('\n1. Testing Root Endpoint (GET /)...');
        const rootResponse = await rp({ uri: BASE_URL + '/', method: 'GET' });
        console.log('✅ Root Endpoint:', rootResponse);

        // 2. Get Blockchain (Initial)
        console.log('\n2. Fetching Blockchain (GET /blockchain)...');
        const chainStep1 = await rp({ uri: BASE_URL + '/blockchain', method: 'GET', json: true });
        console.log(`✅ Blockchain retrieved. Current length: ${chainStep1.chain.length}`);

        // 3. Create Transaction with EVM signature
        console.log('\n3. Creating Transaction (POST /transaction/broadcast)...');

        // Generate a random wallet for testing
        const wallet = ethers.Wallet.createRandom();
        const sender = wallet.address;
        const recipientWallet = ethers.Wallet.createRandom();
        const recipient = recipientWallet.address;
        const amount = 100;

        // Sign data: amount + recipient (matches blockchain.js verifyTransaction logic)
        const messageToSign = amount.toString() + recipient;
        const signature = await wallet.signMessage(messageToSign);

        const transactionResult = await rp({
            uri: BASE_URL + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: amount,
                sender: sender,
                recipient: recipient,
                signature: signature
            },
            json: true
        });
        console.log('✅ Transaction Result:', transactionResult.note);

        // 4. Mine Block
        console.log('\n4. Mining Block (GET /mine)...');
        const mineResult = await rp({ uri: BASE_URL + '/mine', method: 'GET', json: true });
        console.log('✅ Mining Result:', mineResult.note);
        console.log('   New Block Index:', mineResult.block.index);

        // 5. Get Blockchain (Final)
        console.log('\n5. Fetching Blockchain (Final Check)...');
        const chainStep2 = await rp({ uri: BASE_URL + '/blockchain', method: 'GET', json: true });
        console.log(`✅ Blockchain retrieved. New length: ${chainStep2.chain.length}`);

        if (chainStep2.chain.length > chainStep1.chain.length) {
            console.log('\n🎉 SUCCESS: Chain length increased correctly.');
        } else {
            console.error('\n❌ FAILURE: Chain length did not increase.');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.error) console.error('   Details:', error.error);
    }
}

runTests();
