// using request-promise
// Using native http to avoid extra dependencies if axios isn't there, but package.json likely has none.
// Actually backend/package.json has 'request-promise' (rp). I can use that or just fetch if node version supports it.
// Let's use 'request-promise' since it's in the project.

const rp = require('request-promise');

const BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBlockCount() {
    const info = await rp({ uri: `${BASE_URL}/blockchain/info`, json: true });
    return info.blockCount;
}

async function sendTestMessage(mode) {
    console.log(`Sending ${mode} message...`);
    await rp({
        uri: `${BASE_URL}/transaction/broadcast`,
        method: 'POST',
        body: {
            amount: 0,
            sender: "00", // System sender to skip invalid sig check if strictly enforced, or use dummy
            // The backend verifyTransaction allows sender="00" to skip checks.
            // But wait, the code I modified checks signature if sender != "00".
            // Let's use "00" for simplicity, or I need to generate a valid sig.
            // Using "00" is easier for mining trigger test.
            recipient: "TEST_RECIPIENT",
            signature: "",
            message: `Test ${mode} message`,
            mode: mode
        },
        json: true
    });
}

async function verifyFastMode() {
    console.log('--- Testing FAST Mode ---');
    const startCount = await getBlockCount();
    console.log(`Start block count: ${startCount}`);

    await sendTestMessage('fast');

    // Give it a moment to mine
    await sleep(2000);

    const endCount = await getBlockCount();
    console.log(`End block count: ${endCount}`);

    if (endCount > startCount) {
        console.log('PASS: Fast mode mined immediately.');
    } else {
        console.error('FAIL: Fast mode did not mine immediately.');
    }
}

async function runTests() {
    try {
        await verifyFastMode();
        // Normal/Slow are hard to test quickly without mocking time, 
        // but checking logs or seeing it NOT mine immediately would be a partial verification.

        console.log('--- Verification Complete ---');
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

// Wait for server to start manually if needed, or run this after server is up.
runTests();
