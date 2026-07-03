"""SuperValu Ireland scraper for Monster Energy drink prices.

Monster products live in the Sports & Energy Drinks category (O301710).
Uses the Mercatus-powered category browse API.
"""

from typing import List, Dict
from supervalu_base import SuperValuBaseScraper


class SuperValuIEScraper(SuperValuBaseScraper):
    CATEGORY_ID = "O301710"

    def __init__(self):
        super().__init__("supervalu", self.CATEGORY_ID, delay=1.5)
