import React from 'react';

export function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="error-banner">
      <span className="error-icon">⚠️</span>
      <div>
        <strong>Application Error</strong>
        <p className="error-details">{error}</p>
      </div>
    </div>
  );
}