const { spawn } = require('child_process');
const http = require('http');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(port, method, path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body || '{}'));
                } catch (e) {
                    console.error(`Failed to parse JSON from ${port} ${path}:`, body);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runP2PTest() {
    console.log('Starting P2P Synchronization Test...');

    // 1. Start Node 1
    console.log('Starting Node 1 (Port 3001, P2P 5001)...');
    const node1 = spawn('node', ['server.js'], {
        stdio: 'inherit',
        env: { ...process.env, HTTP_PORT: 3001, P2P_PORT: 5001, BLOCKCHAIN_FILE: 'blockchain_node1.json' }
    });
    await sleep(3000);

    // 2. Start Node 2 (Connected to Node 1)
    console.log('Starting Node 2 (Port 3002, P2P 5002)...');
    const node2 = spawn('node', ['server.js'], {
        stdio: 'inherit',
        env: { ...process.env, HTTP_PORT: 3002, P2P_PORT: 5002, PEERS: 'ws://localhost:5001', BLOCKCHAIN_FILE: 'blockchain_node2.json' }
    });
    await sleep(3000);

    try {
        // 3. Mine on Node 1
        console.log('Mining on Node 1...');
        await makeRequest(3001, 'POST', '/mine', { rewardAddress: 'miner1' });
        await sleep(2000);

        // 4. Check Node 2 Chain
        console.log('Checking Node 2 chain...');
        const chain2 = await makeRequest(3002, 'GET', '/blocks');
        console.log(`Node 2 Chain Length: ${chain2.length}`);

        if (chain2.length >= 2) {
            console.log('SUCCESS: Node 2 synced with Node 1!');
        } else {
            console.error('FAILURE: Node 2 did not sync.');
        }

        node1.kill();
        node2.kill();
    } catch (error) {
        console.error('Test failed:', error);
        node1.kill();
        node2.kill();
    }
}

runP2PTest();
