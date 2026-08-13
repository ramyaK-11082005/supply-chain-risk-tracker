import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
  console.error('❌ Missing database environment variables in .env file.');
}

const driver = neo4j.driver(
  COGNODB_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(COGNODB_USER || 'neo4j', COGNODB_PASSWORD || 'password'),
  { disableLosslessIntegers: true }
);

export const verifyConnection = async () => {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('✅ Connected to CognoDB Cloud successfully.');
    return true;
  } catch (error) {
    console.error('❌ CognoDB Connection Error:', error.message);
    return false;
  } finally {
    await session.close();
  }
};

// Helper function to run Cypher queries safely
export async function runQuery(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}

export default driver;