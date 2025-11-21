/**
 * Smart Contract Templates
 * Pre-configured templates for common contract types
 */

const contractTemplates = {
    TOKEN: {
        name: 'Token Contract',
        description: 'Create a custom token with transfer and minting capabilities',
        requiredParams: ['name', 'symbol', 'totalSupply'],
        methods: ['transfer', 'balanceOf', 'mint'],
        example: {
            name: 'MyToken',
            symbol: 'MTK',
            totalSupply: 1000000
        }
    },

    ESCROW: {
        name: 'Escrow Contract',
        description: 'Hold funds until conditions are met',
        requiredParams: ['buyer', 'seller', 'amount'],
        methods: ['deposit', 'release', 'refund'],
        example: {
            buyer: '0x123...',
            seller: '0x456...',
            amount: 100,
            condition: 'manual'
        }
    },

    VOTING: {
        name: 'Voting Contract',
        description: 'Decentralized voting system',
        requiredParams: ['title', 'options'],
        methods: ['vote', 'getResults'],
        example: {
            title: 'Choose next feature',
            options: ['Feature A', 'Feature B', 'Feature C'],
            endTime: Date.now() + 86400000 // 24 hours
        }
    }
};

function getTemplate(type) {
    return contractTemplates[type] || null;
}

function getAllTemplates() {
    return Object.keys(contractTemplates).map(key => ({
        type: key,
        ...contractTemplates[key]
    }));
}

function validateParams(type, params) {
    const template = contractTemplates[type];
    if (!template) {
        return { valid: false, message: 'Unknown contract type' };
    }

    for (const required of template.requiredParams) {
        if (!params[required]) {
            return { valid: false, message: `Missing required parameter: ${required}` };
        }
    }

    return { valid: true, message: 'Parameters valid' };
}

module.exports = {
    contractTemplates,
    getTemplate,
    getAllTemplates,
    validateParams
};
