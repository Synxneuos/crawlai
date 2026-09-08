/**
 * CrawlAI Protocol - Unified Server Entry Point
 * Serves the Web3 Node Terminal, WebSocket Coordinator, and REST AI Crawl API.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Coordinator } = require('./coordinator');
const { CrawlerAPI } = require('./crawler_api');
const { ProxyBridge } = require('./proxy_bridge');

const PORT = process.env.PORT || 4000;
const coordinator = new Coordinator();
const crawlerApi = new CrawlerAPI(coordinator);
const proxyBridge = new ProxyBridge(coordinator, 4002);

// Start SOCKS5 bridge in background
try { proxyBridge.start(); } catch(e) { console.warn('[ProxyBridge] Non-critical start bypass:', e.message); }

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  // 1. API: POST /v1/crawl
  if (pathname === '/v1/crawl' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const targetUrl = payload.url;
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required parameter: url' }));
        }
        const result = await crawlerApi.executeCrawl(targetUrl, payload.format || 'markdown');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 2. API: GET /v1/stats
  if (pathname === '/v1/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      activeNodes: coordinator.getActiveNodesCount(),
      totalBytesRouted: coordinator.stats.totalBytesRouted,
      totalRequestsFulfilled: coordinator.stats.totalRequestsFulfilled,
      totalPointsIssued: Math.round(coordinator.stats.totalPointsIssued),
      uptimeSeconds: Math.floor((Date.now() - coordinator.stats.startTime) / 1000),
      networkHealth: '100% Optimal'
    }));
  }

  // 3. API: POST /v1/node/heartbeat
  if (pathname === '/v1/node/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const nodeId = payload.nodeId || 'demo-browser-node';
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        if (!coordinator.nodes.has(nodeId)) {
          coordinator.registerNode(nodeId, clientIp, payload.wallet, payload.referral);
        }
        const pingResult = coordinator.heartbeat(nodeId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(pingResult));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 4. Serve Static Web Terminal Frontend
  let filePath = path.join(__dirname, '..', 'web', pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '..', 'web', 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CrawlAI Protocol ($CRAWL) Core Server Active!`);
  console.log(`🌐 Web3 Terminal UI: http://localhost:${PORT}`);
  console.log(`⚡ AI Crawl API:     http://localhost:${PORT}/v1/crawl`);
  console.log(`📊 Network Stats:    http://localhost:${PORT}/v1/stats`);
  console.log(`=======================================================`);
});

module.exports = { server, coordinator, crawlerApi };
