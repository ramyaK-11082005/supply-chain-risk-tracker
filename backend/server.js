import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyConnection, runQuery } from './db.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper function to safely parse Neo4j Integers into JS numbers
const parseNum = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object' && typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  return Number(val);
};

// ==================== API ROUTES ====================

// 1. Health & Connection Status
app.get('/api/health', async (req, res) => {
  try {
    const connected = await verifyConnection();
    res.json({
      status: 'ok',
      database: connected ? 'connected' : 'disconnected',
      details: { connected }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      message: error.message 
    });
  }
});

// 2. Trigger Database Seeding
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ status: 'success', message: 'Database successfully seeded with supply chain data!' });
  } catch (error) {
    console.error("Seeding Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to seed database: ' + error.message });
  }
});

// 3. List All Products
app.get('/api/products', async (req, res) => {
  try {
    const result = await runQuery('MATCH (p:Product) RETURN p ORDER BY p.name');
    const products = result.records.map(record => {
      const p = record.get('p');
      const props = p?.properties || {};
      return {
        id: props.id || '',
        name: props.name || 'Unknown Product',
        price: parseNum(props.price) || 0,
        category: props.category || 'General',
        sku: props.sku || 'N/A',
        description: props.description || ''
      };
    });
    res.json(products);
  } catch (error) {
    console.error("Products Route Error:", error);
    res.status(500).json({ status: 'error', message: 'Database unreachable or query failed: ' + error.message });
  }
});

// 3b. Add a New Product
app.post('/api/products', async (req, res) => {
  try {
    const { id, name, price, category, sku, description } = req.body;
    if (!id || !name) {
      return res.status(400).json({ status: 'error', message: 'Product ID and Name are required.' });
    }

    const query = `
      CREATE (p:Product {
        id: $id,
        name: $name,
        price: toFloat($price),
        category: $category,
        sku: $sku,
        description: $description
      })
      RETURN p
    `;

    const params = {
      id,
      name,
      price: price ? parseFloat(price) : 0.0,
      category: category || 'General',
      sku: sku || id,
      description: description || ''
    };

    const result = await runQuery(query, params);
    const singleRecord = result.records[0];
    const node = singleRecord.get('p').properties;

    res.status(201).json({
      status: 'success',
      message: 'Product added successfully!',
      product: {
        id: node.id,
        name: node.name,
        price: parseNum(node.price),
        category: node.category,
        sku: node.sku,
        description: node.description
      }
    });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to add product: ' + error.message });
  }
});

// 4. Retrieve Product Supply Chain Graph (Nodes & Links)
app.get('/api/products/:id/supply-chain', async (req, res) => {
  const productId = req.params.id;
  try {
    const query = `
      MATCH (p:Product {id: $productId})
      OPTIONAL MATCH path = (p)-[:ASSEMBLED_FROM|REQUIRES*1..5]->(c:Component)
      OPTIONAL MATCH (c)-[:SOURCED_FROM]->(s:Supplier)
      OPTIONAL MATCH (s)-[:OPERATES]->(fac:Facility)
      OPTIONAL MATCH (fac)-[:LOCATED_IN]->(co:Country)
      OPTIONAL MATCH (co)-[:EXPOSED_TO]->(rf:RiskFactor)
      OPTIONAL MATCH (s)-[:EXPOSED_TO]->(rf2:RiskFactor)
      RETURN p, path, s, fac, co, rf, rf2
    `;
    
    const result = await runQuery(query, { productId });
    
    const nodesMap = new Map();
    const linksSet = new Set();

    const addNode = (id, label, rawProps) => {
      if (!id) return;
      if (!nodesMap.has(id)) {
        const props = rawProps || {};
        const cleanedProps = {
          ...props,
          esgScore: parseNum(props.esgScore),
          price: parseNum(props.price),
          geopoliticalRisk: parseNum(props.geopoliticalRisk),
          carbonG: parseNum(props.carbonG),
          rating: parseNum(props.rating)
        };
        nodesMap.set(id, { id, label: label || 'Unknown', ...cleanedProps });
      }
    };

    const addLink = (source, target, type) => {
      if (!source || !target) return;
      linksSet.add(JSON.stringify({ source, target, type: type || 'CONNECTED_TO' }));
    };

    result.records.forEach(record => {
      const p = record.get('p');
      if (p?.properties?.id) {
        addNode(p.properties.id, 'Product', p.properties);
      }

      const path = record.get('path');
      if (path && Array.isArray(path.segments)) {
        path.segments.forEach(segment => {
          const start = segment.start;
          const end = segment.end;
          const rel = segment.relationship;

          if (start?.properties?.id) {
            const startLabel = (start.labels && start.labels[0]) ? start.labels[0] : 'Component';
            addNode(start.properties.id, startLabel, start.properties);
          }
          if (end?.properties?.id) {
            const endLabel = (end.labels && end.labels[0]) ? end.labels[0] : 'Component';
            addNode(end.properties.id, endLabel, end.properties);
          }
          if (start?.properties?.id && end?.properties?.id) {
            addLink(start.properties.id, end.properties.id, rel?.type || 'REQUIRES');
          }
        });
      }

      const s = record.get('s');
      if (s?.properties?.id) {
        addNode(s.properties.id, 'Supplier', s.properties);
      }

      const fac = record.get('fac');
      if (fac?.properties?.id) {
        addNode(fac.properties.id, 'Facility', fac.properties);
        if (s?.properties?.id) addLink(s.properties.id, fac.properties.id, 'OPERATES');
      }

      const co = record.get('co');
      if (co?.properties?.id) {
        addNode(co.properties.id, 'Country', co.properties);
        if (fac?.properties?.id) addLink(fac.properties.id, co.properties.id, 'LOCATED_IN');
      }

      const rf = record.get('rf');
      if (rf?.properties?.id) {
        addNode(rf.properties.id, 'RiskFactor', rf.properties);
        if (co?.properties?.id) addLink(co.properties.id, rf.properties.id, 'EXPOSED_TO');
      }

      const rf2 = record.get('rf2');
      if (rf2?.properties?.id) {
        addNode(rf2.properties.id, 'RiskFactor', rf2.properties);
        if (s?.properties?.id) addLink(s.properties.id, rf2.properties.id, 'EXPOSED_TO');
      }
    });

    const sourcingQuery = `
      MATCH (p:Product {id: $productId})-[:ASSEMBLED_FROM|REQUIRES*1..5]->(c:Component)-[r:SOURCED_FROM]->(s:Supplier)
      RETURN c.id AS compId, s.id AS suppId
    `;
    const sourcingResult = await runQuery(sourcingQuery, { productId });
    sourcingResult.records.forEach(rec => {
      const compId = rec.get('compId');
      const suppId = rec.get('suppId');
      if (compId && suppId) {
        addLink(compId, suppId, 'SOURCED_FROM');
      }
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      links: Array.from(linksSet).map(s => JSON.parse(s))
    });
  } catch (error) {
    console.error("Supply Chain Route Error:", error);
    res.status(500).json({ 
      nodes: [], 
      links: [], 
      status: 'error', 
      message: 'Failed to retrieve supply chain: ' + error.message 
    });
  }
});

