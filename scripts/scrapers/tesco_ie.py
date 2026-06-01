"""
Tesco IE scraper for Monster Energy drink prices.

Tesco.ie is a micro-frontend (MFE) SPA that embeds product data in large inline
<script> tags rather than rendering it in server-side HTML. This scraper:
  1. Fetches the search page using curl_cffi (Akamai bypass via TLS fingerprint spoofing)
  2. Locates large <script> tags containing MFE product data
  3. Extracts product names and EUR prices via regex from the script content
  4. Filters and deduplicates Monster energy products

NOTE: JSON-LD on Tesco.ie returns GBP prices, NOT EUR. Always extract EUR prices
      from the embedded MFE script data instead.
"""

from curl_cffi import requests as curl_requests
import re
from typing import List, Dict
from base import BaseScraper


class TescoIEScraper(BaseScraper):
    SEARCH_URL = "https://www.tesco.ie/groceries/en-IE/search?query={query}"

    def __init__(self):
        super().__init__("tesco", delay=2.0)
        self.session = curl_requests.Session(impersonate="chrome")
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-IE,en;q=0.9",
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,image/avif,image/webp,"
                "image/apng,*/*;q=0.8"
            ),
        })

    def scrape(self, query: str = "monster energy") -> List[Dict]:
        self._log(f"Searching: {query}")
        url = self.SEARCH_URL.format(query=query)

        try:
            response = self.session.get(url, timeout=30)

            if response.status_code > 400:
                self._log(f"HTTP {response.status_code} - possible block")
                return []

            if "Access Denied" in response.text:
                self._log("Access Denied - blocked by Akamai/Cloudflare")
                return []

            html = response.text
            results = []
            seen = set()

            script_pattern = re.compile(
                r"<script[^>]*>(.*?)</script>", re.DOTALL
            )

            for script_match in script_pattern.finditer(html):
                script_content = script_match.group(1).strip()
                if len(script_content) < 50000:
                    continue

                for title_match in re.finditer(
                    r'"title":\s*"([^"]*(?:[Mm]onster)[^"]*)"',
                    script_content,
                ):
                    product_name = title_match.group(1)
                    product_name = product_name.replace("\\u002F", "/")
                    title_start = title_match.start()

                    search_start = max(0, title_start - 500)
                    search_end = min(len(script_content), title_start + 500)
                    vicinity = script_content[search_start:search_end]

                    # Try decimal price first, then fall back to integer
                    price_match = re.search(
                        r"€\s*(\d+\.?\d{0,2})", vicinity
                    )
                    if not price_match:
                        price_match = re.search(r"€\s*(\d+)", vicinity)

                    if not price_match:
                        continue

                    price_str = price_match.group(1)
                    try:
                        price = float(price_str)
                    except ValueError:
                        continue

                    if product_name in seen:
                        continue
                    seen.add(product_name)

                    results.append({
                        "product_name": product_name,
                        "price": price,
                        "currency": "EUR",
                        "retailer": "tesco",
                    })

            self._log(f"Found {len(results)} Monster products")
            return results

        except Exception as e:
            self._log(f"Error: {e}")
            return []
