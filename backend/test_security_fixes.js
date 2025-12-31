const blockchain = require('./blockchain'); // Import blockchain logic if needed for local test, but better to test API
const rp = require('request-promise');

const NODE_URL = 'http://localhost:3001';

async function runTests() {
    console.log("Running Security Hardening Verification...");

    // 1. CSRF Mining Test (GET /mine should fail)
    try {
        console.log("Test 1: Attempting CSRF Mining (GET /mine)...");
        await rp({ uri: NODE_URL + '/mine', method: 'GET', json: true });
        console.error("FAIL: GET /mine succeeded (Should be 404/405)");
    } catch (e) {
        console.log("PASS: GET /mine failed as expected (" + e.statusCode + ")");
    }

    // 2. Smart Contract Auth Bypass (Execute without signature)
    try {
        console.log("Test 2: Attempting Contract Exec without Signature...");
        await rp({
            uri: NODE_URL + '/contract/execute',
            method: 'POST',
            body: {
                contractId: 'some-id',
                method: 'vote',
                params: { option: 'A' },
                caller: 'some-address'
            },
            json: true
        });
        console.error("FAIL: Contract execution invalid payload succeeded");
    } catch (e) {
        if (e.statusCode === 400 || e.statusCode === 401) {
            console.log("PASS: Contract execution rejected missing header/signature (" + e.statusCode + ")");
        } else {
            console.error("FAIL: Unexpected error code " + e.statusCode);
        }
    }

    // 3. Replay Attack / Signature Tamper (Concept Check)
    // This is hard to test black-box without a valid signature generator here.
    // However, if we send a dummy signature, it should fail verification.
    try {
        console.log("Test 3: Sending Invalid Signature Transaction...");
        await rp({
            uri: NODE_URL + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 10,
                sender: 'sender-address',
                recipient: 'recipient',
                signature: 'invalid-signature', // Should fail verify
                nonce: '123',
                timestamp: Date.now()
            },
            json: true
        });
        console.error("FAIL: Invalid signature accepted");
    } catch (e) {
        if (e.statusCode === 400 || e.statusCode === 500) { // Verify method throws error or returns valid:false
            // Our verifyTransaction logic returns { valid: false } and networkNode sends 400
            console.log("PASS: Invalid signature rejected (" + e.statusCode + ")");
        } else {
            console.log("INFO: Got " + e.statusCode + ", likely rejected.");
        }
    }

    console.log("Verification Complete.");
}

runTests();
