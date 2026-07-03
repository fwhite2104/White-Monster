"""Centra Ireland scraper for Monster Energy drink prices.

Centra.ie has no public product catalog or search function. The only
page where products appear with prices is the Special Offers page at
/offers. Prices are server-rendered HTML. Monster Energy products
appear only when on promotion, so the scraper may return empty results
between promotional periods.

The offers page supports category filtering via ?category_id= but
energy drinks share categories with other beverages. We scrape all
offers and filter for Monster in the product name.

Non-promotional coverage: when the /offers page returns no Monster
products, the scraper falls back to sitemap discovery (direct product
page scraping) and then Firecrawl crawl as a last resort.
"""

import re
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from typing import List, Dict
from base import BaseScraper


class CentraIEScraper(BaseScraper):
    OFFERS_URL = "https://centra.ie/offers"
    BASE_URL = "https://centra.ie"

    def __init__(self):
        super().__init__("centra", delay=2.0)
        self.session.headers.update({
            "Accept": (
                "text/html,application/xhtml+xml,"
                "application/xml;q=0.9,image/avif,image/webp,"
                "image/apng,*/*;q=0.8"
            ),
            "Referer": "https://centra.ie/",
        })

    def scrape(self, query: str = "monster", pack_size: str = "all") -> List[Dict]:
        self._log(f"Scraping offers page (pack_size={pack_size})")

        promo_results: List[Dict] = []
        try:
            response = self._retry_request(
                lambda: self.session.get(self.OFFERS_URL, timeout=self.timeout)
            )

            if not response.ok:
                self._log(f"HTTP {response.status_code}")
            else:
                promo_results = self._parse_offers(response.text)

        except Exception as e:
            self._log(f"Error: {e}")

        catalog_results = self._discover_and_scrape_catalog()
        if catalog_results:
            self._log(f"Catalog discovery found {len(catalog_results)} Monster products")

        seen = {(r["product_name"], r["price"]) for r in promo_results}
        merged = list(promo_results)
        for r in catalog_results:
            if (r["product_name"], r["price"]) not in seen:
                seen.add((r["product_name"], r["price"]))
                merged.append(r)

        filtered = self._filter_by_pack_size(merged, pack_size)
        self._log(f"Found {len(filtered)} Monster products (pack_size={pack_size})")
        return filtered

    def _discover_and_scrape_catalog(self) -> List[Dict]:
        """Fallback chain: sitemap discovery → Firecrawl crawl.

        Returns:
            List of product dicts from catalog pages, tagged with source 'scraper-catalog'.
        """
        product_urls = self._discover_product_urls()
        if not product_urls:
            self._log("[CENTRA] Sitemap discovery failed — using Firecrawl crawl")
            return self._firecrawl_crawl_fallback()

        results = []
        for url in product_urls[:20]:
            try:
                product = self._scrape_product_page(url)
                if product:
                    results.append(product)
            except Exception as e:
                self._log(f"Error scraping product page {url}: {e}")
        return results

    def _discover_product_urls(self) -> List[str]:
        """Discover product page URLs from robots.txt sitemap.

        Returns:
            List of product page URLs matching /p/ slug pattern.
        """
        try:
            robots_response = self._retry_request(
                lambda: self.session.get(
                    f"{self.BASE_URL}/robots.txt",
                    timeout=self.timeout,
                )
            )
            if not robots_response.ok:
                return []

            sitemap_urls = re.findall(r"Sitemap:\s*(.+)", robots_response.text, re.IGNORECASE)
            if not sitemap_urls:
                return []

            sitemap_url = urljoin(f"{self.BASE_URL}/", sitemap_urls[0].strip())
            self._log(f"Fetching sitemap: {sitemap_url}")

            sitemap_response = self._retry_request(
                lambda: self.session.get(sitemap_url, timeout=self.timeout)
            )
            if not sitemap_response.ok:
                return []

            all_urls = re.findall(r"<loc>(.+?)</loc>", sitemap_response.text)
            product_urls = [
                url for url in all_urls
                if "/p/" in url.lower() or "/product/" in url.lower()
            ]
            self._log(f"Sitemap discovery: found {len(product_urls)} product URLs")
            return product_urls

        except Exception as e:
            self._log(f"Sitemap discovery failed: {e}")
            return []

    def _scrape_product_page(self, url: str) -> Dict | None:
        """Scrape a single product page for name and base price.

        Returns:
            Product dict tagged with source key 'scraper-catalog'.
        """
        try:
            response = self._retry_request(
                lambda: self.session.get(url, timeout=self.timeout)
            )
            if not response.ok:
                return None

            soup = BeautifulSoup(response.text, "html.parser")
            name_tag = soup.find("h1") or soup.find("title")
            name = name_tag.get_text(strip=True) if name_tag else ""
            if "monster" not in name.lower():
                return None

            price = None
            for selector in [".price", "[class*='price']", ".value", ".cost"]:
                price_el = soup.select_one(selector)
                if price_el:
                    match = re.search(r"€?\s*(\d+\.?\d{0,2})", price_el.get_text(strip=True))
                    if match:
                        try:
                            price = float(match.group(1))
                            if 0 < price <= 50:
                                break
                        except ValueError:
                            continue

            if price is None:
                body_text = soup.get_text(" ", strip=True)
                match = re.search(r"€\s*(\d+\.?\d{0,2})", body_text)
                if match:
                    try:
                        price = float(match.group(1))
                    except ValueError:
                        return None

            if price is None or price <= 0:
                return None

            return {
                "product_name": name,
                "price": price,
                "currency": "EUR",
                "retailer": "centra",
                "source": "scraper-catalog",
            }

        except Exception as e:
            self._log(f"Product page error for {url}: {e}")
            return None

    def _firecrawl_crawl_fallback(self) -> List[Dict]:
        """Use Firecrawl scrape as a last-resort fallback for catalog coverage.

        Returns product dicts tagged with 'scraper-catalog'.
        """
        try:
            from firecrawl_ie import with_firecrawl_fallback
            results, source = with_firecrawl_fallback(
                scraper_fn=lambda: [],
                retailer="centra",
                firecrawl_search_url=f"{self.BASE_URL}/offers?q=monster",
                use_structured_extraction=True,
            )
            for r in results:
                r["source"] = "scraper-catalog"
            return results
        except Exception as e:
            self._log(f"Firecrawl crawl fallback failed: {e}")
            return []

    def _parse_offers(self, html: str) -> List[Dict]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        seen = set()

        for card in soup.select("[class*='offer'], [class*='product'], article, .card"):
            text = card.get_text(" ", strip=True)

            if "monster" not in text.lower():
                continue

            name = self._extract_name(card)
            if not name or "monster" not in name.lower():
                continue

            if name in seen:
                continue
            seen.add(name)

            price = self._extract_price(card, text)
            if price is None:
                continue

            results.append({
                "product_name": name,
                "price": price,
                "currency": "EUR",
                "retailer": "centra",
                "source": "scraper-promo",
            })

        if results:
            return results

        for card in soup.select("a[href*='/offers/']"):
            text = card.get_text(" ", strip=True)

            if "monster" not in text.lower():
                continue

            name = self._extract_name(card)
            if not name or "monster" not in name.lower():
                continue

            if name in seen:
                continue
            seen.add(name)

            price = self._extract_price(card, text)
            if price is None:
                continue

            results.append({
                "product_name": name,
                "price": price,
                "currency": "EUR",
                "retailer": "centra",
                "source": "scraper-promo",
            })

        return results

    def _extract_name(self, element) -> str:
        for selector in ["h2", "h3", "h4", ".title", ".name", ".product-name", "a"]:
            tag = element.select_one(selector)
            if tag:
                name = tag.get_text(strip=True)
                if name and len(name) > 3:
                    return name

        for tag in element.find_all(["h2", "h3", "h4"]):
            text = tag.get_text(strip=True)
            if text and len(text) > 3:
                return text

        return ""

    def _extract_price(self, element, full_text: str) -> float | None:
        for selector in [".price", "[class*='price']", ".value", ".cost"]:
            price_el = element.select_one(selector)
            if price_el:
                match = re.search(r"€?\s*(\d+\.?\d{0,2})", price_el.get_text(strip=True))
                if match:
                    try:
                        price = float(match.group(1))
                        if 0 < price <= 50:
                            return price
                    except ValueError:
                        continue

        match = re.search(r"€\s*(\d+\.?\d{0,2})", full_text)
        if match:
            try:
                price = float(match.group(1))
                if 0 < price <= 50:
                    return price
            except ValueError:
                pass

        return None