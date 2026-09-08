/**
 * Test Suite 2: Cryptographic Proof & Voucher Anti-Replay Verification
 */

const assert = require('assert');
const { ProofEngine } = require('../core/proof_engine');

async function runTest() {
  console.log('--- TEST 2: Cryptographic Proof & Voucher Integrity ---');
  const engine = new ProofEngine('test-secret-salt-2026');

  // 1. Signature generation & verification
  const payload = { task: 'crawl', url: 'https://news.ycombinator.com', timestamp: 1725839000 };
  const sig = engine.generateSignature(payload);
  assert(engine.verifySignature(payload, sig), 'Valid signature should verify');
  assert(!engine.verifySignature(payload, sig + 'tamper'), 'Tampered signature must reject');
  console.log('✓ Cryptographic HMAC-SHA256 signatures validated');

  // 2. Voucher anti-replay protection
  const voucher = engine.createRewardVoucher('PhantomWallet111', 1, 1500, 0.05);
  assert(engine.verifyRewardVoucher(voucher), 'First voucher redemption should succeed');

  try {
    engine.verifyRewardVoucher(voucher);
    assert.fail('Duplicate voucher redemption must throw replay error');
  } catch (err) {
    assert(err.message.includes('Replay attack detected'), 'Replay protection active');
    console.log('✓ Nonce replay protection successfully blocked double-spend');
  }

  console.log('>>> TEST 2 PASSED SUCCESSFULLY!\n');
}

runTest().catch(err => {
  console.error('TEST 2 FAILED:', err);
  process.exit(1);
});
