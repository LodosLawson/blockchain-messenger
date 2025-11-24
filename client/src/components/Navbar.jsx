import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Globe, Network, Wallet } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-panel" style={{ marginBottom: '2rem', padding: '1rem' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <Wallet size={24} color="white" />
                    </div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Gravitic Wallet</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </div>
                    </Link>
                    <Link to="/explorer" className={`nav-link ${isActive('/explorer') ? 'active' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Globe size={18} />
                            <span>Explorer</span>
                        </div>
                    </Link>
                    <Link to="/network" className={`nav-link ${isActive('/network') ? 'active' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Network size={18} />
                            <span>Network</span>
                        </div>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
