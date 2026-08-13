import React from 'react';

export function NodeInspector({ inspectedNode, selectedProductId, getNodeStyles, getSeverityBadge }) {
  return (
    <div className="card node-inspector-panel">
      <h2 className="card-title">Node Inspector</h2>
      {inspectedNode ? (
        <div className="inspector-details">
          <div className="inspector-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="inspector-emoji" style={{ fontSize: '1.5rem' }}>{getNodeStyles(inspectedNode).emoji}</span>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{inspectedNode.name || inspectedNode.id}</h4>
              <span className="inspector-type" style={{ fontSize: '0.75rem', color: getNodeStyles(inspectedNode).color, textTransform: 'uppercase', fontWeight: 600 }}>
                {inspectedNode.label}
              </span>
            </div>
          </div>

          <div className="inspector-meta product-meta">
            {inspectedNode.type && (
              <div className="meta-row"><span className="meta-label">Type:</span><span className="meta-value">{inspectedNode.type}</span></div>
            )}
            {inspectedNode.carbonG != null && (
              <div className="meta-row"><span className="meta-label">CO2 Footprint:</span><span className="meta-value">{inspectedNode.carbonG}g</span></div>
            )}
            {inspectedNode.rating != null && (
              <div className="meta-row"><span className="meta-label">Supplier Rating:</span><span className="meta-value">⭐ {inspectedNode.rating}/5</span></div>
            )}
            {inspectedNode.esgScore != null && (
              <div className="meta-row">
                <span className="meta-label">ESG Score:</span>
                <span className="meta-value" style={{ color: inspectedNode.esgScore > 75 ? 'var(--success)' : inspectedNode.esgScore > 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {inspectedNode.esgScore}/100
                </span>
              </div>
            )}
            {inspectedNode.geopoliticalRisk != null && (
              <div className="meta-row"><span className="meta-label">Geopolitical Risk:</span><span className="meta-value">{inspectedNode.geopoliticalRisk}/10</span></div>
            )}
            {inspectedNode.severity && (
              <div className="meta-row"><span className="meta-label">Severity:</span><span className="meta-value">{getSeverityBadge(inspectedNode.severity)}</span></div>
            )}
            {inspectedNode.description && (
              <div className="meta-row description-row" style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <span className="meta-label"><strong>Description:</strong></span>
                <p className="meta-description" style={{ marginTop: '0.25rem', lineHeight: '1.4' }}>{inspectedNode.description}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="placeholder-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {selectedProductId ? "Click any node on the graph to inspect its properties." : "Select a product to begin auditing."}
        </p>
      )}
    </div>
  );
}