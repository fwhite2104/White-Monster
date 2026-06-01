import requests
import time
import re
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
    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        pass

    def _wait(self):
        time.sleep(self.delay)

    def _log(self, message: str):
        print(f"[{self.retailer}] {message}")

    @staticmethod
    def _detect_pack_size(product_name: str) -> str:
        """Detect if a product is a 4-pack or single can from its name.

        Returns:
            '4_pack' if the product name indicates a 4-pack/multi-pack
            'single' if it indicates a single can
            'unknown' if it cannot be determined
        """
        lowered = product_name.lower()

        # 4-pack indicators (order matters - check these first)
        four_pack_patterns = [
            r'\b4\s*pack\b',
            r'\b4\s*x\s*',
            r'\b4x\b',
            r'\b4\s*×',
            r'\b4\s*pc\b',
            r'\b4\s*pk\b',
            r'\b4\s*can\b',
            r'\bfour\s*pack\b',
            r'\bmultipack\b',
            r'\bmulti\s*pack\b',
            r'\b4\s*\.\s*',
            r'\b4\s*\*\s*',
        ]

        for pattern in four_pack_patterns:
            if re.search(pattern, lowered):
                return '4_pack'

        # Single can indicators
        single_patterns = [
            r'\bsingle\b',
            r'\b1\s*x\s*',
            r'\b1x\b',
            r'\b1\s*can\b',
            r'\b1\s*pack\b',
            r'\bone\s*can\b',
        ]

        for pattern in single_patterns:
            if re.search(pattern, lowered):
                return 'single'

        # If it says just "500ml" without any pack indicator, it's likely single
        # If it says "4 x 500ml" or similar, it's a 4-pack (already caught above)
        if re.search(r'\b500ml\b|\b500\s*ml\b', lowered):
            # Check if there's any number before the ml that suggests multi-pack
            if re.search(r'\b[2-9]\s*x\s*\d+\s*ml', lowered):
                return '4_pack'
            return 'single'

        return 'unknown'

    @staticmethod
    def _filter_by_pack_size(results: List[Dict], pack_size: str) -> List[Dict]:
        """Filter results by pack size.

        Args:
            results: List of product dicts with 'product_name' key
            pack_size: 'single', '4_pack', or 'all'

        Returns:
            Filtered list of results
        """
        if pack_size == 'all':
            return results

        filtered = []
        for r in results:
            detected = BaseScraper._detect_pack_size(r.get('product_name', ''))
            if detected == pack_size or detected == 'unknown':
                filtered.append(r)

        return filtered
