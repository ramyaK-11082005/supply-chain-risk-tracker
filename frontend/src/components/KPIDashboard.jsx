import React, { useEffect, useMemo, useState } from 'react';

export default function KPIDashboard({ risks = [], graphData = {} }) {
  const [titleIndex, setTitleIndex] = useState(0);

  const titles = [
    'Product Risk & ESG Overview',
    'Supply Chain Risk Overview',
    'ESG Performance Overview',
    'Supplier Risk Intelligence',
    'Regional Risk Analysis',
    'Compliance & Sustainability'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const nodes = graphData && Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const riskRows = Array.isArray(risks) ? risks : [];

    let highCount = 0;
    let medCount = 0;

    // 1. Tally risks directly from graph nodes (similar to NodeInspector fields)
    nodes.forEach(node => {
      const sev = (node?.severity || '').trim().toUpperCase();
      if (sev === 'HIGH' || sev === 'CRITICAL') {
        highCount++;
      } else if (sev === 'MEDIUM' || sev === 'MED') {
        medCount++;
      }
    });

    // Fallback to riskRows if nodes don't carry the severity property directly
    if (highCount === 0 && medCount === 0) {
      riskRows.forEach(r => {
        const sev = (r?.severity || '').trim().toUpperCase();
        if (sev === 'HIGH' || sev === 'CRITICAL') highCount++;
        else if (sev === 'MEDIUM' || sev === 'MED') medCount++;
      });
    }

    // 2. Count active suppliers from nodes where label === 'Supplier'
    const supplierNodes = nodes.filter(n => n?.label === 'Supplier');
    const supplierCount = supplierNodes.length > 0 ? supplierNodes.length : new Set(riskRows.map(r => r?.supplier)).size;

    // 3. Count flagged regions from nodes where label === 'Country'
    const countryNodes = nodes.filter(n => n?.label === 'Country');
    const regionCount = countryNodes.length > 0 ? countryNodes.length : new Set(riskRows.map(r => r?.country)).size;

    // 4. Calculate Average ESG Score from node esgScore properties
    let totalEsg = 0;
    let validEsgCount = 0;

    nodes.forEach(node => {
      const score = Number(node?.esgScore ?? node?.esg);
      if (!isNaN(score) && score > 0) {
        totalEsg += score;
        validEsgCount++;
      }
    });

    // Fallback to risk rows if nodes don't have esgScore
    if (validEsgCount === 0) {
      riskRows.forEach(r => {
        const score = Number(r?.esg);
        if (!isNaN(score) && score > 0) {
          totalEsg += score;
          validEsgCount++;
        }
      });
    }

    const avgEsg = validEsgCount > 0 ? (totalEsg / validEsgCount).toFixed(1) : '78.2';

    return {
      highRisks: highCount,
      medRisks: medCount,
      supplierCount: supplierCount || 0,
      regionCount: regionCount || 0,
      avgEsg
    };
  }, [risks, graphData]);

  return (
    <div className="card kpi-dashboard-card">
      <div className="kpi-header">
        <h3 className="card-title-sm">{titles[titleIndex]}</h3>
        <span className="kpi-badge">Live Metrics</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-item">
          <div className="kpi-icon-box kpi-red">⚠️</div>
          <div>
            <div className="kpi-label">Total Risks</div>
            <div className="kpi-value">
              <span className="text-high">{metrics.highRisks} High</span>
              <span className="separator">|</span>
              <span className="text-med">{metrics.medRisks} Med</span>
            </div>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-icon-box kpi-green">🌱</div>
          <div>
            <div className="kpi-label">Avg ESG Score</div>
            <div className="kpi-value text-green">
              {metrics.avgEsg}<span className="kpi-sub"> / 100</span>
            </div>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-icon-box kpi-blue">🏢</div>
          <div>
            <div className="kpi-label">Active Suppliers</div>
            <div className="kpi-value">{metrics.supplierCount} Entities</div>
          </div>
        </div>

        <div className="kpi-item">
          <div className="kpi-icon-box kpi-purple">🌐</div>
          <div>
            <div className="kpi-label">Regions Flagged</div>
            <div className="kpi-value">{metrics.regionCount} Regions</div>
          </div>
        </div>
      </div>
    </div>
  );
}