"""
Dunnes Stores Ireland scraper for Monster Energy drink prices.

Dunnes uses a React SPA with all product data embedded in
window.__PRELOADED_STATE__ as JSON. Product details are in
productCardDictionary keyed by product IDs from searchResults.
CSS selectors don't work because the server-rendered HTML has
no product cards. curl_cffi with impersonate="chrome" bypasses
Cloudflare. Search for "monster" (not "monster white").
"""

from curl_cffi import requests as curl_requests
import re
import json
import time
from typing import List, Dict
from base import BaseScraper


CLOUDFLARE_MARKERS = [
    "Checking your browser",
    "Just a moment",
    "cf-browser-verification",
    "cf-challenge-running",
]


class DunnesIEScraper(BaseScraper):
    SEARCH_URL = (
        "https://www.dunnesstoresgrocery.com/sm/delivery/rsid/258/results"
        "?q={query}"
    )

    def __init__(self):
        super().__init__("dunnes", delay=2.0)
        self.cloudflare_blocked = False
        self.session = curl_requests.Session(impersonate="chrome")
        self.session.headers.update({
            "User-Agent": (
                "MonsterCork/1.0 (Price Comparison Bot; "
                "+https://monster-cork.vercel.app)"
            ),
            "Accept-Language": "en-IE,en;q=0.9",
        })

    def scrape(self, query: str = "monster", pack_size: str = "all") -> List[Dict]:
        self._log(f"Searching: {query} (pack_size={pack_size})")
        url = self.SEARCH_URL.format(query=query)

        try:
            response = self._retry_request(
                lambda: self.session.get(url, timeout=self.timeout)
            )

            # Check for Cloudflare challenge before generic status handling.
            # Cloudflare may return 200 with a challenge page, 403, or 503.
            if self._is_cloudflare_challenge(response.text):
                self.cloudflare_blocked = True
                self._log(f"  [CLOUDFLARE_BLOCKED] Cloudflare challenge detected (HTTP {response.status_code}) — cannot scrape")
                return []

            if not response.ok:
                self._log(f"Non-200 status: {response.status_code}")
                return []

            results = self._extract_products(response.text)
            filtered = self._filter_by_pack_size(results, pack_size)
            self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
            return filtered

        except Exception as e:
            self._log(f"Error after retries: {e}")
            return []

    def _extract_products(self, html: str) -> List[Dict]:
        state_marker = "__PRELOADED_STATE__"
        state_idx = html.find(state_marker)
        if state_idx == -1:
            self._log("No __PRELOADED_STATE__ found")
            return []

        sr_match = re.search(
            r'"searchResults":\[([^\]]*)\]', html[state_idx:]
        )
        if not sr_match:
            self._log("No searchResults found")
            return []

        product_ids = re.findall(r'"(\d{9,12})"', sr_match.group(1))
        if not product_ids:
            return []

        pcd_idx = html.rfind('"productCardDictionary":{', state_idx)
        if pcd_idx == -1:
            pcd_idx = html.find('"productCardDictionary":{', state_idx)
        if pcd_idx == -1:
            return []

        results = []
        for pid in product_ids:
            product = self._extract_product(html, pcd_idx, pid)
            if product:
                results.append(product)

        return results

    def _extract_product(
        self, html: str, search_start: int, product_id: str
    ) -> Dict | None:
        pid_key = f'"{product_id}":'
        idx = html.find(pid_key, search_start)
        if idx == -1:
            return None

        obj_start = html.find("{", idx + len(pid_key))
        if obj_start == -1:
            return None

        depth = 0
        obj_end = obj_start
        for i in range(obj_start, min(obj_start + 10000, len(html))):
            if html[i] == "{":
                depth += 1
            elif html[i] == "}":
                depth -= 1
                if depth == 0:
                    obj_end = i + 1
                    break

        if depth != 0:
            return None

        obj_str = html[obj_start:obj_end]
        try:
            product = json.loads(obj_str)
        except json.JSONDecodeError:
            return None

        name = product.get("name", "")
        brand = product.get("brand", "")
        if not self._validate_monster_product(name):
            return None

        price_data = product.get("price", {})
        price_str = str(price_data.get("now", "")) if isinstance(price_data, dict) else str(price_data)
        if not price_str:
            return None

        price_match = re.search(r"€?\s*(\d+\.?\d*)", price_str)
        if not price_match:
            return None

        try:
            price = float(price_match.group(1))
        except ValueError:
            return None

        if price <= 0 or price > 100:
            return None

        return {
            "product_name": name,
            "price": price,
            "currency": "EUR",
            "retailer": "dunnes",
        }

    @staticmethod
    def _is_cloudflare_challenge(html: str) -> bool:
        lowered = html.lower()
        return any(marker.lower() in lowered for marker in CLOUDFLARE_MARKERS)
