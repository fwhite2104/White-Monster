# scripts/scrapers/providers/base.py
"""
Provider abstraction layer for Monster Cork scraping backends.

Defines a common interface that all scraping backends (Firecrawl, custom,
Playwright, etc.) must implement. This decouples the scraper orchestration
from the specific scraping technology used.

Usage:
    from providers.base import ScrapingProvider, ScrapeConfig, CrawlConfig, ScrapedDocument

    class MyProvider(ScrapingProvider):
        def scrape(self, config: ScrapeConfig) -> ScrapedDocument: ...
        def crawl(self, config: CrawlConfig) -> list[ScrapedDocument]: ...
        def name(self) -> str: ...
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Configuration data classes
# ---------------------------------------------------------------------------


@dataclass
class ScrapeConfig:
    """Configuration for a single-page scrape operation.

    Attributes:
        url: The target URL to scrape.
        wait_for_ms: Milliseconds to wait for JavaScript rendering before extraction.
        include_tags: List of HTML tags to include in extraction (e.g., ["main", "article"]).
        exclude_tags: List of HTML tags to exclude from extraction (e.g., ["nav", "footer"]).
        only_main_content: When True, attempt to exclude navigation, sidebars, and footers.
        formats: Output formats requested. Default is ["markdown"]. Can include
                 "html", "rawHtml", "links", or dict-based entries like
                 {"type": "json", "schema": ...} for structured extraction.
        headers: Custom HTTP headers to send with the request.
        mobile: When True, emulate a mobile device.
        location: Geolocation hint, e.g. {"country": "IE", "languages": ["en-IE"]}.
        block_ads: When True, block ads and cookie popups.
        proxy: Proxy strategy — "auto", "basic", or "enhanced".
        max_age_ms: If a cached result fresher than this (in ms) exists, return it.
        extract_schema: Optional Pydantic-like JSON schema for LLM-based extraction.
                        When provided, the scraper will attempt to extract structured
                        data matching the schema from the page.
        actions: List of browser actions (click, wait, scroll, etc.) for JS-heavy pages.
                 These should be used sparingly — prefer static extraction first.
    """

    url: str
    wait_for_ms: int = 0
    include_tags: list[str] | None = None
    exclude_tags: list[str] | None = None
    only_main_content: bool = True
    formats: list[str | dict] = field(default_factory=lambda: ["markdown"])
    headers: dict[str, str] | None = None
    mobile: bool = False
    location: dict[str, Any] | None = None
    block_ads: bool = True
    proxy: str = "auto"
    max_age_ms: int | None = None
    extract_schema: dict[str, Any] | None = None
    actions: list[dict[str, Any]] | None = None


@dataclass
class CrawlConfig:
    """Configuration for a recursive site crawl operation.

    Attributes:
        url: The seed URL to start crawling from.
        max_pages: Maximum number of pages to crawl (default 100).
        max_depth: Maximum link-following depth (BFS).
        include_paths: Regex patterns for paths to include. Only matching
                       URLs will be crawled. Example: ["/products/.*", "/pricing"].
        exclude_paths: Regex patterns for paths to exclude.
        allow_external_links: When True, follow links to other domains.
        allow_subdomains: When True, crawl subdomains of the seed domain.
        ignore_sitemap: When True, skip the sitemap.xml discovery.
        scrape_options: Per-page scrape options applied during crawl.
        delay_s: Delay in seconds between page scrapes (politeness).
        webhook_url: URL to receive webhook notifications for crawl events.
        prompt: Natural language description of what to crawl (auto-configures
                include/exclude paths).
    """

    url: str
    max_pages: int = 100
    max_depth: int = 3
    include_paths: list[str] | None = None
    exclude_paths: list[str] | None = None
    allow_external_links: bool = False
    allow_subdomains: bool = False
    ignore_sitemap: bool = False
    scrape_options: dict[str, Any] | None = None
    delay_s: float = 1.0
    webhook_url: str | None = None
    prompt: str | None = None


# ---------------------------------------------------------------------------
# Normalized output types
# ---------------------------------------------------------------------------


@dataclass
class ScrapedDocument:
    """Normalized document returned by any scraping provider.

    All providers must return this type regardless of backend. Downstream
    code (parsers, transformers) should only depend on these fields.
    """

    url: str
    """The final URL of the scraped page (after redirects)."""

    title: str
    """Page title, or empty string if unavailable."""

    content: str
    """Main page content. Typically Markdown, but may be HTML if requested."""

    metadata: dict[str, Any]
    """Provider-specific metadata. Always includes:
       - source_url: original requested URL
       - status_code: HTTP status
       - content_type: 'markdown' | 'html' | 'rawHtml'
    """


@dataclass
class CrawlResult:
    """Result of a crawl operation containing multiple scraped documents."""

    documents: list[ScrapedDocument]
    """All pages crawled and their content."""

    total_pages: int
    """Total pages crawled (may differ from len(documents) if some failed)."""

    credits_used: int | None = None
    """API credits consumed (if tracked by the provider)."""


# ---------------------------------------------------------------------------
# Provider ABC
# ---------------------------------------------------------------------------


class ScrapingProvider(ABC):
    """Abstract interface for scraping backends.

    Every scraping backend (Firecrawl, custom scraper, Playwright, etc.)
    implements this interface. The rest of the system communicates with
    scrapers exclusively through this abstraction.
    """

    @abstractmethod
    def scrape(self, config: ScrapeConfig) -> ScrapedDocument:
        """Scrape a single URL and return a normalized document.

        Args:
            config: Full scrape configuration including URL, options, and parsing hints.

        Returns:
            A ScrapedDocument with the page content and metadata.

        Raises:
            ProviderError: If the scrape fails (network, auth, rate-limit, etc.).
        """
        ...

    @abstractmethod
    def crawl(self, config: CrawlConfig) -> CrawlResult:
        """Recursively crawl a site starting from the seed URL.

        Args:
            config: Full crawl configuration including limits, filters, and scrape options.

        Returns:
            A CrawlResult containing all scraped documents and crawl statistics.

        Raises:
            ProviderError: If the crawl fails to start or times out.
        """
        ...

    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this provider (e.g. 'firecrawl', 'custom')."""
        ...

    def close(self) -> None:
        """Release any resources held by the provider (sessions, connections).

        Called when the provider is no longer needed. Default is a no-op.
        """
        pass


