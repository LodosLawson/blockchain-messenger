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
            title: 'Best Framework?',
            options: ['React', 'Vue', 'Angular']
        }
    },

    USER_REGISTRY: {
        name: 'User Registry',
        description: 'Decentralized user profile system',
        requiredParams: [],
        methods: ['register', 'getUser'],
        example: {}
    }
};

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
function getTemplate(type) {
    return contractTemplates[type];
}

function getAllTemplates() {
    return contractTemplates;
}

module.exports = {
    contractTemplates,
    getTemplate,
    getAllTemplates,
    validateParams
};
