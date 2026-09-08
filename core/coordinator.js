/**
 * CrawlAI Protocol - Node Coordinator & Task Dispatcher
 * Manages active browser/desktop worker nodes, handles heartbeats, and dispatches scraping tasks.
 */

const { ProofEngine } = require('./proof_engine');

class Coordinator {
  constructor() {
    this.proofEngine = new ProofEngine();
    this.nodes = new Map(); // nodeId -> NodeMetadata
    this.taskQueue = [];
    this.stats = {
      totalBytesRouted: 0,
      totalRequestsFulfilled: 0,
      totalPointsIssued: 0,
      startTime: Date.now()
    };

    // Heartbeat cleanup loop (runs every 30 seconds)
    this.cleanupTimer = setInterval(() => this.pruneInactiveNodes(), 30000);
  }

  /**
   * Register a new worker node (browser or desktop client)
   */
  registerNode(nodeId, clientIp, walletAddress = null, referralCode = null) {
    const classification = this.proofEngine.classifyIp(clientIp);
    const node = {
      id: nodeId,
      ip: clientIp,
      wallet: walletAddress,
      referralCode: referralCode,
      type: classification.type,
      qualityScore: classification.score,
      isp: classification.isp,
      status: 'active',
      lastPing: Date.now(),
      connectedAt: Date.now(),
      bytesRelayed: 0,
      requestsServed: 0,
      points: 0,
      pendingTasks: 0
    };
    this.nodes.set(nodeId, node);
    return node;
  }

  /**
   * Process heartbeat ping from node and credit uptime points
   */
  heartbeat(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    const now = Date.now();
    const elapsedSeconds = (now - node.lastPing) / 1000;
    node.lastPing = now;
    node.status = 'active';

    // Base point formula: 10 points/min * quality score (Residential = 1.0, Datacenter = 0.2)
    if (elapsedSeconds > 0 && elapsedSeconds < 120) {
      const pointIncrement = (elapsedSeconds / 60) * 10 * node.qualityScore;
      node.points += pointIncrement;
      this.stats.totalPointsIssued += pointIncrement;
    }

    return {
      points: Math.round(node.points * 100) / 100,
      qualityScore: node.qualityScore,
      status: 'healthy'
    };
  }

  /**
   * Select the optimal residential worker node for an incoming scrape task
   */
  selectBestWorker() {
    let bestNode = null;
    let highestRank = -1;

    for (const [id, node] of this.nodes) {
      if (node.status !== 'active') continue;
      // Prefer high residential quality and lowest load
      const rank = (node.qualityScore * 10) - (node.pendingTasks * 2);
      if (rank > highestRank) {
        highestRank = rank;
        bestNode = node;
      }
    }
    return bestNode;
  }

  /**
   * Log completed scraping task and credit bandwidth points
   */
  recordTaskCompletion(nodeId, bytesTransferred, latencyMs) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.bytesRelayed += bytesTransferred;
      node.requestsServed += 1;
      if (node.pendingTasks > 0) node.pendingTasks -= 1;
      
      // 1 point per 100 KB transferred + bonus for fast latency
      const dataPoints = (bytesTransferred / (1024 * 100)) * node.qualityScore;
      node.points += dataPoints;
      this.stats.totalPointsIssued += dataPoints;
    }
    this.stats.totalBytesRouted += bytesTransferred;
    this.stats.totalRequestsFulfilled += 1;
  }

  pruneInactiveNodes() {
    const threshold = Date.now() - 90000; // 90 seconds timeout
    for (const [id, node] of this.nodes) {
      if (node.lastPing < threshold) {
        node.status = 'idle';
      }
    }
  }

  getActiveNodesCount() {
    let count = 0;
    for (const node of this.nodes.values()) {
      if (node.status === 'active') count++;
    }
    return count;
  }

  destroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

module.exports = { Coordinator };
