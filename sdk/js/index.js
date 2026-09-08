/**
 * CrawlAI JavaScript / Node.js SDK
 */

class CrawlAI {
  constructor(options = {}) {
    this.apiKey = options.apiKey || 'crawlai_free_tier';
    this.baseUrl = (options.baseUrl || 'http://localhost:4000').replace(/\/$/, '');
  }

  async crawl(url, format = 'markdown') {
    const res = await fetch(`${this.baseUrl}/v1/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ url, format })
    });
    if (!res.ok) throw new Error(`CrawlAI error: ${res.statusText}`);
    return res.json();
  }

  async getNetworkStats() {
    const res = await fetch(`${this.baseUrl}/v1/stats`);
    if (!res.ok) throw new Error(`Stats error: ${res.statusText}`);
    return res.json();
  }
}

module.exports = { CrawlAI };
