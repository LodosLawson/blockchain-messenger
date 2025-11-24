import React, { useState } from 'react';
import { Server, Activity, Plus } from 'lucide-react';

const Network = () => {
    const [peers, setPeers] = useState(['192.168.1.5:5001', '192.168.1.8:5001']); // Mock peers
    const [newPeer, setNewPeer] = useState('');

    const handleAddPeer = (e) => {
        e.preventDefault();
        if (newPeer) {
            setPeers([...peers, newPeer]);
            setNewPeer('');
        }
    };

    return (
        <div className="grid-2">
            <div className="glass-card">
                <h2>Network Status</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></div>
                    <span style={{ fontSize: '1.1rem' }}>Node Online</span>
                </div>
                <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    <p>Port: 3001 (HTTP) / 5001 (P2P)</p>
                    <p>Connected Peers: {peers.length}</p>
                </div>
            </div>

            <div className="glass-card">
                <h3>Connected Peers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {peers.map((peer, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                            <Server size={16} color="var(--primary)" />
                            <span style={{ fontFamily: 'monospace' }}>{peer}</span>
                            <Activity size={14} color="#4ade80" style={{ marginLeft: 'auto' }} />
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddPeer} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="ws://localhost:5002"
                        value={newPeer}
                        onChange={(e) => setNewPeer(e.target.value)}
                    />
                    <button type="submit" className="btn" style={{ padding: '0.75rem' }}>
                        <Plus size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Network;
