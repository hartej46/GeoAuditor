/**
 * MCP Server End-to-End Verification Test
 *
 * Connects to the running GEO Auditor MCP Server over HTTP SSE
 * using the official MCP Client SDK, lists tools, and executes queries.
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '..', 'server', '.env');
let SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!SERPAPI_KEY && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/SERPAPI_KEY=([^\r\n]+)/);
  if (match) {
    SERPAPI_KEY = match[1].trim().replace(/^['"]|['"]$/g, '');
  }
}

const MCP_SSE_URL = 'http://localhost:3001/sse';
const testResults = [];

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    testResults.push({ name, passed: true, details });
  } else {
    console.error(`  ✗ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
    testResults.push({ name, passed: false, details });
  }
}

async function runMcpTests() {
  console.log('===============================================================');
  console.log('  GEO Auditor — MCP Server Verification Test Suite');
  console.log('===============================================================\n');

  // --- Test 1: HTTP Discovery & Health Endpoints ---
  console.log('--> TEST 1: MCP Server HTTP Discovery & Health');
  try {
    const healthRes = await fetch('http://localhost:3001/health');
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.status === 'ok' && healthData.mcp === true, 'Health confirms MCP server active');

    const discRes = await fetch('http://localhost:3001/');
    assert(discRes.status === 200, 'Discovery endpoint returns HTTP 200 OK');
    const discData = await discRes.json();
    assert(discData.name === 'GEO Auditor MCP Server', 'Discovery endpoint returns server name');
    assert(discData.tools && discData.tools.length > 0, 'Discovery lists registered tools');
  } catch (err) {
    assert(false, 'HTTP discovery failed', err.message);
  }
  console.log();

  // --- Test 2: MCP Client Connect & Tool Discovery ---
  console.log('--> TEST 2: Official MCP Client Connection & Tool Discovery (P0 #1, #2)');
  let client = null;
  try {
    const transport = new SSEClientTransport(new URL(MCP_SSE_URL));
    client = new Client(
      { name: 'geo-auditor-inspector-test', version: '1.0.0' },
      { capabilities: {} }
    );

    console.log(`    Connecting to MCP server at ${MCP_SSE_URL}...`);
    await client.connect(transport);
    assert(true, 'MCP Client successfully connected over SSE transport');

    const toolsResponse = await client.listTools();
    assert(Array.isArray(toolsResponse.tools), 'Client received tools list from MCP server');
    console.log(`    Discovered ${toolsResponse.tools.length} tool(s):`);

    const tool = toolsResponse.tools.find(t => t.name === 'check_brand_visibility');
    assert(!!tool, 'Tool "check_brand_visibility" is registered and discoverable');

    if (tool) {
      console.log(`    Tool Name: ${tool.name}`);
      console.log(`    Description: ${tool.description.slice(0, 100)}...`);
      assert(tool.description.length > 20, 'Tool has detailed plain-language description');
      assert(tool.inputSchema && tool.inputSchema.properties, 'Tool has typed input schema');
      assert(tool.inputSchema.properties.brand, 'inputSchema contains "brand" parameter');
      assert(tool.inputSchema.properties.query, 'inputSchema contains "query" parameter');
      assert(tool.inputSchema.properties.competitors, 'inputSchema contains "competitors" parameter');
      assert(tool.inputSchema.properties.serpapi_key, 'inputSchema contains "serpapi_key" parameter');
    }
  } catch (err) {
    assert(false, 'MCP Client connection or tool discovery failed', err.message);
  }
  console.log();

  // --- Test 3: Sandbox Mode Tool Execution ---
  console.log('--> TEST 3: Execute check_brand_visibility (Sandbox Mode)');
  try {
    const startTime = Date.now();
    const result = await client.callTool({
      name: 'check_brand_visibility',
      arguments: {
        brand: 'Sony WH-1000XM5',
        query: 'best noise cancelling headphones',
        competitors: 'Bose QuietComfort Ultra,Apple AirPods Max'
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`    Tool call returned in ${elapsed}ms`);
    assert(Array.isArray(result.content) && result.content.length > 0, 'Tool returns content block array');
    assert(result.content[0].type === 'text', 'Tool content is text format');

    const parsedJson = JSON.parse(result.content[0].text);
    assert(parsedJson.mode === 'sandbox', 'Response mode is sandbox');
    assert(parsedJson.brand && parsedJson.brand.name === 'Sony WH-1000XM5', 'Result contains brand analysis');
    assert(parsedJson.gapAnalysis, 'Result contains gap analysis');
    assert(Array.isArray(parsedJson.recommendations), 'Result contains recommendations');
    console.log(`    Verified sandbox result: Brand found in AI Overview=${parsedJson.brand?.aiOverview?.found}`);
  } catch (err) {
    assert(false, 'Sandbox tool execution failed', err.message);
  }
  console.log();

  // --- Test 4: Live Mode Tool Execution on Real Data ---
  console.log('--> TEST 4: Execute check_brand_visibility on Real Live Data (P0 #3)');
  try {
    const startTime = Date.now();
    const result = await client.callTool({
      name: 'check_brand_visibility',
      arguments: {
        brand: 'Notion',
        query: 'best note taking app for students',
        competitors: ['Obsidian', 'Evernote'],
        serpapi_key: SERPAPI_KEY
      }
    });

    const elapsed = Date.now() - startTime;
    console.log(`    Live tool call returned in ${elapsed}ms`);
    assert(Array.isArray(result.content) && result.content.length > 0, 'Live tool call returns content array');

    const liveData = JSON.parse(result.content[0].text);
    assert(liveData.mode === 'live', 'Live tool execution returned mode="live"');
    assert(liveData.brand && liveData.brand.name === 'Notion', 'Brand parsed as Notion');
    assert(liveData.brand.aiOverview?.found === true, 'Notion detected in Google AI Overview');
    assert(Array.isArray(liveData.competitors) && liveData.competitors.length === 2, '2 competitors evaluated');
    assert(liveData.gapAnalysis?.citedSourceAnalysis?.totalCited > 0, 'Cited sources analyzed from live SERP');

    // Security check: key not leaked
    assert(!result.content[0].text.includes(SERPAPI_KEY), 'Security check: SerpApi key is NOT leaked in tool output');
    console.log(`    Verified live result: Notion found=${liveData.brand.aiOverview?.found}, Cited sources=${liveData.gapAnalysis?.citedSourceAnalysis?.totalCited}`);
  } catch (err) {
    assert(false, 'Live tool execution failed', err.message);
  }
  console.log();

  // --- Test 5: Error Handling in Tool Handler (P1 #7) ---
  console.log('--> TEST 5: Graceful Error Handling (P1 #7)');
  try {
    const errResult = await client.callTool({
      name: 'check_brand_visibility',
      arguments: {
        brand: '',
        query: 'test query'
      }
    });

    assert(errResult.isError === true, 'Missing brand returns isError=true');
    assert(errResult.content[0].text.includes('brand'), 'Error message describes missing brand');
    console.log(`    Handled error message: "${errResult.content[0].text}"`);
  } catch (err) {
    assert(false, 'Tool handler crashed instead of returning graceful error', err.message);
  }
  console.log();

  if (client) {
    await client.close();
  }

  console.log('===============================================================');
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  console.log(`  MCP TEST RESULTS: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\nAll MCP Server tests passed successfully! ✓\n');
    process.exit(0);
  }
}

runMcpTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
