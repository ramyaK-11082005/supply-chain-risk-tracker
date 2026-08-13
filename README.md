What the Graph Gain Gives Us:
Multi-Hop Traversals: Following a variable-length Bill of Materials (BOM) hierarchy (Product → Component → SubComponent) is natively supported via variable-length path matching.

Indirect Risk Discovery: Risks are frequently detached from the product itself and lie downstream or upstream (Product → Component → Supplier → Facility → Country → RiskFactor). Graph traversals expose why a product is at risk and which entities create that exposure.

Relationship-Based Sourcing: Finding alternative suppliers requires checking component compatibility, alternative vendor paths, and local facility risks simultaneously. A graph makes these conditions explicit.

2. Data Model Diagram
The application models global supply chains using the following labeled nodes and typed relationships:

Plaintext
(Product) -[:ASSEMBLED_FROM | REQUIRES]-> (Component)
(Component) -[:SOURCED_FROM]-> (Supplier)
(Supplier) -[:OPERATES]-> (Facility)
(Facility) -[:LOCATED_IN]-> (Country)
(Facility) -[:EXPOSED_TO]-> (RiskFactor)
3. Setup & Run Instructions
Prerequisites
Node.js (v18 or higher) installed locally.

A free CognoDB Cloud account (console.cognodb.com).

Step 1: Provision a CognoDB Cloud Instance
Sign up for a free account on CognoDB Console.

Create a free (c0) instance and select your region.

Copy and save your connection URI (formatted as bolt+s://<instance-id>.databases.cognodb.cloud) and generated password immediately.

Step 2: Configure Environment Variables
Create a .env file inside the backend/ directory with the following configuration:

Code snippet
PORT=5000
COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
COGNODB_USER=cognodb
COGNODB_PASSWORD=your_generated_password_here
Step 3: Install Dependencies & Seed the Database
Navigate to the project directories and install packages for both backend and frontend:

Bash
# Install Backend Dependencies
cd backend
npm install

# Seed the Database with initial supply chain nodes and relationships
npm run seed

# Start the Backend Server
node server.js
In a separate terminal window, start the frontend application:

Bash
cd frontend
npm install
npm run dev
4. Main Cypher Queries Explained
Query 1: Multi-Hop ESG Risk Audit (2+ Hops)
This query traverses the multi-tier supply chain from a target product down to its components, suppliers, facilities, countries, and associated risk factors using variable-length relationships.

Cypher
MATCH (p:Product {id: $productId})
      -[:ASSEMBLED_FROM|REQUIRES*1..5]->
      (c:Component)
OPTIONAL MATCH (c)-[:SOURCED_FROM]->(s:Supplier)
OPTIONAL MATCH (s)-[:OPERATES]->(fac:Facility)-[:LOCATED_IN]->(co:Country)
OPTIONAL MATCH (fac)-[:EXPOSED_TO]->(rf:RiskFactor)
RETURN DISTINCT c.name AS component, s.name AS supplier, co.name AS country, fac.esgScore AS esg, rf.name AS riskFactor, rf.severity AS severity
Query 2: Awkward Relational Query (Alternative Sourcing Analysis)
This query performs relationship-based reasoning to find alternative suppliers for high-risk components by comparing current vendor metrics against alternative suppliers linked to the same component model.

Cypher
MATCH (p:Product {id: $productId})-[:ASSEMBLED_FROM|REQUIRES]->(c:Component)-[:SOURCED_FROM]->(currentSupplier:Supplier)
MATCH (c)<-[:REQUIRES|ASSEMBLED_FROM]-(otherComp:Component)<-[:SOURCED_FROM]-(altSupplier:Supplier)
WHERE currentSupplier <> altSupplier
RETURN c.name AS component, currentSupplier.name AS currentSupplier, altSupplier.name AS alternativeSupplier
5. Project Structure
Plaintext
supply-chain-risk-tracker/
│
├── backend/
│   ├── package.json
│   ├── server.js
│   └── seed.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AuditTables.jsx
│   │   │   ├── CypherViewer.jsx
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── GraphVisualizer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── InteractiveFilters.jsx
│   │   │   ├── KPIDashboard.jsx
│   │   │   ├── NodeInspector.jsx
│   │   │   └── ScopeSelection.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── .gitignore
└── README.md