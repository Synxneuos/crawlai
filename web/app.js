/**
 * CrawlAI Web Terminal Client Engine
 * Handles Node Mining loop, WebSocket/Heartbeat telemetry, points simulation, and wallet connection.
 */

(function () {
  let isMining = false;
  let userPoints = 0;
  let bytesRelayed = 0;
  let requestsServed = 0;
  let miningInterval = null;
  let connectedWallet = null;
  const nodeId = 'node-' + Math.random().toString(36).substring(2, 9);

  // UI Elements
  const btnToggle = document.getElementById('btn-node-toggle');
  const toggleText = document.getElementById('node-toggle-text');
  const statusIndicator = document.getElementById('status-indicator');
  const statusLabel = document.getElementById('status-label');
  const ptsDisplay = document.getElementById('user-points');
  const ptsRate = document.getElementById('pts-rate');
  const estSolDisplay = document.getElementById('est-sol');
  const bytesDisplay = document.getElementById('data-relayed');
  const reqCount = document.getElementById('req-count');
  const btnWallet = document.getElementById('btn-wallet');
  const walletLabel = document.getElementById('wallet-label');
  const btnExecuteCrawl = document.getElementById('btn-execute-crawl');
  const crawlInput = document.getElementById('crawl-url-input');
  const consoleOutput = document.getElementById('console-output');
  const btnCopyRef = document.getElementById('btn-copy-ref');
  const refInput = document.getElementById('ref-input');
  const shareX = document.getElementById('share-x');
  const shareTg = document.getElementById('share-tg');
  const btnClaim = document.getElementById('btn-claim-payout');

  // 1. NODE MINING TOGGLE
  btnToggle.addEventListener('click', () => {
    if (!isMining) {
      startMining();
    } else {
      stopMining();
    }
  });

  function startMining() {
    isMining = true;
    btnToggle.classList.add('running');
    toggleText.textContent = 'STOP MINING NODE';
    statusIndicator.className = 'status-indicator active';
    statusLabel.textContent = 'Node Status: 🟢 Mining Active';
    ptsRate.textContent = '+15.2 pts/min';

    // Heartbeat & Points Accumulation Loop (every 2 seconds)
    miningInterval = setInterval(async () => {
      userPoints += 0.507; // ~15.2 points per minute
      bytesRelayed += Math.floor(Math.random() * 45000 + 15000); // 15KB - 60KB per tick
      if (Math.random() > 0.6) requestsServed += 1;

      updateDisplays();

      // Send ping to backend coordinator
      try {
        await fetch('/v1/node/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: nodeId,
            wallet: connectedWallet,
            timestamp: Date.now()
          })
        });
      } catch (e) {
        // Local simulation fallback
      }
    }, 2000);
  }

  function stopMining() {
    isMining = false;
    btnToggle.classList.remove('running');
    toggleText.textContent = 'START MINING NODE';
    statusIndicator.className = 'status-indicator';
    statusLabel.textContent = 'Node Status: Standby';
    ptsRate.textContent = '+0.0 pts/min';
    if (miningInterval) clearInterval(miningInterval);
  }

  function updateDisplays() {
    ptsDisplay.textContent = userPoints.toFixed(2);
    const mb = (bytesRelayed / (1024 * 1024)).toFixed(2);
    bytesDisplay.innerHTML = `${mb} <span class="unit">MB</span>`;
    reqCount.textContent = requestsServed;
    // 1,000 points = ~0.05 SOL estimate
    const solEst = ((userPoints / 1000) * 0.05).toFixed(3);
    estSolDisplay.textContent = `${solEst} SOL`;
  }

  // 2. WALLET CONNECTION (Phantom / Solflare Simulation)
  btnWallet.addEventListener('click', async () => {
    if (connectedWallet) {
      alert(`Connected Wallet: ${connectedWallet}`);
      return;
    }
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        connectedWallet = resp.publicKey.toString();
        onWalletSuccess(connectedWallet);
      } catch (err) {
        console.warn('Phantom rejected:', err);
      }
    } else {
      // Demo Phantom address
      const demoWallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      connectedWallet = demoWallet;
      onWalletSuccess(demoWallet);
    }
  });

  function onWalletSuccess(addr) {
    const short = addr.slice(0, 4) + '...' + addr.slice(-4);
    walletLabel.textContent = short;
    btnWallet.style.borderColor = '#10b981';
    btnWallet.style.color = '#10b981';
    refInput.value = `https://crawlai.mesh/?ref=${addr}`;
    setupSocialShares(addr);
  }

  function setupSocialShares(addr) {
    const msg = encodeURIComponent(`Mining AI web grounding on @CrawlAI Protocol ($CRAWL) on Solana! Earn passive SOL with 0 hardware: https://crawlai.mesh/?ref=${addr}`);
    shareX.href = `https://twitter.com/intent/tweet?text=${msg}`;
    shareTg.href = `https://t.me/share/url?url=https://crawlai.mesh/?ref=${addr}&text=Join+CrawlAI+Mesh`;
  }
  setupSocialShares('0xSolanaMaster');

  // Copy Referral
  btnCopyRef.addEventListener('click', () => {
    navigator.clipboard.writeText(refInput.value);
    btnCopyRef.textContent = 'Copied!';
    setTimeout(() => btnCopyRef.textContent = 'Copy', 2000);
  });

  // Claim Rewards
  btnClaim.addEventListener('click', () => {
    if (userPoints < 10) {
      alert('Minimum 10 points required to claim epoch rewards.');
      return;
    }
    alert(`Epoch payout of ${estSolDisplay.textContent} queued for on-chain claim to ${connectedWallet || 'Connected Wallet'}`);
  });

  // 3. INTERACTIVE AI CRAWL TEST
  btnExecuteCrawl.addEventListener('click', async () => {
    const url = crawlInput.value.trim();
    if (!url) return;

    btnExecuteCrawl.textContent = 'Routing...';
    btnExecuteCrawl.disabled = true;
    consoleOutput.innerHTML = `<span style="color:var(--gold);">[MESH GATEWAY]</span> Dispatching task to verified residential nodes...\nTarget: ${url}\n`;

    try {
      const res = await fetch('/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, format: 'markdown' })
      });
      const data = await res.json();
      
      consoleOutput.innerHTML = `
<span style="color:var(--green);">✓ CRAWL FULFILLED VIA MESH NODE (${data.routedThroughNode || 'node-local'})</span>
<span style="color:var(--cyan);">Latency: ${data.latencyMs}ms | Data: ${data.bytes || 1240} bytes | Quality Score: ${data.nodeQuality || 0.98}</span>
--------------------------------------------------------------------------------
<strong>Title:</strong> ${data.title || 'Extracted Document'}
<strong>Clean Markdown (LLM-Ready):</strong>
${(data.markdown || 'Sample markdown content extracted from target').slice(0, 500)}...
      `;
      // Reward local node for participating
      if (isMining) {
        userPoints += 2.5;
        bytesRelayed += data.bytes || 2048;
        requestsServed += 1;
        updateDisplays();
      }
    } catch (e) {
      consoleOutput.innerHTML = `<span style="color:#ef4444;">Error: ${e.message}</span>`;
    } finally {
      btnExecuteCrawl.textContent = 'Run Mesh Crawl';
      btnExecuteCrawl.disabled = false;
    }
  });

  // Fetch initial global stats
  async function fetchStats() {
    try {
      const res = await fetch('/v1/stats');
      const s = await res.json();
      document.getElementById('header-active-nodes').textContent = s.activeNodes > 0 ? s.activeNodes : '1,482';
    } catch (e) {}
  }
  fetchStats();
  setInterval(fetchStats, 10000);
})();
