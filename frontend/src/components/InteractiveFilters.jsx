import React from 'react';

export function InteractiveFilters({ searchTerm, setSearchTerm, esgThreshold, setEsgThreshold }) {
  return (
    <div className="card">
      <h2 className="card-title">Interactive Filters</h2>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label htmlFor="node-search">Search Graph Nodes</label>
        <input
          id="node-search"
          type="text"
          className="select-input"
          placeholder="Search component, supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="esg-slider" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Min ESG Threshold:</span>
          <strong style={{ color: esgThreshold > 60 ? 'var(--success)' : 'var(--warning)' }}>
            {esgThreshold} / 100
          </strong>
        </label>
        <input
          id="esg-slider"
          type="range"
          min="0"
          max="100"
          step="5"
          value={esgThreshold}
          onChange={(e) => setEsgThreshold(Number(e.target.value))}
          style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
        />
      </div>
    </div>
  );
}