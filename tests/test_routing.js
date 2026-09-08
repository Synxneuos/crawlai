/**
 * Test Suite 1: End-to-End Crawler API & Routing Verification
 */

const assert = require('assert');
const { Coordinator } = require('../core/coordinator');
const { CrawlerAPI } = require('../core/crawler_api');

async function runTest() {
  console.log('--- TEST 1: Coordinator Registration & Task Routing ---');
  const coordinator = new Coordinator();
  const crawler = new CrawlerAPI(coordinator);

  // 1. Register two nodes (1 residential, 1 datacenter)
  const node1 = coordinator.registerNode('node-res-1', '192.168.1.5', 'SolanaWallet1', 'REF_01');
  const node2 = coordinator.registerNode('node-dc-1', '52.14.88.10', 'SolanaWallet2', 'REF_02');

  assert.strictEqual(node1.qualityScore, 0.95, 'Local residential score should be ~0.95');
  assert.strictEqual(node2.qualityScore, 0.20, 'Datacenter score should be 0.20');

  // 2. Select best worker -> should pick node1
  const best = coordinator.selectBestWorker();
  assert.strictEqual(best.id, 'node-res-1', 'Best worker should prioritize residential node');
  console.log('✓ Worker priority ranking correctly selected residential node');

  // 3. Heartbeat points increment
  node1.lastPing = Date.now() - 60000; // 60s ago
  const hb = coordinator.heartbeat('node-res-1');
  assert(hb.points > 0, 'Node points should increase on heartbeat');
  console.log(`✓ Heartbeat accrued: ${hb.points} points`);

  // 4. HTML to Markdown Parser test
  const sampleHtml = '<html><head><title>AI Grounding Test</title></head><body><h1>Header 1</h1><p>Test paragraph with <a href="https://example.com">link</a></p></body></html>';
  const md = crawler.htmlToMarkdown(sampleHtml, 'https://test.com');
  assert.strictEqual(md.title, 'AI Grounding Test');
  assert(md.markdown.includes('# Header 1'), 'Markdown must include heading');
  assert(md.markdown.includes('[link](https://example.com)'), 'Markdown must parse links');
  console.log('✓ HTML accurately transformed to clean LLM-ready markdown');

  coordinator.destroy();
  console.log('>>> TEST 1 PASSED SUCCESSFULLY!\n');
}

runTest().catch(err => {
  console.error('TEST 1 FAILED:', err);
  process.exit(1);
});
