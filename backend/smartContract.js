const { v4: uuidv4 } = require('uuid');

/**
 * Smart Contract Class
 * Simple contract execution engine for blockchain
 */
class SmartContract {
    constructor(type, creator, params) {
        this.contractId = uuidv4().split('-').join('');
        this.type = type; // 'TOKEN', 'ESCROW', 'VOTING', 'USER_REGISTRY'
        this.creator = creator;
        this.params = params;
        this.state = this.initializeState(type, params);
        this.createdAt = Date.now();
        this.version = "1.0.0";
        this.executionHistory = [];
    }

    initializeState(type, params) {
        switch (type) {
            case 'TOKEN':
                return {
                    name: params.name,
                    symbol: params.symbol,
                    totalSupply: params.totalSupply || 1000000,
                    balances: {
                        [this.creator]: params.totalSupply || 1000000
                    }
                };

            case 'ESCROW':
                return {
                    buyer: params.buyer,
                    seller: params.seller,
                    amount: params.amount,
                    deposited: 0,
                    released: false,
                    refunded: false,
                    condition: params.condition || 'manual'
                };

            case 'VOTING':
                return {
                    title: params.title,
                    options: params.options || [],
                    votes: {},
                    voters: [],
                    endTime: params.endTime || (Date.now() + 86400000) // 24 hours default
                };

            case 'USER_REGISTRY':
                return {
                    users: {}, // address -> { username, avatar, bio }
                    usernames: {} // username -> address (for uniqueness check)
                };

            default:
                return {};
        }
    }

    execute(method, methodParams, caller) {
        const result = {
            success: false,
            message: '',
            newState: null
        };

        try {
            switch (this.type) {
                case 'TOKEN':
                    return this.executeTokenMethod(method, methodParams, caller);
                case 'ESCROW':
                    return this.executeEscrowMethod(method, methodParams, caller);
                case 'VOTING':
                    return this.executeVotingMethod(method, methodParams, caller);
                case 'USER_REGISTRY':
                    return this.executeUserRegistryMethod(method, methodParams, caller);
                default:
                    result.message = 'Unknown contract type';
                    return result;
            }
        } catch (error) {
            result.message = error.message;
            return result;
        }
    }

    executeTokenMethod(method, params, caller) {
        const result = { success: false, message: '', newState: null };

        switch (method) {
            case 'transfer':
                const { to, amount } = params;
                if (!this.state.balances[caller] || this.state.balances[caller] < amount) {
                    result.message = 'Insufficient balance';
                    return result;
                }

                this.state.balances[caller] -= amount;
                this.state.balances[to] = (this.state.balances[to] || 0) + amount;

                result.success = true;
                result.message = `Transferred ${amount} ${this.state.symbol} to ${to}`;
                result.newState = { ...this.state };
                break;

            case 'balanceOf':
                const { address } = params;
                result.success = true;
                result.message = `Balance: ${this.state.balances[address] || 0}`;
                result.data = this.state.balances[address] || 0;
                break;

            case 'mint':
                if (caller !== this.creator) {
                    result.message = 'Only creator can mint';
                    return result;
                }

                const { mintTo, mintAmount } = params;
                this.state.balances[mintTo] = (this.state.balances[mintTo] || 0) + mintAmount;
                this.state.totalSupply += mintAmount;

                result.success = true;
                result.message = `Minted ${mintAmount} ${this.state.symbol}`;
                result.newState = { ...this.state };
                break;

            default:
                result.message = 'Unknown method';
        }

        if (result.success) {
            this.executionHistory.push({
                method,
                params,
                caller,
                timestamp: Date.now()
            });
        }

        return result;
    }

    executeEscrowMethod(method, params, caller) {
        const result = { success: false, message: '', newState: null };

        switch (method) {
            case 'deposit':
                const { amount } = params;
                if (caller !== this.state.buyer) {
                    result.message = 'Only buyer can deposit';
                    return result;
                }

                this.state.deposited += amount;
                result.success = true;
                result.message = `Deposited ${amount}. Total: ${this.state.deposited}`;
                result.newState = { ...this.state };
                break;

            case 'release':
                if (caller !== this.state.buyer && caller !== this.state.seller) {
                    result.message = 'Only buyer or seller can release';
                    return result;
                }

                if (this.state.released) {
                    result.message = 'Already released';
                    return result;
                }

                this.state.released = true;
                result.success = true;
                result.message = `Released ${this.state.deposited} to seller`;
                result.newState = { ...this.state };
                break;

            case 'refund':
                if (caller !== this.state.seller) {
                    result.message = 'Only seller can refund';
                    return result;
                }

                if (this.state.refunded) {
                    result.message = 'Already refunded';
                    return result;
                }

                this.state.refunded = true;
                result.success = true;
                result.message = `Refunded ${this.state.deposited} to buyer`;
                result.newState = { ...this.state };
                break;

            default:
                result.message = 'Unknown method';
        }

        if (result.success) {
            this.executionHistory.push({
                method,
                params,
                caller,
                timestamp: Date.now()
            });
        }

        return result;
    }

