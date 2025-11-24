import React, { useState, useEffect } from 'react';
import { Box, Clock, Hash } from 'lucide-react';

const Explorer = () => {
    const [blocks, setBlocks] = useState([]);

    useEffect(() => {
        // Mock data for now
        setBlocks([
            { index: 1, hash: '0000abc...', prevHash: '0000123...', timestamp: Date.now(), transactions: 5 },
            { index: 0, hash: '0000123...', prevHash: '0', timestamp: Date.now() - 10000, transactions: 1 }
        ]);
    }, []);

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Blockchain Explorer</h2>
                <button className="btn-secondary" onClick={() => window.location.reload()}>
                    Refresh Chain
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {blocks.map((block) => (
                    <div key={block.hash} className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                <Box size={16} color="var(--secondary)" />
                                Block #{block.index}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <Clock size={14} />
                                {new Date(block.timestamp).toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hash</div>
                                <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                    {block.hash}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Previous Hash</div>
                                <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                    {block.prevHash}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Explorer;
