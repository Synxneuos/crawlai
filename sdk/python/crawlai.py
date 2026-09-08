"""
CrawlAI Python SDK
Drop-in client for LangChain, LlamaIndex, and autonomous AI agents.
"""

import json
import urllib.request
from typing import Dict, Any, Optional

class CrawlAI:
    def __init__(self, api_key: str = "crawlai_free_tier", base_url: str = "http://localhost:4000"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def crawl(self, url: str, format: str = "markdown") -> Dict[str, Any]:
        """
        Execute a decentralized residential crawl for an arbitrary URL.
        Returns clean LLM-ready markdown or raw HTML.
        """
        endpoint = f"{self.base_url}/v1/crawl"
        payload = json.dumps({"url": url, "format": format}).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                "User-Agent": "CrawlAI-Python-SDK/1.0"
            }
        )
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def get_network_stats(self) -> Dict[str, Any]:
        """Get live metrics on active residential nodes and throughput."""
        endpoint = f"{self.base_url}/v1/stats"
        req = urllib.request.Request(endpoint, headers={"User-Agent": "CrawlAI-Python-SDK/1.0"})
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
