"""
Lidl IE scraper — NOT AVAILABLE.

Lidl Ireland (lidl.ie) does not operate an online grocery store.
The site is a brochure/marketing site with no product catalog, search,
or pricing API. Product prices cannot be scraped from any public web
source. Lidl prices must come from user reports or alternative sources.
"""

from typing import List, Dict
from base import BaseScraper


class LidlIEScraper(BaseScraper):
    """Stub scraper — Lidl Ireland has no online grocery store to scrape."""

    def __init__(self):
        super().__init__("lidl", delay=2.0)

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        self._log("Lidl.ie has no online grocery store — no prices to scrape")
        return []
