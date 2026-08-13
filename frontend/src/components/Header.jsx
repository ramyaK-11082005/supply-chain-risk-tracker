import React from 'react';

export function Header({ theme, setTheme, dbStatus, seeding, handleSeed }) {
  const themeOptions = [
    { id: 'dark', label: '🌙 Dark' },
    { id: 'light', label: '☀️ Light' },
    { id: 'cyberpunk', label: '⚡ Cyber' },
  ];

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-icon">🌐</span>
        <div className="brand-title">
          <h1>SupplyChainSafe</h1>
          <p>ESG & Supply Chain Risk Auditor • Backed by CognoDB</p>
        </div>
      </div>

      <div className="header-controls">
        {/* Mood/Theme Toggle Group */}
        <div className="theme-toggle-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mood:</span>
          <div className="toggle-container" style={{ display: 'inline-flex', borderRadius: '6px', padding: '2px' }}>
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`theme-toggle-btn ${theme === opt.id ? 'active' : ''}`}
                onClick={() => setTheme(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="db-status">
          <span className={`status-dot ${dbStatus.database === 'connected' ? 'connected' : 'disconnected'}`}></span>
          <span>CognoDB Cloud: <strong>{dbStatus.database}</strong></span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleSeed}
          disabled={seeding || dbStatus.database !== 'connected'}
        >
          {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
        </button>
      </div>
    </header>
  );
}