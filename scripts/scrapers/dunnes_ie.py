from curl_cffi import requests as curl_requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict
from base import BaseScraper


CLOUDFLARE_MARKERS = [
    "Checking your browser",
    "Just a moment",
    "cf-browser-verification",
    "cf-challenge-running",
]


class DunnesIEScraper(BaseScraper):
    SEARCH_URL = (
        "https://www.dunnesstoresgrocery.com/sm/delivery/rsid/258/results"
        "?q={query}"
    )

    def __init__(self):
        super().__init__("dunnes", delay=2.0)
        self.session = curl_requests.Session(impersonate="chrome")
        self.session.headers.update({
            "User-Agent": (
                "MonsterCork/1.0 (Price Comparison Bot; "
                "+https://monster-cork.vercel.app)"
            ),
            "Accept-Language": "en-IE,en;q=0.9",
        })

    def scrape(self, query: str = "monster white") -> List[Dict]:
        self._log(f"Searching: {query}")
        url = self.SEARCH_URL.format(query=query)

        try:
            response = self.session.get(url, timeout=30)

            if not response.ok:
                self._log(f"Non-200 status: {response.status_code}")
                return []

            if self._is_cloudflare_challenge(response.text):
                self._log("Cloudflare challenge detected — cannot scrape")
                return []

            soup = BeautifulSoup(response.text, "html.parser")
            results = []

            cards = self._find_product_cards(soup)
            self._log(f"Found {len(cards)} product card candidates")

            for card in cards:
                name = self._extract_name(card)
                if not name:
                    continue
                if "monster" not in name.lower():
                    continue

                price_text = self._extract_price_text(card)
                if not price_text:
                    continue

                price = self._parse_price(price_text)
                if price is None:
                    continue

                results.append({
                    "product_name": name,
                    "price": price,
                    "currency": "EUR",
                    "retailer": "dunnes",
                })

            self._log(f"Found {len(results)} Monster products")
            return results

        except Exception as e:
            self._log(f"Error: {e}")
            return []

    @staticmethod
    def _is_cloudflare_challenge(html: str) -> bool:
        lowered = html.lower()
        return any(marker.lower() in lowered for marker in CLOUDFLARE_MARKERS)

    @staticmethod
    def _find_product_cards(soup: BeautifulSoup):
        selectors = [
            {"class_": re.compile(r"product", re.I)},
            {"class_": re.compile(r"card", re.I)},
            {"class_": re.compile(r"item", re.I)},
            {"class_": re.compile(r"tile", re.I)},
            {"name": "li"},
        ]
        for sel in selectors:
            cards = soup.find_all(**sel)
            if len(cards) >= 2:
                return cards
        return []

    @staticmethod
    def _extract_name(card) -> str:
        selectors = [
            {"name": "h3"},
            {"name": "h2"},
            {"class_": re.compile(r"name", re.I)},
            {"class_": re.compile(r"title", re.I)},
            {"class_": re.compile(r"desc", re.I)},
        ]
        for sel in selectors:
            el = card.find(**sel)
            if el:
                text = el.get_text(strip=True)
                if text:
                    return text
        return ""

    @staticmethod
    def _extract_price_text(card) -> str:
        selectors = [
            {"string": re.compile(r"€")},
            {"class_": re.compile(r"price", re.I)},
            {"class_": re.compile(r"amount", re.I)},
        ]
        for sel in selectors:
            el = card.find(**sel)
            if el:
                if hasattr(el, "get_text"):
                    text = el.get_text(strip=True)
                elif isinstance(el, str):
                    text = el.strip()
                else:
                    continue
                if "€" in text:
                    return text
        return ""

    @staticmethod
    def _parse_price(text: str) -> float | None:
        match = re.search(r"€\s*([\d,]+\.?\d*)", text)
        if match:
            return float(match.group(1).replace(",", ""))
        return None
