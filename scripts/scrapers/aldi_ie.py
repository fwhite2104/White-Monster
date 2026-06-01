"""
Aldi IE scraper for Monster Energy drink prices using Playwright browser automation.

The previous API approach (groceries.aldi.ie/api/product/calculatePrices) is blocked
by Akamai (403 Forbidden). This scraper navigates the Aldi grocery site directly,
handles cookie consent, waits for product listings to render, and extracts names
and prices from the DOM.
"""

import time
import re
from typing import List, Dict
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from base import BaseScraper


class AldiIEScraper(BaseScraper):
    SEARCH_URL = "https://groceries.aldi.ie/en-IE/Search?SearchTerm=monster+energy"

    NAVIGATION_TIMEOUT = 30000
    SELECTOR_TIMEOUT = 10000
    BANNER_TIMEOUT = 2000

    PRODUCT_CARD_SELECTORS = [
        '[data-testid="product-tile"]',
        '[data-testid="product-item"]',
        '.product-tile',
        '.product-item',
        '.search-result-item',
        '[class*="ProductTile"]',
        '[class*="productTile"]',
        '[class*="ProductCard"]',
        '[class*="product-card"]',
        'article',
    ]

    NAME_SELECTORS = [
        '[data-testid="product-name"]',
        '[data-testid="product-title"]',
        '.product-name',
        '.product-title',
        'h3',
        'h2',
        '[class*="title"]',
        '[class*="name"]',
        '[class*="Title"]',
        '[class*="Name"]',
    ]

    PRICE_SELECTORS = [
        '[data-testid="product-price"]',
        '[data-testid="price"]',
        '.price',
        '[class*="price"]',
        '[class*="Price"]',
        '[class*="cost"]',
        '[class*="Cost"]',
    ]

    COOKIE_BUTTON_PATTERNS = [
        'Accept All Cookies',
        'Accept All',
        'Allow All',
        'I agree',
        'Agree',
        'Yes, I accept',
        'Continue',
        'Accept',
    ]

    def __init__(self):
        super().__init__("aldi", delay=2.0)

    def _log(self, message: str):
        print(f"[aldi] {message}")

    def _wait(self):
        time.sleep(self.delay)

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        self._log(f"Starting Playwright scrape (query={query}, pack_size={pack_size})")
        self._wait()

        results: List[Dict] = []
        browser = None
        context = None
        page = None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent=(
                        "MonsterCork/1.0 (Price Comparison Bot; "
                        "+https://monster-cork.vercel.app)"
                    ),
                    locale="en-IE",
                )
                page = context.new_page()

                self._log(f"Navigating to {self.SEARCH_URL}")
                page.goto(self.SEARCH_URL, wait_until="domcontentloaded", timeout=self.NAVIGATION_TIMEOUT)

                self._dismiss_cookie_banner_robust(page)

                product_cards = self._wait_for_product_cards(page)
                if not product_cards:
                    self._log("No product cards found after waiting")
                    self._screenshot_debug(page, "no_products")
                    return []

                self._log(f"Found {len(product_cards)} product cards")

                for card in product_cards:
                    product = self._extract_product(card)
                    if product:
                        results.append(product)

                self._log(f"Extracted {len(results)} products before filtering")

                page.close()
                context.close()
                browser.close()

        except PlaywrightTimeout as e:
            self._log(f"Playwright timeout at {self.SEARCH_URL}: {e}")
            return []
        except Exception as e:
            self._log(f"Error during scraping at {self.SEARCH_URL}: {e}")
            return []
        finally:
            if page and not page.is_closed():
                try:
                    page.close()
                except Exception:
                    pass
            if context:
                try:
                    context.close()
                except Exception:
                    pass
            if browser:
                try:
                    browser.close()
                except Exception:
                    pass

        monster_results = [
            r for r in results
            if "monster" in r.get("product_name", "").lower()
        ]

        filtered = self._filter_by_pack_size(monster_results, pack_size)
        self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
        return filtered

    def _dismiss_cookie_banner_robust(self, page):
        patterns = [
            ('button:has-text("Accept All Cookies")', 'Accept All Cookies'),
            ('button:has-text("Accept All")', 'Accept All'),
            ('button:has-text("Allow All")', 'Allow All'),
            ('button:has-text("I agree")', 'I agree'),
            ('button:has-text("Agree")', 'Agree'),
            ('button:has-text("Yes, I accept")', 'Yes, I accept'),
            ('button:has-text("Continue")', 'Continue'),
            ('button:has-text("Accept")', 'Accept'),
            ('#onetrust-accept-btn-handler', 'OneTrust Accept'),
            ('#CybotCookiebotDialogBodyButtonAccept', 'Cybot Accept'),
            ('[data-testid="cookie-banner-accept"]', 'Data-testid cookie accept'),
            ('[data-testid="accept-cookies"]', 'Data-testid accept cookies'),
            ('.cookie-banner__accept', 'Cookie banner accept CSS'),
            ('.cookie-accept', 'Cookie accept CSS'),
            ('button[aria-label*="Accept"]', 'Aria-label Accept'),
            ('button[aria-label*="cookie"]', 'Aria-label cookie'),
        ]
        for selector, name in patterns:
            try:
                button = page.locator(selector).first
                if button.is_visible(timeout=self.BANNER_TIMEOUT // 10):
                    self._log(f"  Dismissing cookie banner: '{name}'")
                    button.click()
                    page.wait_for_timeout(500)
                    return True
            except Exception:
                continue
        self._log("  No cookie banner found (may have been auto-dismissed or not present)")
        return False

    def _wait_for_product_cards(self, page):
        for selector in self.PRODUCT_CARD_SELECTORS:
            try:
                page.wait_for_selector(selector, timeout=self.SELECTOR_TIMEOUT)
                cards = page.locator(selector).all()
                if cards:
                    self._log(f"  Found product cards with selector: {selector}")
                    return cards
            except PlaywrightTimeout:
                continue
            except Exception:
                continue
        return []

    def _extract_product(self, card) -> Dict | None:
        name = self._safe_extract(card, self.NAME_SELECTORS, field_name="product_name")
        if not name:
            return None

        price_str = self._safe_extract(card, self.PRICE_SELECTORS, field_name="price")
        if not price_str:
            return None

        price = self._parse_price(price_str)
        if price is None:
            return None

        return {
            "product_name": name.strip(),
            "price": price,
            "currency": "EUR",
            "retailer": "aldi",
        }

    def _safe_extract(self, parent, selectors, field_name="text"):
        for selector in selectors:
            try:
                element = parent.locator(selector).first
                if element.count() > 0:
                    text = element.text_content()
                    if text and text.strip():
                        return text.strip()
            except Exception as e:
                self._log(f"  Failed to extract {field_name} with selector {selector}: {e}")
        return None

    def _extract_text(self, parent, selectors: List[str]) -> str:
        self._log("  _extract_text is deprecated; use _safe_extract instead")
        result = self._safe_extract(parent, selectors, field_name="text")
        return result if result is not None else ""

    def _parse_price(self, price_str: str) -> float | None:
        cleaned = price_str.replace("€", "").replace("EUR", "").replace(",", "")
        cleaned = cleaned.strip()

        match = re.search(r"(\d+\.\d{1,2})", cleaned)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None

        match = re.search(r"(\d+)", cleaned)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None

        return None
