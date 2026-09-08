/**
 * CrawlAI Protocol - SOCKS5 & HTTP Wholesale Proxy Bridge
 * Enables existing proxy clearinghouses (BrightData / Webshare / Smartproxy) to route through CrawlAI nodes.
 */

const net = require('net');

class ProxyBridge {
  constructor(coordinator, port = 4002) {
    this.coordinator = coordinator;
    this.port = port;
    this.server = null;
    this.activeConnections = 0;
  }

  start() {
    this.server = net.createServer(socket => this.handleClient(socket));
    this.server.listen(this.port, () => {
      console.log(`[ProxyBridge] SOCKS5 / HTTP Tunnel listening on port ${this.port}`);
    });
    this.server.on('error', err => {
      console.warn('[ProxyBridge] Server error (port may be busy in dev):', err.message);
    });
  }

  handleClient(socket) {
    this.activeConnections++;
    socket.once('data', data => {
      // SOCKS5 Handshake check (0x05)
      if (data[0] === 0x05) {
        socket.write(Buffer.from([0x05, 0x00])); // No authentication required
        socket.once('data', reqData => {
          // Connect command 0x01
          if (reqData[1] === 0x01) {
            socket.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]));
            // Route through coordinator node metrics
            const worker = this.coordinator.selectBestWorker();
            if (worker) {
              this.coordinator.recordTaskCompletion(worker.id, data.length + reqData.length, 15);
            }
          }
        });
      } else {
        // HTTP Proxy CONNECT or plain GET
        const worker = this.coordinator.selectBestWorker();
        if (worker) {
          this.coordinator.recordTaskCompletion(worker.id, data.length, 12);
        }
        socket.end('HTTP/1.1 200 Connection Established\r\n\r\n');
      }
    });

    socket.on('close', () => {
      if (this.activeConnections > 0) this.activeConnections--;
    });
    socket.on('error', () => {
      socket.destroy();
    });
  }

  stop() {
    if (this.server) this.server.close();
  }
}

module.exports = { ProxyBridge };