# ---------------------------------------------------------------------------
# Error types
# ---------------------------------------------------------------------------


class ProviderError(Exception):
    """Base error for all scraping provider failures."""

    def __init__(
        self,
        message: str,
        provider: str = "unknown",
        status_code: int | None = None,
        original_error: Exception | None = None,
    ):
        self.provider = provider
        self.status_code = status_code
        self.original_error = original_error
        super().__init__(f"[{provider}] {message}")


class RateLimitError(ProviderError):
    """Raised when the provider hits a rate limit."""

    def __init__(self, provider: str, retry_after: int | None = None):
        self.retry_after = retry_after
        super().__init__(
            f"Rate limited. Retry after {retry_after}s." if retry_after else "Rate limited.",
            provider=provider,
            status_code=429,
        )


class AuthError(ProviderError):
    """Raised when API authentication fails."""

    def __init__(self, provider: str, message: str = "Authentication failed"):
        super().__init__(message, provider=provider, status_code=401)


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------


def retry_with_backoff(
    fn, max_retries: int = 3, base_delay: float = 2.0, backoff_factor: float = 2.0
) -> Any:
    """Retry a callable with exponential backoff on ProviderError.

    Only retries on rate limits (429) and server errors (5xx). Does NOT
    retry on auth errors (401) or bad requests (400).

    Args:
        fn: Zero-argument callable to retry.
        max_retries: Maximum number of retry attempts (not counting the initial call).
        base_delay: Delay in seconds before the first retry.
        backoff_factor: Multiplier for each subsequent retry delay.

    Returns:
        The return value of fn() on success.

    Raises:
        ProviderError: The last error after exhausting retries.
    """
    last_error: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except (RateLimitError, ProviderError) as e:
            last_error = e
            if attempt < max_retries:
                delay = base_delay * (backoff_factor**attempt)
                if isinstance(e, RateLimitError) and e.retry_after:
                    delay = max(delay, float(e.retry_after))
                time.sleep(delay)
            else:
                raise
        except Exception as e:
            # Non-provider errors are not retried
            raise ProviderError(
                f"Unexpected error: {e}",
                original_error=e if isinstance(e, Exception) else None,
            ) from e
    raise last_error  # type: ignore[misc]  # unreachable if fn() never succeeds
