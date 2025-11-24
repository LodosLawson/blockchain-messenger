const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:3001';
const BLOCKCHAIN_FILE = path.join(__dirname, 'data', 'blockchain.json');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body || '{}')));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTest() {
    console.log('Starting Persistence Test...');

    // 1. Start Server
    console.log('Starting server...');
    const server = spawn('node', ['server.js'], { stdio: 'inherit' });
    await sleep(3000);

    try {
        // 2. Mine a block
        console.log('Mining a block...');
        await makeRequest('POST', '/mine', { rewardAddress: 'tester' });
        await sleep(1000);

        // 3. Verify block count
        let chain = await makeRequest('GET', '/blocks');
        console.log(`Chain length before restart: ${chain.length}`);
        if (chain.length < 2) throw new Error('Mining failed');

        // 4. Stop Server
        console.log('Stopping server...');
        server.kill();
        await sleep(2000);

        // 5. Restart Server
        console.log('Restarting server...');
        const server2 = spawn('node', ['server.js'], { stdio: 'inherit' });
        await sleep(3000);

        // 6. Verify persistence
        console.log('Verifying persistence...');
        chain = await makeRequest('GET', '/blocks');
        console.log(`Chain length after restart: ${chain.length}`);

        if (chain.length >= 2) {
            console.log('SUCCESS: Blockchain persisted across restart!');
        } else {
            console.error('FAILURE: Blockchain data lost!');
        }

        server2.kill();
    } catch (error) {
        console.error('Test failed:', error);
        server.kill();
    }
}

runTest();
