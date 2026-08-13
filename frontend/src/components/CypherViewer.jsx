import React from 'react';

export function CypherViewer({ activeTab }) {
  return (
    <div className="card cypher-card">
      <h2 className="card-title">Under the Hood: Cypher Queries</h2>
      {activeTab === 'risks' ? (
        <div className="code-block">
          <span className="cypher-keyword">MATCH</span> (p:Product &#123;id: <span className="cypher-highlight">$productId</span>&#125;)<br />
          -[:ASSEMBLED_FROM|REQUIRES*1..5]-&gt;(c:Component)<br />
          -[:SOURCED_FROM]-&gt;(s:Supplier)<br />
          <span className="cypher-keyword">OPTIONAL MATCH</span> (s)-[:OPERATES]-&gt;(fac:Facility)-[:LOCATED_IN]-&gt;(co:Country)-[:EXPOSED_TO]-&gt;(rf:RiskFactor)<br />
          <span className="cypher-keyword">RETURN DISTINCT</span> c.name, s.name, co.name, fac.esgScore, rf.name, rf.severity
        </div>
      ) : (
        <div className="code-block">
          <span className="cypher-keyword">MATCH</span> (p:Product &#123;id: <span className="cypher-highlight">$productId</span>&#125;)<br />
          -[:ASSEMBLED_FROM|REQUIRES*1..5]-&gt;(c:Component)<br />
          -[:SOURCED_FROM]-&gt;(s:Supplier)-[:OPERATES]-&gt;(f:Facility)<br />
          <span className="cypher-keyword">WHERE</span> f.esgScore &lt; 60<br />
          <span className="cypher-keyword">MATCH</span> (altSupplier:Supplier)-[:OPERATES]-&gt;(altFac:Facility)<br />
          <span className="cypher-keyword">MATCH</span> (c)-[:SOURCED_FROM]-&gt;(altSupplier)<br />
          <span className="cypher-keyword">RETURN DISTINCT</span> c.name, s.name, altSupplier.name, altFac.esgScore
        </div>
      )}
    </div>
  );
}