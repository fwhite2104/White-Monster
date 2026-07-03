# scripts/scrapers/firecrawl_ie.py
"""
Firecrawl-based scraper for Irish grocery retailers.

Uses Firecrawl as the scraping backend instead of bespoke curl_cffi/Playwright/
BeautifulSoup logic. Firecrawl handles anti-bot bypass (Akamai, Cloudflare),
JavaScript rendering, and page content extraction automatically.

Supports two extraction strategies:
    1. Regex parsing of Markdown content (fast, zero extra cost)
    2. LLM-based structured extraction via Firecrawl JSON format (more reliable,
       costs +4 credits per page)

Strategy selection is per-retailer. Structured extraction is used when the
page layout is complex or the markdown tends to be noisy.

Usage:
    from firecrawl_ie import FirecrawlScraper

    scraper = FirecrawlScraper(
        retailer="tesco",
        search_url="https://www.tesco.ie/groceries/en-ie/search?query=monster+energy",
        extract_schema=PRODUCT_SCHEMA,  # optional
    )
    products = scraper.scrape()
"""

from __future__ import annotations

import logging
import os
import re
from dataclasses import dataclass, field
from typing import Any

from base import BaseScraper
from providers.base import (
    AuthError,
    CrawlConfig,
    CrawlResult,
    ProviderError,
    ScrapeConfig,
    ScrapedDocument,
    ScrapingProvider,
)
from providers.firecrawl_provider import FirecrawlProvider

logger = logging.getLogger("firecrawl_ie")

# ---------------------------------------------------------------------------
# Default JSON schema for structured product extraction.
# ---------------------------------------------------------------------------

PRODUCT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "products": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Full product name"},
                    "price": {"type": "number", "description": "Price in EUR"},
                    "currency": {"type": "string", "description": "Currency code, e.g. EUR"},
                    "pack_size": {
                        "type": "string",
                        "enum": ["single", "4_pack", "unknown"],
                        "description": "Whether this is a single can or multi-pack",
                    },
                },
                "required": ["name", "price"],
            },
        }
    },
    "required": ["products"],
}

# ---------------------------------------------------------------------------
# Per-retailer scrape configurations.
# ---------------------------------------------------------------------------


@dataclass
class RetailerConfig:
    """Configuration for scraping a specific retailer via Firecrawl."""

    retailer: str
    """Lowercase retailer key matching lib/constants.ts RETAILERS."""

    search_url: str
    """URL template for searching Monster products. Use {query} as placeholder."""

    use_structured_extraction: bool = True
    """When True, use Firecrawl JSON format (LLM-based) for extraction.
       Costs +4 credits per page but is more reliable on complex layouts."""

    crawl_for_discovery: bool = False
    """When True, use Firecrawl crawl to discover product pages instead of
       scraping a single search URL. Useful for retailers without search."""

    crawl_config: CrawlConfig | None = None
    """Crawl configuration used when crawl_for_discovery is True."""

    extract_schema: dict[str, Any] | None = None
    """Optional override for the extraction schema. Defaults to PRODUCT_SCHEMA."""


