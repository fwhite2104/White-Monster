import requests
from typing import List, Dict
from base import BaseScraper

class LidlIEScraper(BaseScraper):
    def __init__(self):
        super().__init__("lidl", delay=1.0)
        self.api_url = "https://search.api.lidl.ie/v1/search"

    def scrape(self, query: str = "monster white") -> List[Dict]:
        self._log(f"Searching: {query}")
        results = []
        page = 0

        while True:
            try:
                response = self.session.get(
                    self.api_url,
                    params={
                        "q": query,
                        "market": "IE",
                        "language": "en",
                        "page": page,
                        "pageSize": 24,
                        "sort": "relevance",
                    },
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()
                products = data.get("products", [])
                if not products:
                    break

                for product in products:
                    name = product.get("name", "").lower()
                    if "monster" in name and ("white" in name or "ultra" in name):
                        results.append({
                            "product_name": product.get("name"),
                            "price": float(product.get("price", {}).get("value", 0)),
                            "currency": "EUR",
                            "url": f"https://www.lidl.ie{product.get('slug', '')}",
                            "retailer": "lidl",
                        })

                total = data.get("totalResults", 0)
                if (page + 1) * 24 >= total:
                    break
                page += 1
                self._wait()
            except requests.RequestException as e:
                self._log(f"Error: {e}")
                break

        self._log(f"Found {len(results)} products")
        return results
