import React from 'react';

export function GraphVisualizer({
  loading,
  graphData,
  selectedProductId,
  layoutNodes,
  nodePositionMap,
  hoveredNodeId,
  setHoveredNodeId,
  inspectedNodeId,
  setInspectedNodeId,
  searchTerm,
  esgThreshold,
  isConnectedToHovered,
  getNodeStyles
}) {
  return (
    <section className="visualizer-container">
      <div className="card graph-card">
        <h2 className="card-title">Supply Chain ESG Relationship Model</h2>

        <div className="graph-legend">
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-product)' }}></span> Product</div>
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-component)' }}></span> Component</div>
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-supplier)' }}></span> Supplier</div>
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-facility)' }}></span> Facility</div>
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-country)' }}></span> Country</div>
          <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--color-risk)' }}></span> Risk Factor</div>
        </div>

        {loading ? (
          <div className="loader-wrapper">
            <div className="spinner"></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Auditing database pathways...</p>
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '2rem' }}>📂</div>
            <h3>{selectedProductId ? 'No Data Available' : 'No Scope Selected'}</h3>
            <p>{selectedProductId ? 'Click "Seed Demo Data" above to generate a sample supply chain graph.' : 'Please select a product from the sidebar to view its supply chain.'}</p>
          </div>
        ) : (
          <div className="graph-view-wrapper">
            <svg className="graph-svg" viewBox="0 0 960 480">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-color)" />
                </marker>
              </defs>

              {/* Edges */}
              {graphData.links.map((link, idx) => {
                const srcPos = nodePositionMap[link.source];
                const tgtPos = nodePositionMap[link.target];
                if (!srcPos || !tgtPos) return null;

                const isHighlighted = hoveredNodeId === link.source || hoveredNodeId === link.target;
                const isDimmed = hoveredNodeId && !isHighlighted;
                const midX = (srcPos.x + tgtPos.x) / 2;
                const pathData = `M ${srcPos.x} ${srcPos.y} C ${midX} ${srcPos.y}, ${midX} ${tgtPos.y}, ${tgtPos.x} ${tgtPos.y}`;

                return (
                  <g key={`edge-group-${idx}`}>
                    <path
                      className={`graph-edge ${isHighlighted ? 'highlighted' : ''}`}
                      d={pathData}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      fill="none"
                      markerEnd="url(#arrow)"
                      style={{ opacity: isDimmed ? 0.2 : 1 }}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {layoutNodes.map(node => {
                const styles = getNodeStyles(node);
                const matchesSearch = searchTerm && node.name?.toLowerCase().includes(searchTerm.toLowerCase());
                const failsEsgThreshold = node.esgScore != null && node.esgScore < esgThreshold;

                const isHighlighted = isConnectedToHovered(node.id) || matchesSearch;
                const isDimmed = (hoveredNodeId && !isHighlighted) || (searchTerm && !matchesSearch) || failsEsgThreshold;
                const isInspected = inspectedNodeId === node.id || node.type === 'Product';
                const strokeColor = failsEsgThreshold ? 'var(--danger)' : matchesSearch ? 'var(--warning)' : styles.colorVar;

                return (
                  <g
                    key={node.id}
                    className="node-group"
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => setInspectedNodeId(node.id)}
                    style={{
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.25 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <circle
                      className={`node-circle ${isInspected ? 'active' : ''}`}
                      cx={node.x}
                      cy={node.y}
                      r={matchesSearch ? 22 : 18}
                      stroke={strokeColor}
                      strokeWidth={isInspected || matchesSearch ? 3.5 : 2}
                    />
                    <text className="node-icon" x={node.x} y={node.y + 5} textAnchor="middle" fontSize="12">
                      {failsEsgThreshold ? '⚠️' : styles.emoji}
                    </text>
                    <text
                      className="node-text"
                      x={node.x}
                      y={node.y + 32}
                      textAnchor="middle"
                      fontSize="10"
                    >
                      {node.name ? (node.name.length > 14 ? node.name.substring(0, 12) + '..' : node.name) : node.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </section>
  );
}