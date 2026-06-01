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

import requests
from typing import List, Dict
from base import BaseScraper


class SuperValuIEScraper(BaseScraper):
    # Category O301710 = "Sports & Energy Drinks" — where Monster products live
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
        results = []
        page = 1
        take = 50
        max_items = 100

        while len(results) < max_items:
            try:
                response = self.session.get(
                    self.api_url,
                    params={
                        "take": take,
                        "page": page,
                        "skip": (page - 1) * take,
                    },
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()
                items = data.get("items", [])
                if not items:
                    break

                for item in items:
                    name = item.get("name", "")
                    brand = item.get("brand", "")
                    if "monster" in name.lower() or "monster" in brand.lower():
                        results.append({
                            "product_name": name,
                            "price": float(item.get("priceNumeric", 0)),
                            "currency": "EUR",
                            "retailer": "supervalu",
                        })

                total = data.get("total", 0)
                if page * take >= total or page * take >= max_items:
                    break
                page += 1
                self._wait()

            except requests.RequestException as e:
                self._log(f"Error: {e}")
                break
            except Exception as e:
                self._log(f"Error: {e}")
                break

        filtered = self._filter_by_pack_size(results, pack_size)
        self._log(f"Found {len(filtered)} products (pack_size={pack_size})")
        return filtered
