// Script to check if Neo4j and n8n services are accessible
import neo4j from 'neo4j-driver';
import axios from 'axios';

async function checkNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password123';

  console.log('Checking Neo4j connection...');
  console.log(`URI: ${uri}`);
  console.log(`Username: ${username}`);

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  
  try {
    await driver.verifyConnectivity();
    console.log('✓ Neo4j is accessible');
    
    // Test SUK query
    const session = driver.session();
    try {
      const result = await session.run('MATCH (n:SUK) RETURN count(n) as count');
      const count = result.records[0]?.get('count')?.toNumber() || 0;
      console.log(`✓ Found ${count} SUK nodes in Neo4j`);
    } catch (queryError) {
      console.log('⚠ SUK query failed, but connection works:', queryError.message);
    } finally {
      await session.close();
    }
    
  } catch (error) {
    console.log('✗ Neo4j connection failed:', error.message);
  } finally {
    await driver.close();
  }
}

async function checkN8n() {
  const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
  
  console.log('\nChecking n8n connection...');
  console.log(`URL: ${baseUrl}`);
  
  try {
    const response = await axios.get(`${baseUrl}/healthz`, { timeout: 5000 });
    console.log('✓ n8n is accessible');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('✗ n8n connection failed:', error.message);
    
    // Try alternative endpoint
    try {
      const altResponse = await axios.get(`${baseUrl}/`, { timeout: 5000 });
      console.log('✓ n8n is accessible (via root endpoint)');
    } catch (altError) {
      console.log('✗ n8n is not accessible');
    }
  }
}

async function main() {
  console.log('=== Service Connectivity Check ===\n');
  
  await checkNeo4j();
  await checkN8n();
  
  console.log('\n=== Check Complete ===');
  process.exit(0);
}

main().catch(console.error);