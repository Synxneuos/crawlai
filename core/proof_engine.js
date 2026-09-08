/**
 * CrawlAI Protocol - Cryptographic Proof & ASN Verification Engine
 * Validates residential node telemetry, anti-spoofing nonces, and task execution receipts.
 */

const crypto = require('crypto');

class ProofEngine {
  constructor(secretKey = process.env.CRAWLAI_SECRET || 'crawlai-dev-master-secret-2026') {
    this.secretKey = secretKey;
    this.usedNonces = new Set();
  }

  /**
   * Deterministic HMAC-SHA256 signature for node heartbeat and work receipts
   */
  generateSignature(payload) {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', this.secretKey).update(serialized).digest('hex');
  }

  /**
   * Verify an incoming proof of execution signature
   */
  verifySignature(payload, signature) {
    if (!signature || typeof signature !== 'string' || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;
    const expected = this.generateSignature(payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if an IP address belongs to a residential ISP vs datacenter
   * Uses heuristic ASN range filtering and heuristics
   */
  classifyIp(ip) {
    if (!ip) return { type: 'unknown', score: 0.5, isp: 'Unknown Network' };
    
    // Local / loopback
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { type: 'residential_local', score: 0.95, isp: 'Local Residential Sandbox' };
    }

    // Known datacenter CIDRs / providers (AWS, GCP, Azure, DigitalOcean, Cloudflare)
    const isDatacenter = ip.startsWith('3.') || ip.startsWith('34.') || ip.startsWith('35.') || 
                         ip.startsWith('52.') || ip.startsWith('54.') || ip.startsWith('104.');

    if (isDatacenter) {
      return { type: 'datacenter', score: 0.20, isp: 'Cloud Datacenter (Reduced Multiplier)' };
    }

    // Default to genuine residential IP
    return { type: 'residential', score: 1.0, isp: 'Verified Residential Carrier' };
  }

  /**
   * Generate an on-chain voucher for claiming rewards
   */
  createRewardVoucher(walletAddress, epochId, pointsEarned, amountSol) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const voucherData = {
      wallet: walletAddress,
      epoch: epochId,
      points: pointsEarned,
      amountLamports: Math.floor(amountSol * 1e9),
      nonce: nonce,
      timestamp: Date.now()
    };
    const signature = this.generateSignature(voucherData);
    return {
      ...voucherData,
      signature
    };
  }

  /**
   * Verify an on-chain voucher before relaying to Solana program
   */
  verifyRewardVoucher(voucher) {
    if (this.usedNonces.has(voucher.nonce)) {
      throw new Error('Replay attack detected: Nonce already redeemed');
    }
    const { signature, ...data } = voucher;
    const valid = this.verifySignature(data, signature);
    if (!valid) {
      throw new Error('Invalid voucher cryptographic signature');
    }
    this.usedNonces.add(voucher.nonce);
    return true;
  }
}

module.exports = { ProofEngine };
