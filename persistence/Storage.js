const fs = require('fs');
const path = require('path');

class Storage {
    constructor(filename = 'blockchain.json') {
        this.dataDir = path.join(__dirname, '../data');
        this.filePath = path.join(this.dataDir, filename);

        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir);
        }
    }

    saveBlockchain(chain) {
        fs.writeFileSync(this.filePath, JSON.stringify(chain, null, 2));
    }

    loadBlockchain() {
        if (fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath);
            return JSON.parse(data);
        }
        return null;
    }
}

module.exports = Storage;
