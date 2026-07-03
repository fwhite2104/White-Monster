"""Tesco IE scraper for Monster Energy drink prices.

Uses Tesco's internal xapi.tesco.com GraphQL gateway to fetch product data
directly, bypassing bot-blocked HTML pages and JS-rendered SPA.

Discovered endpoint (via Playwright network interception, July 2026):
  POST https://xapi.tesco.com/
  Headers:
    x-apikey: TvOSZJHlEk0pjniDGQFAc9Q59WGAR4dA
    content-type: application/json
    accept: application/json
    language: en-IE
    region: IE
  Body: [{"query": "... GraphQL query ..."}]

Returns product titles, prices (EUR), Clubcard promotions, and DRS charges.
"""

import json
import re
import time
from typing import Any, List, Dict

from curl_cffi import requests as curl_requests
from base import BaseScraper


XAPI_URL = "https://xapi.tesco.com/"
XAPI_KEY = "TvOSZJHlEk0pjniDGQFAc9Q59WGAR4dA"

SEARCH_QUERY = """{
    search(query: "monster energy") {
        results {
            node {
                ... on ProductType {
                    id tpnb title isForSale status
                    price { actual unitPrice unitOfMeasure }
                    promotions { id attributes description startDate endDate }
                    charges { ... on ProductDepositReturnCharge { amount } }
                    defaultImageUrl departmentName aisleName
                }
            }
        }
    }
}"""


def _parse_clubcard(description: str) -> dict:
    lowered = description.lower()
    if "clubcard" not in lowered:
        return {"is_clubcard": False, "deal_qty": None, "deal_total": None, "per_can_price": None}
    match = re.search(r'(\d+)\s*for\s*€?\s*(\d+\.?\d{0,2})', lowered)
    if match:
        qty = int(match.group(1))
        total = float(match.group(2))
        per_can = round(total / qty, 2) if qty > 0 else None
        return {"is_clubcard": True, "deal_qty": qty, "deal_total": total, "per_can_price": per_can}
    return {"is_clubcard": True, "deal_qty": None, "deal_total": None, "per_can_price": None}


class TescoIEScraper(BaseScraper):
    def __init__(self):
        super().__init__("tesco", delay=2.0)
        self._session = curl_requests.Session(impersonate="chrome")
        self._session.headers.update({
            "x-apikey": XAPI_KEY,
            "content-type": "application/json",
            "accept": "application/json",
            "language": "en-IE",
            "region": "IE",
            "origin": "https://www.tesco.ie",
            "referer": "https://www.tesco.ie/shop/en-IE/search?query=monster+energy",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-IE,en;q=0.9",
        })

    def _call_api(self, retries: int = 3) -> List[Dict]:
        last_error = None
        for attempt in range(retries):
            try:
                resp = self._session.post(
                    XAPI_URL, json=[{"query": SEARCH_QUERY}], timeout=30,
                )
                if resp.status_code == 429:
                    wait = (attempt + 1) * 5
                    self._log(f"Rate limited (429) — waiting {wait}s")
                    time.sleep(wait)
                    continue
                if resp.status_code != 200:
                    self._log(f"HTTP {resp.status_code} on attempt {attempt + 1}")
                    if attempt < retries - 1:
                        time.sleep((attempt + 1) * 3)
                    continue
                raw = resp.json()
                data = raw[0] if isinstance(raw, list) and len(raw) > 0 else raw
                errors = data.get("errors")
                if errors:
                    self._log(f"GraphQL errors: {[e.get('message','') for e in errors]}")
                    return []
                search = data.get("data", {}).get("search", {})
                results = search.get("results", [])
                products = [r["node"] for r in results if "node" in r]
                self._log(f"API returned {len(products)} products")
                return products
            except Exception as e:
                last_error = e
                self._log(f"Attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    time.sleep((attempt + 1) * 3)
        self._log(f"All {retries} attempts failed. Last error: {last_error}")
        return []

    def scrape(self, query: str = "monster energy", pack_size: str = "all") -> List[Dict]:
        self._log(f"Fetching products (pack_size={pack_size})")
        products = self._call_api()
        if not products:
            self._log("No products returned from API")
            return []

        results = []
        for prod in products:
            title = prod.get("title", "").strip()
            if not title or "monster" not in title.lower():
                continue
            price_data = prod.get("price", {})
            price = price_data.get("actual")
            if price is None or price <= 0:
                continue

            drs_amount = 0.0
            for charge in prod.get("charges", []):
                amt = charge.get("amount", 0)
                if amt:
                    drs_amount = float(amt)

            clubcard_price = None
            has_clubcard = False
            for promo in prod.get("promotions", []):
                if "CLUBCARD_PRICING" in promo.get("attributes", []):
                    parsed = _parse_clubcard(promo.get("description", ""))
                    if parsed["is_clubcard"]:
                        has_clubcard = True
                        clubcard_price = parsed["per_can_price"]

            results.append({
                "product_name": title,
                "price": float(price),
                "currency": "EUR",
                "retailer": "tesco",
                "has_clubcard_pricing": has_clubcard,
                "clubcard_price": clubcard_price,
                "drs_amount": drs_amount,
            })

        self._log(f"Found {len(results)} Monster products before filtering")
        seen = set()
        deduped = []
        for r in results:
            name = r["product_name"].lower()
            if name not in seen:
                seen.add(name)
                deduped.append(r)

        filtered = self._filter_by_pack_size(deduped, pack_size)
        self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
        return filtered


if __name__ == "__main__":
    scraper = TescoIEScraper()
    results = scraper.scrape()
    print(f"\n=== Scraped {len(results)} products ===")
    for r in results:
        club = f" (Clubcard: €{r['clubcard_price']})" if r.get('has_clubcard_pricing') else ""
        drs = f" (DRS: €{r['drs_amount']})" if r.get('drs_amount') else ""
        print(f"  €{r['price']:.2f}  {r['product_name']}{club}{drs}")
