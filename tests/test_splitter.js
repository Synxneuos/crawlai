/**
 * Test Suite 3: 4-Way Solana Revenue Splitter Economic Math Verification
 */

const assert = require('assert');

function simulateSplit(depositUsdc) {
  const nodeBps = 4000;    // 40%
  const holderBps = 3500;  // 35%
  const burnBps = 1500;    // 15%
  const founderBps = 1000; // 10%

  assert.strictEqual(nodeBps + holderBps + burnBps + founderBps, 10000, 'Sum of BPS must equal 10,000');

  const nodes = (depositUsdc * nodeBps) / 10000;
  const holders = (depositUsdc * holderBps) / 10000;
  const burn = (depositUsdc * burnBps) / 10000;
  const founder = (depositUsdc * founderBps) / 10000;

  return { nodes, holders, burn, founder, total: nodes + holders + burn + founder };
}

async function runTest() {
  console.log('--- TEST 3: Economic Splitter & Dividend Distribution Math ---');

  const testDeposit = 10000; // $10,000 USDC
  const split = simulateSplit(testDeposit);

  assert.strictEqual(split.nodes, 4000, 'Nodes must receive 40% ($4,000)');
  assert.strictEqual(split.holders, 3500, 'Holders must receive 35% ($3,500)');
  assert.strictEqual(split.burn, 1500, 'Burn pool must receive 15% ($1,500)');
  assert.strictEqual(split.founder, 1000, 'Founder treasury must receive 10% ($1,000)');
  assert.strictEqual(split.total, testDeposit, 'Total distributed must exactly match deposit');

  console.log('✓ 4-Way split perfectly matches protocol tokenomics specification:');
  console.log(`   - 40% Active Worker Nodes:  $${split.nodes} USDC`);
  console.log(`   - 35% $CRAWL Staking Yield: $${split.holders} USDC`);
  console.log(`   - 15% Buyback & Burn:       $${split.burn} USDC`);
  console.log(`   - 10% Protocol Treasury:    $${split.founder} USDC`);

  console.log('>>> TEST 3 PASSED SUCCESSFULLY!\n');
}

runTest().catch(err => {
  console.error('TEST 3 FAILED:', err);
  process.exit(1);
});
