import React, { useState, useEffect } from 'react';
import { Send, RefreshCw, Copy } from 'lucide-react';

const Dashboard = () => {
    const [balance, setBalance] = useState(1000); // Initial mock balance as requested
    const [address, setAddress] = useState('0x123...abc'); // Mock address
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    const handleSend = async (e) => {
        e.preventDefault();
        // TODO: Implement actual transaction sending logic
        alert(`Sending ${amount} to ${recipient}`);
    };

    return (
        <div className="grid">
            <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))' }}>
                <h2>Total Balance</h2>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    ${balance.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USD</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                    <span>Wallet Address: {address}</span>
                    <button className="btn-secondary" style={{ padding: '0.25rem', borderRadius: '0.25rem' }}>
                        <Copy size={14} />
                    </button>
                </div>
            </div>

            <div className="grid-2">
                <div className="glass-card">
                    <h3>Send Crypto</h3>
                    <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Recipient Address</label>
                            <input
                                type="text"
                                placeholder="0x..."
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Amount</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn" style={{ justifyContent: 'center' }}>
                            <Send size={18} /> Send Transaction
                        </button>
                    </form>
                </div>

                <div className="glass-card">
                    <h3>Recent Activity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: '500' }}>Received</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>From: 0x987...zyx</div>
                            </div>
                            <div style={{ color: '#4ade80' }}>+500.00</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontWeight: '500' }}>Sent</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>To: 0x456...def</div>
                            </div>
                            <div style={{ color: '#f87171' }}>-200.00</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
