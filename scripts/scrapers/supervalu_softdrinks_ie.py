"""SuperValu Ireland Soft Drinks scraper for Monster Energy 4-packs.

4-packs are in the Soft Drinks category (O200405), not the Sports &
Energy Drinks category (O301710) which only contains single cans.
"""

from typing import List, Dict
from supervalu_base import SuperValuBaseScraper


class SuperValuSoftDrinksScraper(SuperValuBaseScraper):
    CATEGORY_ID = "O200405"

    def __init__(self):
        super().__init__("supervalu-softdrinks", self.CATEGORY_ID, delay=1.5)
