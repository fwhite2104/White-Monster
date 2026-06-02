"""
Tesco IE scraper for Monster Energy drink prices.

Tesco.ie is a micro-frontend (MFE) SPA that embeds product data in large inline
<script> tags rather than rendering it in server-side HTML. This scraper:
  1. Fetches the search page using curl_cffi (Akamai bypass via TLS fingerprint spoofing)
  2. Locates large <script> tags containing MFE product data
  3. Extracts product names and EUR prices via regex from the script content
  4. Filters and deduplicates Monster energy products

DEAL PRICE DETECTION:
  Tesco Ireland frequently runs "2 for €X" or "3 for €Y" promotions on energy drinks.
  These deal prices appear alongside products but represent the TOTAL price for multiple
  cans, not the per-can price. The scraper detects these patterns and either:
  - Calculates the per-can price (deal_price / quantity) when a single-can price is unavailable
  - Skips the deal price entirely when a genuine single-can price exists

NOTE: JSON-LD on Tesco.ie returns GBP prices, NOT EUR. Always extract EUR prices
      from the embedded MFE script data instead.
"""

from curl_cffi import requests as curl_requests
import re
from typing import List, Dict
from base import BaseScraper


class TescoIEScraper(BaseScraper):
    SEARCH_URL = "https://www.tesco.ie/groceries/en-IE/search?query={query}"

    MULTI_BUY_PATTERNS = [
        (re.compile(r'\b(\d+)\s*for\s*€?\s*(\d+\.?\d{0,2})\b', re.IGNORECASE), 'multi_buy'),
        (re.compile(r'\b(\d+)\s*for\s*€?\s*(\d+)\b', re.IGNORECASE), 'multi_buy'),
        (re.compile(r'any\s+(\d+)\s*[\/]\s*€?\s*(\d+\.?\d{0,2})\b', re.IGNORECASE), 'multi_buy'),
        (re.compile(r'€(\d+\.?\d{0,2})\s+each\s+when\s+you\s+buy\s+(\d+)\b', re.IGNORECASE), 'each_when_buy_n'),
    ]

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

    def _detect_deal_price(self, product_name: str, vicinity: str, price: float) -> dict:
        """Check if a price is a multi-buy deal and return the per-can price.

        Returns:
            dict with keys:
              - 'is_deal': bool - whether this is a multi-buy deal
              - 'per_can_price': float or None - the calculated per-can price
              - 'deal_text': str or None - the matched deal text
        """
        lowered_name = product_name.lower()

        if '4' in lowered_name and ('pack' in lowered_name or 'x' in lowered_name.split()):
            return {'is_deal': False, 'per_can_price': None, 'deal_text': None}

        # Check product name for multi-buy indicators (e.g., "2 For €4.50")
        for pattern, pattern_type in self.MULTI_BUY_PATTERNS:
            match = pattern.search(lowered_name)
            if match:
                if pattern_type == 'multi_buy':
                    quantity = int(match.group(1))
                    deal_total = float(match.group(2))
                    if quantity > 1 and deal_total > 0:
                        per_can = round(deal_total / quantity, 2)
                        return {
                            'is_deal': True,
                            'per_can_price': per_can,
                            'deal_text': match.group(0),
                        }
                elif pattern_type == 'each_when_buy_n':
                    # "€2.25 each when you buy 2" - per-can price is already given
                    per_can = float(match.group(1))
                    return {
                        'is_deal': True,
                        'per_can_price': per_can,
                        'deal_text': match.group(0),
                    }

        # Check vicinity text for multi-buy deal patterns
        for pattern, pattern_type in self.MULTI_BUY_PATTERNS:
            match = pattern.search(vicinity)
            if match:
                if pattern_type == 'multi_buy':
                    quantity = int(match.group(1))
                    deal_total = float(match.group(2))
                    if quantity > 1 and deal_total > 0:
                        per_can = round(deal_total / quantity, 2)
                        # Only flag as a deal if the extracted price matches the deal total
                        # (meaning we captured the deal price, not the per-can price)
                        if abs(price - deal_total) < 0.01:
                            return {
                                'is_deal': True,
                                'per_can_price': per_can,
                                'deal_text': match.group(0),
                            }
                elif pattern_type == 'each_when_buy_n':
                    per_can = float(match.group(1))
                    if abs(price - per_can) > 0.5:
                        # The per-can price is different from what we extracted
                        return {
                            'is_deal': True,
                            'per_can_price': per_can,
                            'deal_text': match.group(0),
                        }

        # Heuristic: single Monster cans in Ireland are typically €1.50-€3.50
        # Prices above €4 for a "single" can are likely deal prices
        if price > 4.0 and '4' not in lowered_name and 'pack' not in lowered_name:
            # Common Irish deal: "2 for €4.50", "2 for €5", "3 for €6"
            # Try common deal quantities to find a plausible per-can price
            for qty in [2, 3]:
                per_can = round(price / qty, 2)
                if 1.0 <= per_can <= 3.5:
                    return {
                        'is_deal': True,
                        'per_can_price': per_can,
                        'deal_text': f'suspected {qty}-for-€{price:.2f} deal',
                    }

        return {'is_deal': False, 'per_can_price': None, 'deal_text': None}

    def scrape(self, query: str = "monster energy", pack_size: str = "all") -> List[Dict]:
        self._log(f"Searching: {query} (pack_size={pack_size})")
        url = self.SEARCH_URL.format(query=query)

        try:
            response = self._retry_request(
                lambda: self.session.get(url, timeout=self.timeout)
            )

            if response.status_code > 400:
                self._log(f"HTTP {response.status_code} - possible block")
                return []

            if "Access Denied" in response.text:
                self._log("Access Denied - blocked by Akamai/Cloudflare")
                return []

            html = response.text
            results = []
            seen_names = set()
            deal_adjusted = 0

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

                    # Unique key: product name dedup
                    if product_name in seen_names:
                        continue
                    seen_names.add(product_name)

                    # Detect multi-buy deal prices
                    deal_info = self._detect_deal_price(product_name, vicinity, price)
                    if deal_info['is_deal']:
                        if deal_info['per_can_price'] is not None:
                            original_price = price
                            price = deal_info['per_can_price']
                            self._log(f"  Deal detected: '{deal_info['deal_text']}' for '{product_name}' "
                                       f"— adjusted €{original_price:.2f} → €{price:.2f}/can")
                            deal_adjusted += 1
                        else:
                            self._log(f"  Skipping deal price €{price:.2f} for '{product_name}' "
                                       f"({deal_info['deal_text']})")
                            continue

                    # Sanity check: single Monster cans rarely cost more than €4
                    if price > 4.0 and '4_pack' not in BaseScraper._detect_pack_size(product_name):
                        self._log(f"  WARNING: Suspicious single-can price €{price:.2f} for '{product_name}'")

                    results.append({
                        "product_name": product_name,
                        "price": price,
                        "currency": "EUR",
                        "retailer": "tesco",
                    })

            filtered = self._filter_by_pack_size(results, pack_size)
            self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size}), "
                       f"{deal_adjusted} deal prices adjusted")
            return filtered

        except Exception as e:
            self._log(f"Error: {e}")
            return []
