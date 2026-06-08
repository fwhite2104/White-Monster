import requests
import time
import re
from abc import ABC, abstractmethod
from typing import List, Dict, Callable, TypeVar

T = TypeVar('T')


class BaseScraper(ABC):
    def __init__(self, retailer: str, delay: float = 2.0, timeout: int = 30):
        self.retailer = retailer
        self.delay = delay
        self.timeout = timeout
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

    def _screenshot_debug(self, page, name_suffix=""):
        try:
            filename = f"debug_{self.retailer}_{name_suffix}.png" if name_suffix else f"debug_{self.retailer}.png"
            page.screenshot(path=filename)
            self._log(f"  Debug screenshot saved: {filename}")
        except Exception as e:
            self._log(f"  Failed to save debug screenshot: {e}")

    def _retry_request(self, fn: Callable[[], T], max_retries: int = 3, base_delay: float = 2.0) -> T:
        last_err: Exception | None = None
        for attempt in range(max_retries + 1):
            try:
                result = fn()
                if attempt > 0:
                    self._log(f"  Retry attempt {attempt} succeeded")
                return result
            except Exception as e:
                last_err = e
                if attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    self._log(f"  Attempt {attempt + 1} failed: {e}. Retrying in {delay:.1f}s...")
                    time.sleep(delay)
                else:
                    self._log(f"  All {max_retries + 1} attempts failed. Last error: {e}")
        raise last_err  # type: ignore[misc]

    @staticmethod
    def _validate_product(product: dict) -> bool:
        if not isinstance(product, dict):
            return False
        name = product.get('product_name')
        if not isinstance(name, str) or not name.strip():
            return False
        price = product.get('price')
        if not isinstance(price, (int, float)) or price <= 0:
            return False
        if price > 100:
            return False
        currency = product.get('currency')
        if currency and currency != 'EUR':
            return False
        return True

    @staticmethod
    def _validate_monster_product(product_name: str) -> bool:
        """Strict validation that a product is actually a Monster Energy drink.

        Prevents false positives from products that merely contain 'monster'
        in their description (e.g., 'Monster Mash Board Game', 'Monster Truck').
        """
        lowered = product_name.lower()

        if 'monster' not in lowered:
            return False

        known_monster_patterns = [
            'ultra white', 'ultra rosa', 'ultra paradise', 'ultra gold',
            'ultra violet', 'ultra peachy', 'zero sugar', 'white zero',
            'lando norris', 'viking berry', 'mango loco', 'pipeline punch',
            'assault', 'khaotic', 'hydro', 'rehab', 'juice monster',
            'monster energy', 'monster papillon', 'monster java',
        ]

        if any(pattern in lowered for pattern in known_monster_patterns):
            return True

        if 'monster' in lowered and ('energy' in lowered or 'drink' in lowered or 'can' in lowered or 'ml' in lowered):
            return True

        return False

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
