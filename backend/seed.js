import { runQuery, verifyConnection } from './db.js';

export async function seedDatabase() {
  console.log("🌱 Starting CognoDB Database Seeding with Apple Product Data...");

  const connection = await verifyConnection();
  if (!connection) {
    throw new Error(`Database connection failed`);
  }

  // Clear existing database
  console.log("🧹 Clearing existing data...");
  await runQuery('MATCH (n) DETACH DELETE n');

  // Randomization helpers
  const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  console.log("📦 Creating Products, Components, Suppliers, Facilities, Countries, and Risk Factors...");

  // 1. Create Countries
  const countriesQuery = `
    UNWIND $countries AS c
    CREATE (co:Country {
      id: c.id, 
      name: c.name, 
      code: c.code, 
      geopoliticalRisk: toInteger(c.geopoliticalRisk), 
      environmentalRisk: toInteger(c.environmentalRisk)
    })
  `;
  const countriesData = [
    { id: "co-tw", name: "Taiwan", code: "TW", geopoliticalRisk: getRandom(5, 9), environmentalRisk: getRandom(3, 6) },
    { id: "co-jp", name: "Japan", code: "JP", geopoliticalRisk: getRandom(1, 4), environmentalRisk: getRandom(2, 5) },
    { id: "co-kr", name: "South Korea", code: "KR", geopoliticalRisk: getRandom(3, 7), environmentalRisk: getRandom(2, 5) },
    { id: "co-de", name: "Germany", code: "DE", geopoliticalRisk: getRandom(1, 3), environmentalRisk: getRandom(1, 4) },
    { id: "co-cl", name: "Chile", code: "CL", geopoliticalRisk: getRandom(2, 5), environmentalRisk: getRandom(4, 8) },
    { id: "co-cd", name: "Democratic Republic of Congo", code: "CD", geopoliticalRisk: getRandom(7, 10), environmentalRisk: getRandom(6, 9) },
    { id: "co-ru", name: "Russia", code: "RU", geopoliticalRisk: getRandom(8, 10), environmentalRisk: getRandom(6, 9) },
    { id: "co-au", name: "Australia", code: "AU", geopoliticalRisk: getRandom(1, 3), environmentalRisk: getRandom(2, 5) }
  ];
  await runQuery(countriesQuery, { countries: countriesData });

  // 2. Create Risk Factors
  const risksQuery = `
    UNWIND $risks AS r
    CREATE (rf:RiskFactor {
      id: r.id, 
      name: r.name, 
      category: r.category, 
      severity: r.severity, 
      description: r.description
    })
  `;
  const risksData = [
    { id: "risk-water", name: "Water Scarcity Alert", category: "Environmental", severity: "High", description: "Water shortages threaten high-consumption chip fabrication processes." },
    { id: "risk-geopolitics", name: "Geopolitical Tensions", category: "Geopolitical", severity: "High", description: "Trade restrictions and regional political instability threaten supply continuity." },
    { id: "risk-labor", name: "Labor Exploitation Risk", category: "Social", severity: "Critical", description: "Reports of forced labor or child labor in mining operations." },
    { id: "risk-sanctions", name: "Economic Sanctions", category: "Geopolitical", severity: "Critical", description: "Direct export bans and asset freezes on regional entities." },
    { id: "risk-energy", name: "Energy Supply Instability", category: "Environmental", severity: "Medium", description: "Natural gas supply issues threaten manufacturing output." }
  ];
  await runQuery(risksQuery, { risks: risksData });

  // 3. Link Countries to Risk Factors
  const countryRiskLinks = [
    { countryId: "co-tw", riskId: "risk-water" },
    { countryId: "co-tw", riskId: "risk-geopolitics" },
    { countryId: "co-kr", riskId: "risk-geopolitics" },
    { countryId: "co-cd", riskId: "risk-labor" },
    { countryId: "co-ru", riskId: "risk-sanctions" },
    { countryId: "co-de", riskId: "risk-energy" },
    { countryId: "co-cl", riskId: "risk-water" }
  ];
  for (const link of countryRiskLinks) {
    await runQuery(`
      MATCH (co:Country {id: $countryId})
      MATCH (rf:RiskFactor {id: $riskId})
      CREATE (co)-[:EXPOSED_TO]->(rf)
    `, link);
  }

  // 4. Create Suppliers
  const suppliersQuery = `
    UNWIND $suppliers AS s
    CREATE (sup:Supplier {
      id: s.id, 
      name: s.name, 
      rating: toInteger(s.rating), 
      country: s.country
    })
  `;
  const suppliersData = [
    { id: "supp-tsmc", name: "TSMC", rating: getRandom(4, 5), country: "Taiwan" },
    { id: "supp-silicone", name: "Silicone Corp", rating: getRandom(3, 5), country: "Japan" },
    { id: "supp-displaylux", name: "DisplayLux Corp", rating: getRandom(2, 4), country: "South Korea" },
    { id: "supp-glasstech", name: "GlassTech AG", rating: getRandom(3, 5), country: "Germany" },
    { id: "supp-salar", name: "Salar Lithium Ltd", rating: getRandom(2, 4), country: "Chile" },
    { id: "supp-congo", name: "CongoCobalt Co", rating: getRandom(1, 3), country: "Democratic Republic of Congo" },
    { id: "supp-siberia", name: "Siberia Mining Group", rating: getRandom(1, 3), country: "Russia" },
    { id: "supp-oz", name: "OzMetals Ltd", rating: getRandom(4, 5), country: "Australia" }
  ];
  await runQuery(suppliersQuery, { suppliers: suppliersData });

  // 5. Create Facilities
  const facilitiesQuery = `
    UNWIND $facilities AS f
    MATCH (s:Supplier {id: f.supplierId})
    MATCH (c:Country {id: f.countryId})
    CREATE (fac:Facility {
      id: f.id, 
      name: f.name, 
      type: f.type, 
      esgScore: toInteger(f.esgScore)
    })
    CREATE (s)-[:OPERATES]->(fac)
    CREATE (fac)-[:LOCATED_IN]->(c)
  `;
  const facilitiesData = [
    { id: "fac-hsinchu", name: "Hsinchu Fab 12", type: "Fabrication Plant", esgScore: getRandom(75, 95), supplierId: "supp-tsmc", countryId: "co-tw" },
    { id: "fac-tokyo", name: "Tokyo Refinery", type: "Chemical Refinery", esgScore: getRandom(70, 90), supplierId: "supp-silicone", countryId: "co-jp" },
    { id: "fac-gumi", name: "Gumi OLED Fab", type: "Display Fab", esgScore: getRandom(50, 75), supplierId: "supp-displaylux", countryId: "co-kr" },
    { id: "fac-dresden", name: "Dresden Glass Plant", type: "Glass Foundry", esgScore: getRandom(35, 60), supplierId: "supp-glasstech", countryId: "co-de" },
    { id: "fac-atacama", name: "Atacama Extraction Site", type: "Lithium Mine", esgScore: getRandom(40, 65), supplierId: "supp-salar", countryId: "co-cl" },
    { id: "fac-kolwezi", name: "Kolwezi Artisanal Mine", type: "Cobalt Mine", esgScore: getRandom(10, 30), supplierId: "supp-congo", countryId: "co-cd" },
    { id: "fac-norilsk", name: "Norilsk Smelter", type: "Nickel & Cobalt Smelter", esgScore: getRandom(15, 35), supplierId: "supp-siberia", countryId: "co-ru" },
    { id: "fac-perth", name: "Perth Processing Facility", type: "Eco Processing Plant", esgScore: getRandom(85, 98), supplierId: "supp-oz", countryId: "co-au" }
  ];
  await runQuery(facilitiesQuery, { facilities: facilitiesData });

  // 6. Direct Supplier Risk Links
  await runQuery(`
    MATCH (s:Supplier {id: 'supp-congo'})
    MATCH (rf:RiskFactor {id: 'risk-labor'})
    CREATE (s)-[:EXPOSED_TO]->(rf)
  `);
  await runQuery(`
    MATCH (s:Supplier {id: 'supp-siberia'})
    MATCH (rf:RiskFactor {id: 'risk-sanctions'})
    CREATE (s)-[:EXPOSED_TO]->(rf)
  `);

  // 7. Create Products
  const productsQuery = `
    UNWIND $products AS p
    CREATE (:Product {
      id: p.id, 
      name: p.name, 
      price: toFloat(p.price), 
      category: p.category,
      sku: p.sku,
      description: p.description
    })
  `;
  const productsData = [
    { id: "AP-IP15P", name: "iPhone 15 Pro", price: 999.00, category: "Mobile", sku: "AP-15-P", description: "Flagship smartphone featuring titanium design and A17 Pro chip." },
    { id: "AP-MBA-M3", name: "MacBook Air M3", price: 1099.00, category: "Laptop", sku: "AP-MBA-M3", description: "Ultra-thin laptop built with 100% recycled aluminum enclosure." },
    { id: "AP-AW-U2", name: "Apple Watch Ultra 2", price: 799.00, category: "Wearable", sku: "AP-AWU-2", description: "Rugged smartwatch crafted with aerospace-grade titanium." },
    { id: "AP-APP-2", name: "AirPods Pro 2", price: 249.00, category: "Audio", sku: "AP-APP-2", description: "Wireless earbuds featuring H2 chip audio processing." },
    { id: "AP-AVP-1", name: "Apple Vision Pro", price: 3499.00, category: "Spatial Computing", sku: "AP-VP-1", description: "Spatial computer incorporating dual 4K Micro-OLED displays." }
  ];
  await runQuery(productsQuery, { products: productsData });

  // 8. Create Components
  const componentsQuery = `
    UNWIND $components AS c
    CREATE (:Component {
      id: c.id, 
      name: c.name, 
      type: c.type, 
      carbonG: toInteger(c.carbonG)
    })
  `;
  const componentsData = [
    { id: "comp-a17", name: "A17 Pro SoC", type: "Microchip", carbonG: getRandom(100, 150) },
    { id: "comp-m3", name: "M3 Silicon Chip", type: "Microchip", carbonG: getRandom(150, 220) },
    { id: "comp-s9", name: "S9 SiP Chip", type: "Microchip", carbonG: getRandom(60, 90) },
    { id: "comp-h2", name: "H2 Audio Chip", type: "Microchip", carbonG: getRandom(40, 70) },
    { id: "comp-wafer", name: "3nm Silicon Wafer", type: "Substrate", carbonG: getRandom(60, 100) },
    { id: "comp-silicon-ore", name: "High-Purity Silicon Ore", type: "Raw Material", carbonG: getRandom(30, 60) },
    { id: "comp-oled", name: "Super Retina OLED", type: "Display Panel", carbonG: getRandom(120, 180) },
    { id: "comp-micro-oled", name: "4K Micro-OLED", type: "Display Panel", carbonG: getRandom(190, 260) },
    { id: "comp-ito-glass", name: "ITO Glass Substrate", type: "Glass Panel", carbonG: getRandom(50, 90) },
    { id: "comp-battery", name: "Lithium Battery Cell", type: "Battery", carbonG: getRandom(180, 260) },
    { id: "comp-lithium", name: "Refined Lithium Carbonate", type: "Raw Material", carbonG: getRandom(70, 120) },
    { id: "comp-cobalt", name: "Cobalt Oxide", type: "Raw Material", carbonG: getRandom(90, 140) },
    { id: "comp-titanium", name: "Titanium Chassis", type: "Enclosure", carbonG: getRandom(110, 170) }
  ];
  await runQuery(componentsQuery, { components: componentsData });

  // 9. Build Bill of Materials (BOM) structure
  const bomLinks = [
    { parentId: "AP-IP15P", childId: "comp-a17", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-IP15P", childId: "comp-oled", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-IP15P", childId: "comp-battery", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-IP15P", childId: "comp-titanium", relation: "ASSEMBLED_FROM" },

    { parentId: "AP-MBA-M3", childId: "comp-m3", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-MBA-M3", childId: "comp-oled", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-MBA-M3", childId: "comp-battery", relation: "ASSEMBLED_FROM" },

    { parentId: "AP-AW-U2", childId: "comp-s9", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-AW-U2", childId: "comp-oled", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-AW-U2", childId: "comp-titanium", relation: "ASSEMBLED_FROM" },

    { parentId: "AP-APP-2", childId: "comp-h2", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-APP-2", childId: "comp-battery", relation: "ASSEMBLED_FROM" },

    { parentId: "AP-AVP-1", childId: "comp-m3", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-AVP-1", childId: "comp-micro-oled", relation: "ASSEMBLED_FROM" },
    { parentId: "AP-AVP-1", childId: "comp-ito-glass", relation: "ASSEMBLED_FROM" },

    { parentId: "comp-a17", childId: "comp-wafer", relation: "REQUIRES" },
    { parentId: "comp-m3", childId: "comp-wafer", relation: "REQUIRES" },
    { parentId: "comp-s9", childId: "comp-wafer", relation: "REQUIRES" },
    { parentId: "comp-h2", childId: "comp-wafer", relation: "REQUIRES" },
    { parentId: "comp-wafer", childId: "comp-silicon-ore", relation: "REQUIRES" },

    { parentId: "comp-oled", childId: "comp-ito-glass", relation: "REQUIRES" },
    { parentId: "comp-micro-oled", childId: "comp-ito-glass", relation: "REQUIRES" },

    { parentId: "comp-battery", childId: "comp-lithium", relation: "REQUIRES" },
    { parentId: "comp-battery", childId: "comp-cobalt", relation: "REQUIRES" }
  ];

  for (const link of bomLinks) {
    await runQuery(`
      MATCH (parent) WHERE parent.id = $parentId
      MATCH (child:Component) WHERE child.id = $childId
      CREATE (parent)-[:${link.relation}]->(child)
    `, link);
  }

  // 10. Link Components to Suppliers
  const sourcingLinks = [
    { componentId: "comp-a17", supplierId: "supp-tsmc" },
    { componentId: "comp-m3", supplierId: "supp-tsmc" },
    { componentId: "comp-s9", supplierId: "supp-tsmc" },
    { componentId: "comp-h2", supplierId: "supp-tsmc" },
    { componentId: "comp-wafer", supplierId: "supp-silicone" },
    { componentId: "comp-silicon-ore", supplierId: "supp-oz" },

    { componentId: "comp-oled", supplierId: "supp-displaylux" },
    { componentId: "comp-micro-oled", supplierId: "supp-displaylux" },
    { componentId: "comp-ito-glass", supplierId: "supp-glasstech" },

    { componentId: "comp-battery", supplierId: "supp-tsmc" },
    { componentId: "comp-lithium", supplierId: "supp-salar" },
    { componentId: "comp-titanium", supplierId: "supp-oz" },

    { componentId: "comp-cobalt", supplierId: "supp-congo" },
    { componentId: "comp-cobalt", supplierId: "supp-siberia" },
    { componentId: "comp-cobalt", supplierId: "supp-oz" }
  ];

  for (const link of sourcingLinks) {
    await runQuery(`
      MATCH (c:Component {id: $componentId})
      MATCH (s:Supplier {id: $supplierId})
      CREATE (c)-[:SOURCED_FROM]->(s)
    `, link);
  }

  console.log("✅ CognoDB Seeding Completed successfully!");
}