"""
Aldi IE scraper for Monster Energy drink prices.

Firecrawl is the primary scraping method. Playwright browser automation
is kept as a fallback for when Firecrawl is unavailable.

The previous API approach (groceries.aldi.ie/api/product/calculatePrices) is
blocked by Akamai (403 Forbidden). Firecrawl bypasses this via its anti-bot
handling. Regex parsing is used instead of structured extraction to minimise
Firecrawl credit usage (1 credit/page vs 5 credits/page).
"""

import time
import re
from typing import List, Dict
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from base import BaseScraper

ALDI_SEARCH_URL = "https://groceries.aldi.ie/en-IE/Search?SearchTerm=monster+energy"


class AldiIEScraper(BaseScraper):
    SEARCH_URL = ALDI_SEARCH_URL

    NAVIGATION_TIMEOUT = 30000
    SELECTOR_TIMEOUT = 10000
    BANNER_TIMEOUT = 2000

    PRODUCT_CARD_SELECTORS = [
        '[data-testid="product-tile"]',
        '[data-testid="product-item"]',
        '.product-tile',
        '.product-item',
        '.product-card',
        '.product-grid-item',
        '[class*="ProductTile"]',
        '[class*="productTile"]',
        '[class*="ProductCard"]',
        '[class*="product-card"]',
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

    def __init__(self):
        super().__init__("aldi", delay=2.0)

    def _log(self, message: str):
        print(f"[aldi] {message}")

    def _wait(self):
        time.sleep(self.delay)

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        # Primary: Firecrawl with regex parsing (1 credit/page).
        results = self._firecrawl_scrape(pack_size)
        if results:
            return results

        self._log("Firecrawl returned no results — trying Playwright fallback")
        return self._playwright_scrape(query, pack_size)

    def _firecrawl_scrape(self, pack_size: str) -> List[Dict]:
        """Scrape via Firecrawl with regex parsing (cheaper than structured extraction)."""
        try:
            from firecrawl_ie import FirecrawlScraper

            scraper = FirecrawlScraper(
                retailer="aldi",
                search_url=ALDI_SEARCH_URL,
                use_structured_extraction=False,
            )
            results = scraper.scrape(pack_size=pack_size)
            if results:
                self._log(f"Firecrawl found {len(results)} products")
                return results
        except Exception as e:
            self._log(f"Firecrawl scrape failed: {e}")
        return []

    def _playwright_scrape(self, query: str, pack_size: str) -> List[Dict]:
        """Fallback: Playwright browser automation for when Firecrawl is unavailable."""
        self._log("Starting Playwright scrape")
        results: List[Dict] = []
        browser = None
        context = None
        page = None
        captured_responses: List = []

        def api_response_handler(response):
            url = response.url.lower()
            if any(kw in url for kw in ["search", "product", "api"]):
                try:
                    if "application/json" in (response.headers.get("content-type") or ""):
                        captured_responses.append(response.json())
                except Exception:
                    pass

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
                page.on("response", api_response_handler)

                self._log(f"Navigating to {self.SEARCH_URL}")
                page.goto(self.SEARCH_URL, wait_until="domcontentloaded", timeout=self.NAVIGATION_TIMEOUT)
                self._dismiss_cookie_banner_robust(page)

                product_cards = self._wait_for_product_cards(page)
                if not product_cards:
                    self._log("No product cards found — trying network interception")
                    api_results = self._intercept_api_response(page, captured_responses)
                    if api_results:
                        results = api_results
                else:
                    for card in product_cards:
                        product = self._extract_product(card)
                        if product:
                            results.append(product)

                page.close()
                context.close()
                browser.close()

        except PlaywrightTimeout as e:
            self._log(f"Playwright timeout: {e}")
            return []
        except Exception as e:
            self._log(f"Playwright error: {e}")
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

        monster_results = [r for r in results if "monster" in r.get("product_name", "").lower()]
        filtered = self._filter_by_pack_size(monster_results, pack_size)
        self._log(f"Playwright found {len(filtered)} products (pack_size={pack_size})")
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
        return False

    def _wait_for_product_cards(self, page):
        for selector in self.PRODUCT_CARD_SELECTORS:
            try:
                page.wait_for_selector(selector, timeout=self.SELECTOR_TIMEOUT)
                cards = page.locator(selector).all()
                if cards:
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
        return {"product_name": name.strip(), "price": price, "currency": "EUR", "retailer": "aldi"}

    def _safe_extract(self, parent, selectors, field_name="text"):
        for selector in selectors:
            try:
                element = parent.locator(selector).first
                if element.count() > 0:
                    text = element.text_content()
                    if text and text.strip():
                        return text.strip()
            except Exception:
                continue
        return None

    def _parse_price(self, price_str: str) -> float | None:
        cleaned = price_str.replace("€", "").replace("EUR", "").replace(",", "").strip()
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

    def _intercept_api_response(self, page, captured: list) -> List[Dict]:
        results: List[Dict] = []
        for json_data in captured:
            items = None
            if isinstance(json_data, dict):
                for key in ["products", "items", "results", "data", "productList", "searchResults"]:
                    if key in json_data and isinstance(json_data[key], list):
                        items = json_data[key]
                        break
                if items is None and json_data.get("product"):
                    items = [json_data["product"]]
            elif isinstance(json_data, list):
                items = json_data
            if not items:
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                name = item.get("name") or item.get("productName") or item.get("title") or item.get("product_title")
                price_val = item.get("price") or item.get("productPrice") or item.get("currentPrice") or item.get("salePrice") or item.get("pricePerUnit")
                if name and price_val is not None:
                    try:
                        price = float(str(price_val).replace("€", "").replace(",", ""))
                        name_str = str(name)
                        if "monster" in name_str.lower():
                            results.append({"product_name": name_str, "price": price, "currency": "EUR", "retailer": "aldi"})
                    except (ValueError, TypeError):
                        continue
        return results
