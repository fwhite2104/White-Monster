import requests
import time
from abc import ABC, abstractmethod
from typing import List, Dict

class BaseScraper(ABC):
    def __init__(self, retailer: str, delay: float = 2.0):
        self.retailer = retailer
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "MonsterCork/1.0 (Price Comparison Bot; +https://monster-cork.vercel.app)",
            "Accept-Language": "en-IE,en;q=0.9",
        })

    @abstractmethod
    def scrape(self, query: str = "monster white") -> List[Dict]:
        pass

    def _wait(self):
        time.sleep(self.delay)

    def _log(self, message: str):
        print(f"[{self.retailer}] {message}")
