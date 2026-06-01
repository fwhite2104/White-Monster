import requests
from typing import List, Dict
from base import BaseScraper


class SuperValuIEScraper(BaseScraper):
    def __init__(self):
        super().__init__("supervalu", delay=1.5)
        self.api_url = "https://storefrontgateway.supervalu.ie/api/stores/5550/productsearch"
        self.session.headers.update({
            "X-Site-Host": "https://shop.supervalu.ie",
            "X-Shopping-Mode": "22222222-2222-2222-2222-222222222222",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://shop.supervalu.ie",
            "Referer": "https://shop.supervalu.ie/",
        })

    def scrape(self, query: str = "monster white") -> List[Dict]:
        self._log(f"Searching: {query}")
        results = []
        page = 1

        while True:
            try:
                response = self.session.get(
                    self.api_url,
                    params={
                        "search": query,
                        "page": page,
                        "take": 30,
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
                    if "monster" in name.lower():
                        results.append({
                            "product_name": name,
                            "price": float(item.get("priceNumeric", 0)),
                            "currency": "EUR",
                            "retailer": "supervalu",
                        })

                total = data.get("total", 0)
                if page * 30 >= total:
                    break
                page += 1
                self._wait()

            except requests.RequestException as e:
                self._log(f"Error: {e}")
                break
            except Exception as e:
                self._log(f"Error: {e}")
                break

        self._log(f"Found {len(results)} products")
        return results
