import React from 'react';

export function AuditTables({
  activeTab,
  setActiveTab,
  selectedProductId,
  loading,
  risks,
  alternatives,
  setHoveredNodeId,
  setInspectedNodeId,
  getSeverityBadge
}) {
  return (
    <div className="card tab-section">
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
          onClick={() => setActiveTab('risks')}
          disabled={!selectedProductId}
        >
          Multi-Hop ESG Risk Audit (2+ Hops)
        </button>
        <button
          className={`tab-btn ${activeTab === 'alternatives' ? 'active' : ''}`}
          onClick={() => setActiveTab('alternatives')}
          disabled={!selectedProductId}
        >
          Awkward Relational Query (Alternative Sourcing)
        </button>
      </div>

      {loading ? (
        <div className="loader-wrapper" style={{ height: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : !selectedProductId ? (
        <div className="empty-state" style={{ padding: '2rem 1rem' }}>
          <p>Select a product above to audit its relational data.</p>
        </div>
      ) : activeTab === 'risks' ? (
        <div>
          {risks.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>No risks identified for this product. Verify database is seeded.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Supplier</th>
                    <th>Country</th>
                    <th>ESG</th>
                    <th>Risk Factor</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk, index) => (
                    <tr
                      key={`risk-${index}`}
                      onMouseEnter={() => setHoveredNodeId(risk.componentId)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => setInspectedNodeId(risk.riskId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>{risk.component}</td>
                      <td>{risk.supplier}</td>
                      <td>{risk.country || 'N/A'}</td>
                      <td style={{ color: !risk.esgScore ? 'var(--text-muted)' : risk.esgScore > 75 ? 'var(--success)' : risk.esgScore > 50 ? 'var(--warning)' : 'var(--danger)' }}>
                        {risk.esgScore || 'N/A'}
                      </td>
                      <td>{risk.riskName}</td>
                      <td>{getSeverityBadge(risk.riskSeverity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          {alternatives.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>🎉 All components for this product meet ESG thresholds, or no alternatives exist.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>At-Risk Component</th>
                    <th>Current Supplier</th>
                    <th>Current ESG</th>
                    <th>Recommended Supplier</th>
                    <th>Alternative ESG</th>
                    <th>Alternative Country</th>
                  </tr>
                </thead>
                <tbody>
                  {alternatives.map((alt, index) => (
                    <tr key={`alt-${index}`}>
                      <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{alt.component}</td>
                      <td>{alt.currentSupplier}</td>
                      <td style={{ color: 'var(--danger)' }}>{alt.currentSupplierESG}/100</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{alt.alternativeSupplier}</td>
                      <td style={{ color: 'var(--success)' }}>{alt.alternativeESG}/100</td>
                      <td>{alt.alternativeCountry} (Risk: {alt.alternativeGeopoliticalRisk}/10)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}