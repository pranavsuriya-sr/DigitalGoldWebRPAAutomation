import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import EntryPage from './components/EntryPage';
import GraphPage from './components/GraphPage';

function App() {
  const location = useLocation();

  return (
    <div className="App">
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            🏆 Digital Gold Tracker
          </Link>
          <ul className="nav-links">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Add Data
              </Link>
            </li>
            <li>
              <Link 
                to="/graph" 
                className={`nav-link ${location.pathname === '/graph' ? 'active' : ''}`}
              >
                View Trends
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </div>
  );
}

export default App; 