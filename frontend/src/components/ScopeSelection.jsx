import React from 'react';

export default function ScopeSelection({ products = [], selectedProductId, setSelectedProductId, selectedProductObj, onOpenAddModal }) {
  const handleChange = (e) => {
    setSelectedProductId(e.target.value);
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>🎯</span> Product Audit Scope Selection
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Select a target product model to inspect multi-tier supplier relationships and ESG risk factors.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={selectedProductId || ''}
          onChange={handleChange}
          className="select-input"
        >
          <option value="" disabled>-- Select a Product Model --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.category})
            </option>
          ))}
        </select>

        {onOpenAddModal && (
          <button onClick={onOpenAddModal} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
            + Add
          </button>
        )}
      </div>

      {selectedProductObj && (
        <div className="product-meta" style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '0.75rem' }}>
          <div className="meta-row">
            <span className="meta-label">SKU:</span>
            <span className="meta-value">{selectedProductObj.sku}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Category:</span>
            <span className="meta-value">{selectedProductObj.category}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Base Price:</span>
            <span className="meta-value">${selectedProductObj.price?.toFixed(2)}</span>
          </div>
          {selectedProductObj.description && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
              "{selectedProductObj.description}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}