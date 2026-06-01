"""
DISABLED: Aldi IE API returns 403 Forbidden (Akamai blocked).
Do not remove this scraper — it may be re-enabled if an alternative API is found.
"""
import requests
from typing import List, Dict
from base import BaseScraper

class AldiIEScraper(BaseScraper):
    MONSTER_BARCODES = [
        "5060536310047",
        "5060536310146",
        "5060536310122",
    ]

    def __init__(self):
        super().__init__("aldi", delay=1.5)
        self.api_url = "https://groceries.aldi.ie/api/product/calculatePrices"
        self.website_id = "a763fb4a-0224-4ca8-bdaa-a33a4b47a026"

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        self._log(f"Fetching Monster prices (pack_size={pack_size})")
        headers = {
            "Content-Type": "application/json",
            "websiteId": self.website_id,
            "User-Agent": self.session.headers["User-Agent"],
        }
        body = {"products": self.MONSTER_BARCODES}

        try:
            response = self.session.post(
                self.api_url, headers=headers, json=body, timeout=30
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for pp in data.get("ProductPrices", []):
                barcode = pp.get("Barcode")
                list_price = pp.get("ListPrice")
                if list_price and barcode in self.MONSTER_BARCODES:
                    results.append({
                        "product_name": self._barcode_to_name(barcode),
                        "price": float(list_price),
                        "currency": "EUR",
                        "retailer": "aldi",
                        "barcode": barcode,
                    })

            filtered = self._filter_by_pack_size(results, pack_size)
            self._log(f"Found {len(filtered)} products (pack_size={pack_size})")
            return filtered
        except requests.RequestException as e:
            self._log(f"Error: {e}")
            return []

    def _barcode_to_name(self, barcode: str) -> str:
        return {
            "5060536310047": "White Monster Zero Sugar 250ml",
            "5060536310146": "Monster Ultra White 250ml",
            "5060536310122": "Monster Ultra Rosa 250ml",
        }.get(barcode, f"Monster ({barcode})")
