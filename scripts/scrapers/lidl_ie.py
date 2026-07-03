"""
Lidl IE scraper for Monster Energy drink prices.

Uses Playwright browser automation to navigate Lidl's Irish website,
handle cookie consent, search for products, and extract names and prices
from the rendered DOM.
"""

import re
import time
from typing import List, Dict
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

from base import BaseScraper


class LidlIEScraper(BaseScraper):
    NAVIGATION_TIMEOUT = 30000
    SELECTOR_TIMEOUT = 10000
    BANNER_TIMEOUT = 2000

    def __init__(self):
        super().__init__("lidl", delay=2.0)

    def _log(self, message: str):
        print(f"[lidl] {message}")

    def _wait(self):
        time.sleep(self.delay)

    def scrape(self, query: str = "monster white", pack_size: str = "all") -> List[Dict]:
        self._log(f"Searching: {query} (pack_size={pack_size})")
        results: List[Dict] = []
        search_url = f"https://www.lidl.ie/q/{query.replace(' ', '%20')}"
        firecrawl_url = search_url

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
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/125.0.0.0 Safari/537.36"
                    ),
                    locale="en-IE",
                )
                page = context.new_page()

                page.on("response", api_response_handler)

                try:
                    page.goto(
                        search_url,
                        wait_until="networkidle",
                        timeout=self.NAVIGATION_TIMEOUT,
                    )
                    self._wait()
                    self._dismiss_cookie_banner(page)

                    if not self._products_visible(page):
                        self._log("No products visible on search page, falling back to homepage search")
                        self._screenshot_debug(page, "no_products_visible")
                        page.goto(
                            "https://www.lidl.ie/",
                            wait_until="networkidle",
                            timeout=self.NAVIGATION_TIMEOUT,
                        )
                        self._wait()
                        self._dismiss_cookie_banner(page)
                        self._perform_search(page, query)

                    results = self._extract_products(page)
                    if not results:
                        self._log("No products extracted from DOM — trying network interception fallback")
                        api_results = self._intercept_api_response(page, captured_responses)
                        if api_results:
                            self._log(f"Network interception found {len(api_results)} products")
                            results = api_results
                        else:
                            self._log("Network interception also returned 0 results")
                            self._screenshot_debug(page, "no_products_extracted")
                finally:
                    context.close()
                    browser.close()

        except PlaywrightTimeout as e:
            self._log(f"Playwright timeout at {search_url}: {e}")
            return []
        except Exception as e:
            self._log(f"Error during scraping at {search_url}: {e}")
            return []

        if not results:
            self._log("DOM and API extraction failed — trying Firecrawl fallback")
            results = self._firecrawl_fallback(query, firecrawl_url)

        filtered = self._filter_by_pack_size(results, pack_size)
        self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
        return filtered

    def _firecrawl_fallback(self, query: str, firecrawl_url: str) -> List[Dict]:
        try:
            from firecrawl_ie import with_firecrawl_fallback
            results, source = with_firecrawl_fallback(
                scraper_fn=lambda: [],
                retailer=self.retailer,
                firecrawl_search_url=firecrawl_url,
                use_structured_extraction=True,
            )
            if source == "firecrawl_fallback":
                self._log(f"Firecrawl fallback found {len(results)} products")
            elif source == "none":
                self._log("Firecrawl fallback also failed")
            return results
        except Exception as fc_err:
            self._log(f"Firecrawl fallback also failed: {fc_err}")
        return []

    def _dismiss_cookie_banner(self, page):
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
                if button.is_visible(timeout=self.BANNER_TIMEOUT):
                    self._log(f"  Dismissing cookie banner: '{name}'")
                    button.click()
                    page.wait_for_timeout(500)
                    return True
            except Exception:
                continue
        self._log("  No cookie banner found (may have been auto-dismissed or not present)")
        return False

    def _products_visible(self, page) -> bool:
        product_selectors = [
            '[data-testid="product-tile"]',
            '[data-testid="product-card"]',
            '[data-testid="product-item"]',
            '.product-tile',
            '.product-card',
            '.product-grid-item',
            '[class*="ProductTile"]',
            '[class*="productTile"]',
            '[class*="product-card"]',
            '[class*="productCard"]',
        ]
        for sel in product_selectors:
            try:
                if page.locator(sel).count() > 0:
                    self._log(f"  Products visible with selector: {sel}")
                    return True
            except Exception:
                continue
        self._log("  No product selectors matched on page")
        return False

    def _perform_search(self, page, query: str):
        search_input_selectors = [
            'input[type="search"]',
            'input[placeholder*="Search" i]',
            'input[aria-label*="Search" i]',
            '[data-testid="search-input"]',
            '#search-input',
            'input[name="search"]',
            'input[name="q"]',
        ]

        search_btn_selectors = [
            'button[type="submit"]',
            'button[aria-label*="Search" i]',
            '[data-testid="search-button"]',
            '.search-button',
            'button:has-text("Search")',
        ]

        search_icon_selectors = [
            'button[aria-label*="Search" i]',
            '[data-testid="search-icon"]',
            'a[href*="search"]',
            '.search-icon',
        ]

        input_el = None
        for sel in search_input_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    input_el = el
                    break
            except Exception:
                continue

        if not input_el:
            for sel in search_icon_selectors:
                try:
                    icon = page.locator(sel).first
                    if icon.is_visible(timeout=3000):
                        icon.click()
                        self._wait()
                        for inp_sel in search_input_selectors:
                            try:
                                el = page.locator(inp_sel).first
                                if el.is_visible(timeout=3000):
                                    input_el = el
                                    break
                            except Exception:
                                continue
                        if input_el:
                            break
                except Exception:
                    continue

        if not input_el:
            self._log("Could not find search input")
            return

        input_el.fill(query)
        self._wait()

        submitted = False
        for sel in search_btn_selectors:
            try:
                btn = page.locator(sel).first
                if btn.is_visible(timeout=3000):
                    btn.click()
                    submitted = True
                    break
            except Exception:
                continue

        if not submitted:
            input_el.press("Enter")
            submitted = True

        if submitted:
            self._wait()

    def _extract_products(self, page) -> List[Dict]:
        results: List[Dict] = []
        seen = set()

        product_container_selectors = [
            '[data-testid="product-tile"]',
            '[data-testid="product-card"]',
            '[data-testid="product-item"]',
            '.product-tile',
            '.product-card',
            '.product-grid-item',
            '[class*="ProductTile"]',
            '[class*="productTile"]',
            '[class*="product-card"]',
            '[class*="productCard"]',
        ]

        container_selector = None
        for sel in product_container_selectors:
            try:
                page.wait_for_selector(sel, timeout=self.SELECTOR_TIMEOUT)
                if page.locator(sel).count() > 0:
                    container_selector = sel
                    self._log(f"  Using product container selector: {sel}")
                    break
            except PlaywrightTimeout:
                continue

        if not container_selector:
            self._log("No product containers found on page")
            self._screenshot_debug(page, "no_product_containers")
            return results

        products = page.locator(container_selector).all()

        for product in products:
            try:
                name = self._extract_name(product)
                price = self._extract_price(product)

                if name and price is not None:
                    name_lower = name.lower()
                    if "monster" in name_lower:
                        key = f"{name}|{price}"
                        if key not in seen:
                            seen.add(key)
                            results.append({
                                "product_name": name,
                                "price": price,
                                "currency": "EUR",
                                "retailer": "lidl",
                            })
            except Exception:
                continue

        return results

    def _extract_name(self, product) -> str | None:
        name_selectors = [
            '[data-testid="product-title"]',
            '.product-title',
            '.product-name',
            '[data-testid="product-name"]',
            'h3',
            'h2',
            'a[title]',
            '[class*="title"]',
            '[class*="name"]',
            'a',
        ]
        for sel in name_selectors:
            try:
                el = product.locator(sel).first
                text = el.inner_text(timeout=2000).strip()
                if text:
                    try:
                        title = el.get_attribute("title")
                        if title and len(title) > len(text):
                            text = title
                    except Exception:
                        pass
                    self._log(f"  Extracted name with selector {sel}: {text}")
                    return text
            except Exception:
                continue
        self._log("  Failed to extract name from product")
        return None

    def _extract_price(self, product) -> float | None:
        price_selectors = [
            '[data-testid="price"]',
            '.price',
            '.price-box',
            '.current-price',
            '[class*="price"]',
            '[class*="Price"]',
        ]
        for sel in price_selectors:
            try:
                el = product.locator(sel).first
                text = el.inner_text(timeout=2000).strip()
                match = re.search(r"€?\s*(\d+(?:[.,]\d{1,2})?)", text)
                if match:
                    price_str = match.group(1).replace(",", ".")
                    price = float(price_str)
                    self._log(f"  Extracted price with selector {sel}: {price}")
                    return price
            except Exception:
                continue
        self._log("  Failed to extract price from product")
        return None

    def _intercept_api_response(self, page, captured: list) -> List[Dict]:
        """Parse captured network responses for product data when DOM extraction fails."""
        results: List[Dict] = []
        for json_data in captured:
            # Try to find product arrays in the response
            items = None
            if isinstance(json_data, dict):
                # Common API response shapes
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
                # Extract name from common field names
                name = (
                    item.get("name")
                    or item.get("productName")
                    or item.get("title")
                    or item.get("product_title")
                )
                # Extract price from common field names
                price_val = (
                    item.get("price")
                    or item.get("productPrice")
                    or item.get("currentPrice")
                    or item.get("salePrice")
                    or item.get("pricePerUnit")
                )
                if name and price_val is not None:
                    try:
                        price = float(str(price_val).replace("€", "").replace(",", ""))
                        name_str = str(name)
                        if "monster" in name_str.lower():
                            results.append({
                                "product_name": name_str,
                                "price": price,
                                "currency": "EUR",
                                "retailer": "lidl",
                            })
                    except (ValueError, TypeError):
                        continue
        return results