    executeVotingMethod(method, params, caller) {
        const result = { success: false, message: '', newState: null };

        switch (method) {
            case 'vote':
                const { option } = params;

                if (Date.now() > this.state.endTime) {
                    result.message = 'Voting has ended';
                    return result;
                }

                if (this.state.voters.includes(caller)) {
                    result.message = 'Already voted';
                    return result;
                }

                if (!this.state.options.includes(option)) {
                    result.message = 'Invalid option';
                    return result;
                }

                this.state.votes[option] = (this.state.votes[option] || 0) + 1;
                this.state.voters.push(caller);

                result.success = true;
                result.message = `Voted for: ${option}`;
                result.newState = { ...this.state };
                break;

            case 'getResults':
                result.success = true;
                result.message = 'Voting results';
                result.data = {
                    votes: this.state.votes,
                    totalVoters: this.state.voters.length,
                    ended: Date.now() > this.state.endTime
                };
                break;

            default:
                result.message = 'Unknown method';
        }

        if (result.success && method !== 'getResults') {
            this.executionHistory.push({
                method,
                params,
                caller,
                timestamp: Date.now()
            });
        }

        return result;
    }

    executeUserRegistryMethod(method, params, caller) {
        const result = { success: false, message: '', newState: null };

        switch (method) {
            case 'register':
                const { username, bio, avatar } = params;

                // Username validation
                if (!username || username.length < 3 || username.length > 20) {
                    result.message = 'Username must be 3-20 characters';
                    return result;
                }

                // Username uniqueness check
                if (this.state.usernames[username]) {
                    result.message = 'Username already taken';
                    return result;
                }

                // User already registered check
                if (this.state.users[caller]) {
                    result.message = 'User already registered';
                    return result;
                }

                // Register user
                this.state.users[caller] = {
                    username,
                    bio: bio || '',
                    avatar: avatar || '',
                    registeredAt: Date.now()
                };
                this.state.usernames[username] = caller;

                result.success = true;
                result.message = `User @${username} registered successfully`;
                result.newState = { ...this.state };
                break;

            case 'getUser':
                // Support both username and address lookup
                if (params.username) {
                    const address = this.state.usernames[params.username];
                    if (!address) {
                        result.message = 'User not found';
                        return result;
                    }
                    result.success = true;
                    result.data = {
                        address,
                        username: this.state.users[address].username,
                        bio: this.state.users[address].bio,
                        avatar: this.state.users[address].avatar,
                        registeredAt: this.state.users[address].registeredAt
                    };
                } else if (params.address) {
                    const user = this.state.users[params.address];
                    if (!user) {
                        result.message = 'User not found';
                        return result;
                    }
                    result.success = true;
                    result.data = {
                        address: params.address,
                        username: user.username,
                        bio: user.bio,
                        avatar: user.avatar,
                        registeredAt: user.registeredAt
                    };
                } else {
                    result.message = 'Username or address required';
                    return result;
                }
                break;

            case 'updateProfile':
                if (!this.state.users[caller]) {
                    result.message = 'User not registered';
                    return result;
                }

                const updates = {};
                if (params.bio !== undefined) updates.bio = params.bio;
                if (params.avatar !== undefined) updates.avatar = params.avatar;

                this.state.users[caller] = {
                    ...this.state.users[caller],
                    ...updates
                };

                result.success = true;
                result.message = 'Profile updated successfully';
                result.newState = { ...this.state };
                break;

            default:
                result.message = 'Unknown method';
                return result;
        }

        if (result.success && method !== 'getUser') {
            this.executionHistory.push({
                method,
                params,
                caller,
                timestamp: Date.now()
            });
        }

        return result;
    }

    getInfo() {

        return {
            contractId: this.contractId,
            type: this.type,
            creator: this.creator,
            params: this.params,
            state: this.state,
            createdAt: this.createdAt,
            version: this.version,
            executionCount: this.executionHistory.length
        };
    }
}

module.exports = SmartContract;
