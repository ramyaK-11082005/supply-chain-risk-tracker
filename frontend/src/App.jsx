import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';

// Import refactored components
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { InteractiveFilters } from './components/InteractiveFilters';
import ScopeSelection from './components/ScopeSelection';
import { NodeInspector } from './components/NodeInspector';
import KPIDashboard from './components/KPIDashboard';
import { GraphVisualizer } from './components/GraphVisualizer';
import { AuditTables } from './components/AuditTables';
import { CypherViewer } from './components/CypherViewer';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [risks, setRisks] = useState([]);
  const [alternatives, setAlternatives] = useState([]);

  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dbStatus, setDbStatus] = useState({ database: 'checking', details: {} });
  const [error, setError] = useState(null);

  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('risks');
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [inspectedNodeId, setInspectedNodeId] = useState(null);

  const [esgThreshold, setEsgThreshold] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const selectedProductObj = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const initApp = async () => {
    setError(null);
    try {
      const healthRes = await fetch(`${API_BASE}/health`);
      const healthData = await healthRes.json();
      setDbStatus(healthData);

      if (healthData.database === 'connected') {
        const prodRes = await fetch(`${API_BASE}/products`);
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) && prodData.length > 0 ? prodData : []);
      }
    } catch (err) {
      console.error(err);
      setError('Express API server is unreachable. Please verify backend port 5000.');
      setDbStatus({ database: 'disconnected', details: { error: err.message } });
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  useEffect(() => {
    if (!selectedProductId) {
      setGraphData({ nodes: [], links: [] });
      setRisks([]);
      setAlternatives([]);
      setInspectedNodeId(null);
      return;
    }

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [graphRes, risksRes, altsRes] = await Promise.all([
          fetch(`${API_BASE}/products/${selectedProductId}/supply-chain`),
          fetch(`${API_BASE}/products/${selectedProductId}/risks`),
          fetch(`${API_BASE}/products/${selectedProductId}/alternatives`)
        ]);

        const graph = await graphRes.json();
        const productRisks = await risksRes.json();
        const productAlts = await altsRes.json();

        if (graph?.nodes && graph?.links) {
          setGraphData(graph);
        } else {
          setGraphData({ nodes: [], links: [] });
          if (graph?.message) setError(graph.message);
        }

        setRisks(Array.isArray(productRisks) ? productRisks : []);
        setAlternatives(Array.isArray(productAlts) ? productAlts : []);
        setInspectedNodeId(selectedProductId);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch supply chain details.');
        setGraphData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [selectedProductId]);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Database Seeded Successfully!');
        await initApp();
        if (selectedProductId) {
          const currentId = selectedProductId;
          setSelectedProductId('');
          setTimeout(() => setSelectedProductId(currentId), 50);
        }
      } else {
        throw new Error(data.message || 'Seeding failed');
      }
    } catch (err) {
      setError('Database seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const layoutNodes = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) return [];
    const nodes = [...graphData.nodes];
    const links = graphData.links || [];
    
    const childToParent = {};
    links.forEach(l => {
      if (l?.target && l?.source) childToParent[l.target] = l.source;
    });

    const nodesWithLayer = nodes.map(node => {
      let layer = 0;
      const id = node.id;
      if (node.label === 'Product') {
        layer = 0;
      } else if (node.label === 'Component') {
        const parentId = childToParent[id];
        const parentNode = nodes.find(n => n.id === parentId);
        layer = (parentNode && parentNode.label === 'Product') ? 1 : 2;
      } else if (node.label === 'Supplier') {
        layer = 3;
      } else if (node.label === 'Facility') {
        layer = 4;
      } else if (node.label === 'Country') {
        layer = 5;
      } else if (node.label === 'RiskFactor') {
        layer = 6;
      }
      return { ...node, layer };
    });

    const layerWidths = [60, 200, 360, 500, 640, 760, 880];
    const svgHeight = 480;
    const padding = 40;
    const layerGroups = {};

    for (let l = 0; l <= 6; l++) {
      layerGroups[l] = nodesWithLayer.filter(n => n.layer === l);
    }

    const positionedNodes = [];
    Object.keys(layerGroups).forEach(layerKey => {
      const layerNodes = layerGroups[layerKey];
      const N = layerNodes.length;
      const x = layerWidths[layerKey];

      layerNodes.forEach((node, i) => {
        let y = svgHeight / 2;
        if (N > 1) {
          y = padding + i * ((svgHeight - 2 * padding) / (N - 1));
        }
        positionedNodes.push({ ...node, x, y });
      });
    });

    return positionedNodes;
  }, [graphData]);

  const nodePositionMap = useMemo(() => {
    const map = {};
    if (Array.isArray(layoutNodes)) {
      layoutNodes.forEach(node => {
        if (node && node.id) {
          map[node.id] = { x: node.x ?? 0, y: node.y ?? 0 };
        }
      });
    }
    return map;
  }, [layoutNodes]);

  const inspectedNode = useMemo(() => {
    return graphData?.nodes?.find(n => n.id === inspectedNodeId);
  }, [graphData.nodes, inspectedNodeId]);

  const isConnectedToHovered = useCallback((nodeId) => {
    if (!hoveredNodeId) return false;
    if (nodeId === hoveredNodeId) return true;
    const links = graphData.links || [];
    return links.some(l =>
      (l.source === hoveredNodeId && l.target === nodeId) ||
      (l.target === hoveredNodeId && l.source === nodeId)
    );
  }, [hoveredNodeId, graphData.links]);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <span className="badge badge-critical">Critical</span>;
      case 'high': return <span className="badge badge-high">High</span>;
      case 'medium': return <span className="badge badge-medium">Medium</span>;
      default: return <span className="badge badge-medium">{severity || 'N/A'}</span>;
    }
  };

  const getNodeStyles = (node) => {
    if (!node) return { color: '#ccc', emoji: '⚙️' };
    switch (node.label) {
      case 'Product': return { color: 'var(--color-product)', emoji: node.category === 'Laptop' ? '💻' : '📱' };
      case 'Component': return { color: 'var(--color-component)', emoji: '🧩' };
      case 'Supplier': return { color: 'var(--color-supplier)', emoji: '🏢' };
      case 'Facility': return { color: 'var(--color-facility)', emoji: '🏭' };
      case 'Country': return { color: 'var(--color-country)', emoji: '🗺️' };
      case 'RiskFactor': return { color: 'var(--color-risk)', emoji: '⚠️' };
      default: return { color: 'var(--text-muted)', emoji: '⚙️' };
    }
  };

  return (
    <div className="app-container" data-theme={theme}>
      <Header
        theme={theme}
        setTheme={setTheme}
        dbStatus={dbStatus}
        seeding={seeding}
        handleSeed={handleSeed}
      />

      <ErrorBanner error={error} />

      <div className="dashboard-grid">
        <aside className="sidebar">
          <InteractiveFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            esgThreshold={esgThreshold}
            setEsgThreshold={setEsgThreshold}
          />

          <ScopeSelection
            products={products}
            selectedProductId={selectedProductId}
            setSelectedProductId={setSelectedProductId}
            selectedProductObj={selectedProductObj}
          />

          <NodeInspector
            inspectedNode={inspectedNode}
            selectedProductId={selectedProductId}
            getNodeStyles={getNodeStyles}
            getSeverityBadge={getSeverityBadge}
          />
        </aside>

        <div className="right-column-content">
          <GraphVisualizer
            loading={loading}
            graphData={graphData}
            selectedProductId={selectedProductId}
            layoutNodes={layoutNodes}
            nodePositionMap={nodePositionMap}
            hoveredNodeId={hoveredNodeId}
            setHoveredNodeId={setHoveredNodeId}
            inspectedNodeId={inspectedNodeId}
            setInspectedNodeId={setInspectedNodeId}
            searchTerm={searchTerm}
            esgThreshold={esgThreshold}
            isConnectedToHovered={isConnectedToHovered}
            getNodeStyles={getNodeStyles}
          />
          {/* FIXED: Passing risks and graphData props so numbers update per product */}
          <KPIDashboard risks={risks} graphData={graphData} />
        </div>

        <div className="bottom-sections">
          <AuditTables
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedProductId={selectedProductId}
            loading={loading}
            risks={risks}
            alternatives={alternatives}
            setHoveredNodeId={setHoveredNodeId}
            setInspectedNodeId={setInspectedNodeId}
            getSeverityBadge={getSeverityBadge}
          />

          <CypherViewer activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

export default App;