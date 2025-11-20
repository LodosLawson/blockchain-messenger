const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

console.log('--- Blockchain Test Başlıyor ---');

// 1. Genesis Blok Kontrolü
console.log('\n1. Genesis Blok:');
console.log(bitcoin.chain[0]);

// 2. Yeni İşlem Ekleme
console.log('\n2. İşlem Ekleniyor...');
const blockIndex = bitcoin.addTransactionToPendingTransactions({
    amount: 100,
    sender: 'ALICEADDRESS',
    recipient: 'BOBADDRESS',
    senderSignature: 'valid-signature-mock' // Test için mock imza
});
console.log(`İşlem ${blockIndex}. bloğa eklenecek.`);

// 3. Mining (PoW) Testi
console.log('\n3. Mining Başlıyor...');
const lastBlock = bitcoin.getLastBlock();
const previousBlockHash = lastBlock['hash'];
const currentBlockData = {
    transactions: bitcoin.pendingTransactions,
    index: lastBlock['index'] + 1
};

const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

console.log('Yeni Blok Oluşturuldu:');
console.log(newBlock);

// 4. Zincir Geçerlilik Kontrolü
console.log('\n4. Zincir Geçerliliği Kontrol Ediliyor...');
const isValid = bitcoin.chainIsValid(bitcoin.chain);
console.log('Zincir Geçerli mi? ' + (isValid ? 'EVET' : 'HAYIR'));

console.log('\n--- Test Tamamlandı ---');
