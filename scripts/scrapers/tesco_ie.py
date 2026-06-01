from curl_cffi import requests as curl_requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict
from base import BaseScraper


class TescoIEScraper(BaseScraper):
    SEARCH_URL = "https://www.tesco.ie/groceries/en-IE/search?query={query}"

    def __init__(self):
        super().__init__("tesco", delay=2.0)
        self.session = curl_requests.Session(impersonate="chrome")
        self.session.headers.update({
            "User-Agent": "MonsterCork/1.0 (Price Comparison Bot; +https://monster-cork.vercel.app)",
            "Accept-Language": "en-IE,en;q=0.9",
        })

    def scrape(self, query: str = "monster white") -> List[Dict]:
        self._log(f"Searching: {query}")
        url = self.SEARCH_URL.format(query=query)

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            listings = soup.find_all("li", class_="product-list--list-item")
            self._log(f"Found {len(listings)} product listings")

            for listing in listings:
                name_el = listing.find("h3")
                if not name_el:
                    name_el = listing.find("a", class_=re.compile(r"product"))
                if not name_el:
                    name_el = listing.find(class_=re.compile(r"(title|name)"))

                price_el = listing.find("span", string=re.compile(r"€"))
                if not price_el:
                    price_el = listing.find(string=re.compile(r"€"))

                name = name_el.get_text(strip=True) if name_el else ""
                price_text = (
                    price_el.get_text(strip=True) if hasattr(price_el, "get_text")
                    else price_el.strip() if isinstance(price_el, str)
                    else ""
                )

                if not name or not price_text:
                    continue

                if "monster" not in name.lower():
                    continue

                price = self._extract_price(price_text)
                if price is None:
                    continue

                results.append({
                    "product_name": name,
                    "price": price,
                    "currency": "EUR",
                    "retailer": "tesco",
                })

            self._log(f"Found {len(results)} Monster products")
            return results

        except Exception as e:
            self._log(f"Error: {e}")
            return []

    @staticmethod
    def _extract_price(text: str) -> float | None:
        match = re.search(r"€\s*(\d+[.,]\d+)", text)
        if match:
            return float(match.group(1).replace(",", "."))
        return None