# Pre-configured retailers for Firecrawl scraping.
# Add entries here as Firecrawl proves effective for each site.
FIRECRAWL_RETAILERS: dict[str, RetailerConfig] = {
    "spar": RetailerConfig(
        retailer="spar",
        search_url="https://www.spar.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "londis": RetailerConfig(
        retailer="londis",
        search_url="https://www.londis.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "dealz": RetailerConfig(
        retailer="dealz",
        search_url="https://www.dealz.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "costcutter": RetailerConfig(
        retailer="costcutter",
        search_url="https://www.costcutter.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
}

# Retailers that use Firecrawl as a fallback (tried after bespoke scraper fails).
# Maps retailer name to its Firecrawl config for the fallback pipeline.
FALLBACK_RETAILERS: dict[str, RetailerConfig] = {
    "lidl": RetailerConfig(
        retailer="lidl",
        search_url="https://www.lidl.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "aldi": RetailerConfig(
        retailer="aldi",
        search_url="https://www.aldi.ie/search?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "centra": RetailerConfig(
        retailer="centra",
        search_url="https://www.centra.ie/offers?q=monster+energy",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
    "dunnes": RetailerConfig(
        retailer="dunnes",
        search_url="https://www.dunnesstoresgrocery.com/sm/delivery/rsid/258/results?q=monster",
        use_structured_extraction=True,
        extract_schema=PRODUCT_SCHEMA,
    ),
}


# ---------------------------------------------------------------------------
# Firecrawl scraper
# ---------------------------------------------------------------------------


class FirecrawlScraper(BaseScraper):
    """Scraper that uses a FirecrawlProvider backend to scrape retailer sites.

    Extends BaseScraper so it integrates seamlessly with run_scrapers.py's
    existing orchestration (get_or_create_store, push_prices).

    Supports two modes:
      - Single-page scrape: Fetches a search results page and extracts products.
      - Crawl-based discovery: Crawls the retailer site to find product pages,
        then parses each for product info.

    Strategy (structured extraction) is more robust but costs +4 credits/page.
    Strategy (regex parsing) is cheaper but fragile on complex layouts.
    """

    def __init__(
        self,
        retailer: str,
        search_url: str,
        provider: ScrapingProvider | None = None,
        use_structured_extraction: bool = True,
        extract_schema: dict[str, Any] | None = None,
        delay: float = 2.0,
        timeout: int = 60,
    ):
        super().__init__(retailer, delay=delay, timeout=timeout)
        self._search_url = search_url
        self._provider = provider or _default_provider()
        self._use_structured_extraction = use_structured_extraction
        self._extract_schema = extract_schema or PRODUCT_SCHEMA
        self.last_source: str = "unknown"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape(self, query: str = "monster", pack_size: str = "all") -> list[dict[str, Any]]:
        """Scrape the retailer site for Monster products.

        Fetches the configured search URL via Firecrawl, then parses the
        result for product names and prices.

        Args:
            query: Search query (used to build the search URL if {query} placeholder exists).
            pack_size: Filter results — 'single', '4_pack', or 'all'.

        Returns:
            List of product dicts with keys:
                product_name, price, currency, retailer
            Compatible with run_scrapers.py push_prices().
        """
        url = self._search_url.replace("{query}", query.replace(" ", "+"))
        self._log(f"Fetching {url} via Firecrawl ...")

        config = ScrapeConfig(
            url=url,
            only_main_content=True,
            block_ads=True,
            location={"country": "IE", "languages": ["en-IE"]},
        )

        if self._use_structured_extraction:
            config.formats = ["markdown", {"type": "json", "schema": self._extract_schema}]
            config.extract_schema = self._extract_schema

        try:
            doc = self._provider.scrape(config)
        except (ProviderError, AuthError) as e:
            self._log(f"Firecrawl scrape failed: {e}")
            return []

        self._wait()

        # Try structured extraction first (if enabled and available).
        products: list[dict[str, Any]] = []
        if self._use_structured_extraction:
            try:
                products = self._parse_structured(doc)
                if products:
                    self._log(f"Structured extraction found {len(products)} products")
                    self.last_source = "firecrawl_structured"
            except Exception as e:
                self._log(f"Structured extraction error: {e} — falling back to regex")

        # Fall back to regex-based parsing on markdown content.
        if not products and doc.content:
            products = self._parse_markdown(doc.content)
            if products:
                self._log(f"Regex parsing found {len(products)} products")
                self.last_source = "firecrawl_regex"

        if not products:
            self._log("No Monster products found on page")
            return []

        # Normalize output to match BaseScraper contract.
        normalized = self._normalize(products)

        # Filter by pack size.
        return self._filter_by_pack_size(normalized, pack_size)

    # ------------------------------------------------------------------
    # Parse strategies
    # ------------------------------------------------------------------

    @staticmethod
    def _parse_structured(doc: ScrapedDocument) -> list[dict[str, Any]]:
        """Extract products from Firecrawl's structured JSON output.

        The JSON is embedded in doc.metadata (the SDK auto-converts the
        API response). Items are lists under the "products" key as defined
        by PRODUCT_SCHEMA.
        """
        raw_json = doc.metadata.get("json") or {}
        products_raw = raw_json.get("products") if isinstance(raw_json, dict) else None
        if not products_raw or not isinstance(products_raw, list):
            return []
        return products_raw

    @staticmethod
    def _parse_markdown(content: str) -> list[dict[str, Any]]:
        """Extract products from Markdown/HTML content using regex.

        Looks for lines containing "monster" (case-insensitive) and
        extracts nearby price patterns (EUR amounts).

        This is a fallback when structured extraction is unavailable or
        returns empty results.
        """
        products: list[dict[str, Any]] = []
        seen_names: set[str] = set()
        lines = content.split("\n")

        for i, line in enumerate(lines):
            if "monster" not in line.lower():
                continue

            # Skip non-product lines (navigation, footer, etc.).
            if _is_noise_line(line):
                continue

            name = _extract_product_name(line)
            if not name or name.lower() in seen_names:
                continue

            price = _extract_price(line)
            if price is None:
                # Check surrounding lines for price.
                for offset in [1, -1, 2, -2]:
                    idx = i + offset
                    if 0 <= idx < len(lines):
                        price = _extract_price(lines[idx])
                        if price is not None:
                            break

            if price is None:
                continue

            seen_names.add(name.lower())
            products.append({
                "name": name,
                "price": round(price, 2),
                "currency": "EUR",
            })

        return products

    # ------------------------------------------------------------------
    # Normalization
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Convert internal product dicts to the BaseScraper contract format.

        Expected input keys: name, price, currency, (optional) pack_size
        Output keys: product_name, price, currency, retailer (set by caller)
        """
        normalized: list[dict[str, Any]] = []
        for p in products:
            name = p.get("name", "").strip()
            price = p.get("price")
            if not name or not isinstance(price, (int, float)) or price <= 0:
                continue
            normalized.append({
                "product_name": name,
                "price": round(float(price), 2),
                "currency": p.get("currency", "EUR"),
            })
        return normalized


# ---------------------------------------------------------------------------
# Helper functions for regex parsing
# ---------------------------------------------------------------------------


# Patterns that indicate a non-product line.
_NOISE_PATTERNS = [
    r"^(about|contact|faq|help|terms|privacy|shipping|returns)",
    r"(navigation|footer|header|sidebar|menu|breadcrumb)",
    r"(cookie|consent|privacy\s*policy)",
    r"(sign\s*in|register|cart|basket|checkout|my\s*account)",
    r"(search|browse|category|filter|sort\s*by)",
]


def _is_noise_line(line: str) -> bool:
    stripped = line.strip().lower()
    for pat in _NOISE_PATTERNS:
        if re.search(pat, stripped):
            return True
    return False


# EUR price patterns.
_PRICE_PATTERNS = [
    re.compile(r"[€£]?\s*(\d+[.,]\d{2})\b"),
    re.compile(r"(\d+[.,]\d{2})\s*[€£]"),
    re.compile(r"price[:\s]*[€£]?\s*(\d+[.,]\d{2})", re.IGNORECASE),
    re.compile(r"now[:\s]*[€£]?\s*(\d+[.,]\d{2})", re.IGNORECASE),
    re.compile(r"[€£](\d+[.,]\d{2})\s*each", re.IGNORECASE),
]


def _extract_price(text: str) -> float | None:
    """Extract the first EUR price from a line of text."""
    for pat in _PRICE_PATTERNS:
        match = pat.search(text)
        if match:
            raw = match.group(1).replace(",", ".")
            try:
                val = float(raw)
                if 0 < val < 100:
                    return val
            except ValueError:
                continue
    return None


def _extract_product_name(line: str) -> str | None:
    """Extract a plausible product name from a line containing 'monster'.

    Strips price, URLs, and navigation noise from the line.
    """
    # Remove common non-name prefixes.
    cleaned = re.sub(
        r"^[\s*#\-•·|>\d.\]]+\s*",
        "",
        line,
    )
    # Remove trailing prices and metadata.
    cleaned = re.sub(
        r"\s*[|]\s*\d+\s*(ml|g|kg|pack|can|unit).*$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"\s*€?\s*\d+[.,]\d{2}\s*(€|each|ea)?\s*$",
        "",
        cleaned,
    )
    cleaned = cleaned.strip()

    if not cleaned or len(cleaned) < 5 or len(cleaned) > 200:
        return None

    # Must still contain "monster" after cleaning.
    if "monster" not in cleaned.lower():
        return None

    return cleaned


# ---------------------------------------------------------------------------
# Default provider factory
# ---------------------------------------------------------------------------

_default_provider_instance: ScrapingProvider | None = None


def _default_provider() -> ScrapingProvider:
    """Return a shared FirecrawlProvider instance (lazy-init).

    If FIRECRAWL_API_KEY is not set or empty, returns a placeholder provider
    that always returns empty results. This lets run_scrapers.py include the
    Firecrawl scraper without crashing when the key is absent.
    """
    global _default_provider_instance
    if _default_provider_instance is not None:
        return _default_provider_instance

    api_key = os.environ.get("FIRECRAWL_API_KEY")

    if api_key is None:
        logger.warning(
            "FIRECRAWL_API_KEY not set — Firecrawl will be unavailable. "
            "Set FIRECRAWL_API_KEY in your environment to enable Firecrawl scraping."
        )
        _default_provider_instance = _EmptyProvider()
        return _default_provider_instance

    if api_key == "":
        logger.warning(
            "[WARN] FIRECRAWL_API_KEY is set but empty — Firecrawl will be unavailable."
        )
        _default_provider_instance = _EmptyProvider()
        return _default_provider_instance

    api_key_stripped = api_key.strip()
    if api_key_stripped != api_key or len(api_key_stripped) < 10:
        logger.warning(
            f"[WARN] FIRECRAWL_API_KEY appears malformed (len={len(api_key)}) — proceeding but may fail."
        )

    _default_provider_instance = FirecrawlProvider(api_key=api_key_stripped)
    return _default_provider_instance


class _EmptyProvider(ScrapingProvider):
    """Placeholder provider that returns empty results.

    Used when FIRECRAWL_API_KEY is not configured. This prevents the
    scraper from crashing when the key is absent — it simply returns no
    results, which is handled gracefully by run_scrapers.py.
    """

    def name(self) -> str:
        return "empty (no API key)"

    def scrape(self, config: ScrapeConfig) -> ScrapedDocument:
        return ScrapedDocument(url=config.url, title="", content="", metadata={})

    def crawl(self, config: CrawlConfig) -> CrawlResult:
        return CrawlResult(documents=[], total_pages=0, credits_used=0)


# ---------------------------------------------------------------------------
# Firecrawl fallback wrapper
# ---------------------------------------------------------------------------


def with_firecrawl_fallback(
    scraper_fn,
    retailer: str,
    firecrawl_search_url: str,
    use_structured_extraction: bool = True,
) -> tuple[list[dict[str, Any]], str]:
    """Wrapper that tries the bespoke scraper first, then falls back to Firecrawl.

    Args:
        scraper_fn: Callable that returns a list of product dicts (bespoke scraper).
        retailer: Retailer key for FirecrawlScraper.
        firecrawl_search_url: URL to use for Firecrawl fallback.
        use_structured_extraction: Whether to use LLM-structured extraction.

    Returns:
        Tuple of (results list, source string) where source is:
        - "bespoke" if the original scraper returned results
        - "firecrawl_fallback" if Firecrawl fallback was used
        - "none" if both failed
    """
    results = scraper_fn()
    if results:
        return (results, "bespoke")

    logger.info(f"[{retailer}] Bespoke scraper returned no results — trying Firecrawl fallback")

    try:
        scraper = FirecrawlScraper(
            retailer=retailer,
            search_url=firecrawl_search_url,
            use_structured_extraction=use_structured_extraction,
        )
        results = scraper.scrape()
        if results:
            logger.info(f"[{retailer}] Firecrawl fallback found {len(results)} products")
            return (results, "firecrawl_fallback")
    except Exception as e:
        logger.warning(f"[{retailer}] Firecrawl fallback failed: {e}")

    logger.warning(f"[{retailer}] Both bespoke and Firecrawl fallback returned no results")
    return ([], "none")