// 5. Multi-Hop Risk Path Query
app.get('/api/products/:id/risks', async (req, res) => {
  const productId = req.params.id;
  try {
    const query = `
      MATCH (p:Product {id: $productId})-[:ASSEMBLED_FROM|REQUIRES*1..5]->(c:Component)-[:SOURCED_FROM]->(s:Supplier)
      OPTIONAL MATCH (s)-[:OPERATES]->(fac:Facility)-[:LOCATED_IN]->(co:Country)-[:EXPOSED_TO]->(rf:RiskFactor)
      OPTIONAL MATCH (s)-[:EXPOSED_TO]->(rf2:RiskFactor)
      WITH c, s, fac, co, collect(distinct rf) + collect(distinct rf2) AS risks
      UNWIND risks AS r
      RETURN DISTINCT 
        c.id AS componentId,
        c.name AS component, 
        s.name AS supplier, 
        co.name AS country, 
        fac.esgScore AS esgScore,
        r.id AS riskId,
        r.name AS riskName, 
        r.severity AS riskSeverity, 
        r.category AS riskCategory,
        r.description AS riskDescription
      ORDER BY case r.severity when 'Critical' then 1 when 'High' then 2 when 'Medium' then 3 else 4 end
    `;
    
    const result = await runQuery(query, { productId });
    const risks = result.records.map(record => ({
      componentId: record.get('componentId'),
      component: record.get('component'),
      supplier: record.get('supplier'),
      country: record.get('country'),
      esgScore: parseNum(record.get('esgScore')),
      riskId: record.get('riskId'),
      riskName: record.get('riskName'),
      riskSeverity: record.get('riskSeverity'),
      riskCategory: record.get('riskCategory'),
      riskDescription: record.get('riskDescription')
    }));
    
    res.json(risks);
  } catch (error) {
    console.error("Risks Route Error:", error);
    res.status(500).json({ status: 'error', message: 'Query failed: ' + error.message });
  }
});

// 6. Alternative Suppliers Query
app.get('/api/products/:id/alternatives', async (req, res) => {
  const productId = req.params.id;
  try {
    const query = `
      MATCH (p:Product {id: $productId})-[:ASSEMBLED_FROM|REQUIRES*1..5]->(c:Component)-[:SOURCED_FROM]->(s:Supplier)-[:OPERATES]->(f:Facility)-[:LOCATED_IN]->(co:Country)
      WHERE f.esgScore < 60 OR co.geopoliticalRisk > 5
      
      MATCH (altSupplier:Supplier)-[:OPERATES]->(altFac:Facility)-[:LOCATED_IN]->(altCo:Country)
      MATCH (c)-[:SOURCED_FROM]->(altSupplier)
      WHERE altSupplier <> s AND altFac.esgScore >= 70 AND altCo.geopoliticalRisk <= 4
      
      RETURN DISTINCT
        c.name AS component,
        s.name AS currentSupplier,
        f.esgScore AS currentSupplierESG,
        co.name AS currentCountry,
        co.geopoliticalRisk AS currentGeopoliticalRisk,
        altSupplier.name AS alternativeSupplier,
        altFac.esgScore AS alternativeESG,
        altCo.name AS alternativeCountry,
        altCo.geopoliticalRisk AS alternativeGeopoliticalRisk
    `;
    
    const result = await runQuery(query, { productId });
    const alternatives = result.records.map(record => ({
      component: record.get('component'),
      currentSupplier: record.get('currentSupplier'),
      currentSupplierESG: parseNum(record.get('currentSupplierESG')),
      currentCountry: record.get('currentCountry'),
      currentGeopoliticalRisk: parseNum(record.get('currentGeopoliticalRisk')),
      alternativeSupplier: record.get('alternativeSupplier'),
      alternativeESG: parseNum(record.get('alternativeESG')),
      alternativeCountry: record.get('alternativeCountry'),
      alternativeGeopoliticalRisk: parseNum(record.get('alternativeGeopoliticalRisk'))
    }));
    
    res.json(alternatives);
  } catch (error) {
    console.error("Alternatives Route Error:", error);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve alternatives: ' + error.message });
  }
});

// ==================== STATIC FRONTEND SERVING ====================

const __dirname = path.resolve();
// Serves static files from the frontend build folder
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Fallback to index.html using regex pattern instead of bare '*'
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});