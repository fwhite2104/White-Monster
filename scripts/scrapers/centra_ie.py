"""Centra Ireland scraper for Monster Energy drink prices.

Centra.ie has no public product catalog or search function. The only
page where products appear with prices is the Special Offers page at
/offers. Prices are server-rendered HTML. Monster Energy products
appear only when on promotion, so the scraper may return empty results
between promotional periods.

The offers page supports category filtering via ?category_id= but
energy drinks share categories with other beverages. We scrape all
offers and filter for Monster in the product name.
"""

import re
import requests
from bs4 import BeautifulSoup
from typing import List, Dict
from base import BaseScraper


class CentraIEScraper(BaseScraper):
    OFFERS_URL = "https://centra.ie/offers"

    def __init__(self):
        super().__init__("centra", delay=2.0)
        self.session.headers.update({
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,image/avif,image/webp,"
                "image/apng,*/*;q=0.8"
            ),
            "Referer": "https://centra.ie/",
        })

    def scrape(self, query: str = "monster", pack_size: str = "all") -> List[Dict]:
        self._log(f"Scraping offers page (pack_size={pack_size})")

        try:
            response = self._retry_request(
                lambda: self.session.get(self.OFFERS_URL, timeout=self.timeout)
            )

            if not response.ok:
                self._log(f"HTTP {response.status_code}")
                return []

            results = self._parse_offers(response.text)
            filtered = self._filter_by_pack_size(results, pack_size)
            self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
            return filtered

        except Exception as e:
            self._log(f"Error: {e}")
            return []

    def _parse_offers(self, html: str) -> List[Dict]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        seen = set()

        for card in soup.select("[class*='offer'], [class*='product'], article, .card"):
            text = card.get_text(" ", strip=True)

            if "monster" not in text.lower():
                continue

            name = self._extract_name(card)
            if not name or "monster" not in name.lower():
                continue

            if name in seen:
                continue
            seen.add(name)

            price = self._extract_price(card, text)
            if price is None:
                continue

            results.append({
                "product_name": name,
                "price": price,
                "currency": "EUR",
                "retailer": "centra",
            })

        if results:
            return results

        for card in soup.select("a[href*='/offers/']"):
            text = card.get_text(" ", strip=True)

            if "monster" not in text.lower():
                continue

            name = self._extract_name(card)
            if not name or "monster" not in name.lower():
                continue

            if name in seen:
                continue
            seen.add(name)

            price = self._extract_price(card, text)
            if price is None:
                continue

            results.append({
                "product_name": name,
                "price": price,
                "currency": "EUR",
                "retailer": "centra",
            })

        return results

    def _extract_name(self, element) -> str:
        for selector in ["h2", "h3", "h4", ".title", ".name", ".product-name", "a"]:
            tag = element.select_one(selector)
            if tag:
                name = tag.get_text(strip=True)
                if name and len(name) > 3:
                    return name

        for tag in element.find_all(["h2", "h3", "h4"]):
            text = tag.get_text(strip=True)
            if text and len(text) > 3:
                return text

        return ""

    def _extract_price(self, element, full_text: str) -> float | None:
        for selector in [".price", "[class*='price']", ".value", ".cost"]:
            price_el = element.select_one(selector)
            if price_el:
                match = re.search(r"€?\s*(\d+\.?\d{0,2})", price_el.get_text(strip=True))
                if match:
                    try:
                        price = float(match.group(1))
                        if 0 < price <= 50:
                            return price
                    except ValueError:
                        continue

        match = re.search(r"€\s*(\d+\.?\d{0,2})", full_text)
        if match:
            try:
                price = float(match.group(1))
                if 0 < price <= 50:
                    return price
            except ValueError:
                pass

        return None