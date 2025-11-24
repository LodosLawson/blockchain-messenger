import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Explorer from './components/Explorer';
import Network from './components/Network';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="container animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/network" element={<Network />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
