"""SuperValu Ireland scraper for Monster Energy drink prices.

Uses the Mercatus-powered category browse API (not productsearch which
returns 404). Monster products live in the Sports & Energy Drinks category
(O301710). The X-Shopping-Mode header is required for promotions data.

Key findings from testing:
- /productsearch endpoint returns 404 — does NOT exist
- /categories/O301710/search returns Monster products with EUR prices
- Store ID 5550 is valid for delivery mode (Cork area)
- X-Shopping-Mode UUID unlocks promotions data
"""

import re
import requests
from typing import List, Dict
from base import BaseScraper


class SuperValuIEScraper(BaseScraper):
    CATEGORY_ID = "O301710"
    STORE_ID = "5550"

    def __init__(self):
        super().__init__("supervalu", delay=1.5)
        self.api_url = (
            f"https://storefrontgateway.supervalu.ie/api/stores/{self.STORE_ID}"
            f"/categories/{self.CATEGORY_ID}/search"
        )
        self.session.headers.update({
            "X-Site-Host": "https://shop.supervalu.ie",
            "X-Shopping-Mode": "22222222-2222-2222-2222-222222222222",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://shop.supervalu.ie",
            "Referer": "https://shop.supervalu.ie/",
        })

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        self._log(f"Browsing Sports & Energy Drinks category (O301710) (pack_size={pack_size})")
        results: List[Dict] = []
        page = 1
        take = 50
        max_items = 200

        while len(results) < max_items:
            try:
                response = self._retry_request(
                    lambda p=page: self.session.get(
                        self.api_url,
                        params={"take": take, "page": p, "skip": (p - 1) * take},
                        timeout=self.timeout,
                    )
                )
                response.raise_for_status()
            except requests.RequestException as e:
                self._log(f"  Failed after retries: {e}")
                break

            data = response.json()
            items = data.get("items", [])
            if not items:
                break

            for item in items:
                name = item.get("name", "")
                brand = item.get("brand", "")
                if not ("monster" in name.lower() or "monster" in brand.lower()):
                    continue
                if not self._validate_monster_product(name):
                    continue

                price = self._extract_price(item)
                if price is None:
                    continue

                results.append({
                    "product_name": name,
                    "price": price,
                    "currency": "EUR",
                    "retailer": "supervalu",
                })

            total = data.get("total", 0)
            if page * take >= total or page * take >= max_items:
                break
            page += 1
            self._wait()

        filtered = self._filter_by_pack_size(results, pack_size)
        self._log(f"Found {len(filtered)} products (pack_size={pack_size})")
        return filtered

    def _extract_price(self, item: dict) -> float | None:
        price_str = item.get("price", "")
        if isinstance(price_str, (int, float)):
            return float(price_str) if price_str > 0 else None

        price_num = item.get("priceNumeric", 0)
        if isinstance(price_num, (int, float)) and price_num > 0:
            deal_price = self._detect_deal_price(item)
            if deal_price is not None:
                return deal_price
            return float(price_num)

        if isinstance(price_str, str):
            match = re.search(r"(\d+\.?\d*)", price_str)
            if match:
                return float(match.group(1))

        return None

    def _detect_deal_price(self, item: dict) -> float | None:
        promotion = item.get("promotion", "")
        if not isinstance(promotion, str) or not promotion:
            return None

        lower = promotion.lower()
        multi_buy = re.search(r"(\d+)\s*for\s*€?\s*(\d+\.?\d*)", lower)
        if multi_buy:
            qty = int(multi_buy.group(1))
            total = float(multi_buy.group(2))
            if qty > 0 and total > 0:
                per_can = round(total / qty, 2)
                self._log(f"  Deal detected: {qty} for €{total} = €{per_can}/can")
                return per_can

        return None
