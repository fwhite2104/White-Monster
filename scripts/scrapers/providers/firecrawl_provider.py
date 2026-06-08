# scripts/scrapers/providers/firecrawl_provider.py
"""
Firecrawl-backed scraping provider for Monster Cork.

Wraps the Firecrawl Python SDK behind the ScrapingProvider ABC so that
the rest of the codebase never depends on Firecrawl directly. This makes
it possible to swap the backend (e.g. to Scrapy, Playwright, or a custom
stack) without changing any consumer code.

Usage:
    from providers.firecrawl_provider import FirecrawlProvider

    # provider = FirecrawlProvider(api_key="fc-your-key")  # Uncomment and set your key
    doc = provider.scrape(ScrapeConfig(url="https://example.com"))
    result = provider.crawl(CrawlConfig(url="https://example.com", max_pages=50))

Backend selection is driven by environment:
    - FIRECRAWL_API_KEY must be set (unless api_key is passed explicitly)
    - FIRECRAWL_API_URL  optional, defaults to https://api.firecrawl.dev
"""

from __future__ import annotations

import logging
import os
from typing import Any

from firecrawl import Firecrawl

# Pin major version to avoid v5 breaking change (extra="forbid")
# pip install "firecrawl-py>=4.28,<5"

from providers.base import (
    AuthError,
    CrawlConfig,
    CrawlResult,
    ProviderError,
    RateLimitError,
    ScrapeConfig,
    ScrapedDocument,
    ScrapingProvider,
)

logger = logging.getLogger("firecrawl_provider")

RETRYABLE_STATUSES = {408, 429, 500, 502, 503, 504}


class FirecrawlProvider(ScrapingProvider):
    """Provider that uses the Firecrawl API for web scraping and crawling.

    Handles anti-bot bypass, JavaScript rendering, and structured extraction
    through Firecrawl's managed API. Supports both single-page scrape and
    recursive crawl with configurable depth/scope controls.
    """

    def __init__(
        self,
        api_key: str | None = None,
        api_url: str | None = None,
        timeout: float = 60.0,
        max_retries: int = 3,
        backoff_factor: float = 0.5,
    ):
        self._api_key = api_key or os.environ.get("FIRECRAWL_API_KEY")
        if not self._api_key:
            raise AuthError(
                "firecrawl",
                "FIRECRAWL_API_KEY is not set. "
                "Pass it explicitly or set the FIRECRAWL_API_KEY environment variable.",
            )
        self._api_url = api_url or os.environ.get(
            "FIRECRAWL_API_URL", "https://api.firecrawl.dev"
        )
        self._client = Firecrawl(
            api_key=self._api_key,
            api_url=self._api_url,
            timeout=timeout,
            max_retries=max_retries,
            backoff_factor=backoff_factor,
        )
        self._timeout = timeout
        logger.info(
            "FirecrawlProvider initialized (api_url=%s, timeout=%s, max_retries=%s)",
            self._api_url,
            timeout,
            max_retries,
        )

    def name(self) -> str:
        return "firecrawl"

    def close(self) -> None:
        logger.debug("FirecrawlProvider closed")

    # ------------------------------------------------------------------
    # Scrape
    # ------------------------------------------------------------------

    def scrape(self, config: ScrapeConfig) -> ScrapedDocument:
        formats = list(config.formats)

        # Inject structured extraction if a schema was provided.
        if config.extract_schema is not None:
            json_entry: dict[str, Any] = {"type": "json", "schema": config.extract_schema}
            if json_entry not in formats:
                formats.append(json_entry)

        # Build the kwargs that map to the Firecrawl Python SDK.
        kwargs: dict[str, Any] = {
            "formats": formats,
            "only_main_content": config.only_main_content,
            "block_ads": config.block_ads,
            "proxy": config.proxy,
        }

        if config.wait_for_ms:
            kwargs["wait_for"] = config.wait_for_ms
        if config.include_tags:
            kwargs["include_tags"] = config.include_tags
        if config.exclude_tags:
            kwargs["exclude_tags"] = config.exclude_tags
        if config.headers:
            kwargs["headers"] = config.headers
        if config.mobile:
            kwargs["mobile"] = True
        if config.location:
            kwargs["location"] = config.location
        if config.max_age_ms is not None:
            kwargs["max_age"] = config.max_age_ms
        if config.actions:
            kwargs["actions"] = config.actions

        try:
            doc = self._client.scrape(config.url, **kwargs)
        except Exception as exc:
            raise self._map_error(exc, context=config.url)

        if doc is None:
            raise ProviderError(
                f"Firecrawl returned None for {config.url}",
                provider="firecrawl",
            )

        metadata = self._extract_metadata(doc)
        content = doc.markdown or doc.html or doc.raw_html or ""

        return ScrapedDocument(
            url=metadata.get("url") or metadata.get("source_url") or config.url,
            title=metadata.get("title") or "",
            content=content,
            metadata=metadata,
        )

    # ------------------------------------------------------------------
    # Crawl
    # ------------------------------------------------------------------

    def crawl(self, config: CrawlConfig) -> CrawlResult:
        scrape_opts: dict[str, Any] = dict(config.scrape_options or {})
        if "formats" not in scrape_opts:
            scrape_opts["formats"] = ["markdown"]

        kwargs: dict[str, Any] = {
            "limit": config.max_pages,
            "max_discovery_depth": config.max_depth,
            "ignore_robots_txt": False,
            "allow_external_links": config.allow_external_links,
            "allow_subdomains": config.allow_subdomains,
            "scrape_options": scrape_opts,
        }

        if config.include_paths:
            kwargs["include_paths"] = config.include_paths
        if config.exclude_paths:
            kwargs["exclude_paths"] = config.exclude_paths
        if config.ignore_sitemap:
            kwargs["sitemap"] = "skip"
        if config.delay_s > 0:
            kwargs["delay"] = config.delay_s
        if config.webhook_url:
            kwargs["webhook"] = {"url": config.webhook_url, "events": ["completed", "failed"]}
        if config.prompt:
            kwargs["prompt"] = config.prompt

        try:
            result = self._client.crawl(
                config.url,
                **kwargs,
                poll_interval=2,
                timeout=max(self._timeout * 2, 120),
            )
        except Exception as exc:
            raise self._map_error(exc, context=f"crawl({config.url})")

        if result is None:
            return CrawlResult(documents=[], total_pages=0, credits_used=0)

        documents: list[ScrapedDocument] = []
        raw_data = getattr(result, "data", None) or []
        for page in raw_data:
            meta = self._extract_metadata(page)
            content = getattr(page, "markdown", None) or ""
            documents.append(
                ScrapedDocument(
                    url=meta.get("url") or meta.get("source_url", ""),
                    title=meta.get("title") or "",
                    content=content,
                    metadata=meta,
                )
            )

        return CrawlResult(
            documents=documents,
            total_pages=getattr(result, "completed", len(documents)),
            credits_used=getattr(result, "credits_used", None),
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_metadata(doc: Any) -> dict[str, Any]:
        """Pull metadata from a Firecrawl response object.

        The Python SDK auto-converts API camelCase to snake_case, so we
        access attributes directly (not dict keys).
        """
        meta = getattr(doc, "metadata", None)
        if meta is None:
            return {}
        result: dict[str, Any] = {}

        for attr in (
            "source_url",
            "url",
            "title",
            "description",
            "language",
            "status_code",
            "error",
            "og_title",
            "og_description",
            "og_image",
            "scrape_id",
            "source",
        ):
            val = getattr(meta, attr, None)
            if val is not None:
                result[attr] = val

        return result

    @staticmethod
    def _map_error(exc: Exception, context: str = "") -> ProviderError:
        """Map a raw exception from the Firecrawl SDK to a typed ProviderError."""
        # Check for common Firecrawl SDK error patterns
        msg = str(exc).lower()
        status = getattr(exc, "status_code", None)

        if status == 401 or "unauthorized" in msg or "invalid token" in msg:
            return AuthError("firecrawl", f"Authentication failed: {exc}")
        if status == 429 or "rate limit" in msg or "too many requests" in msg:
            retry_after = getattr(exc, "retry_after", None)
            return RateLimitError("firecrawl", retry_after=retry_after)
        if status == 402 or "payment required" in msg or "out of credits" in msg:
            return ProviderError(
                f"Out of credits: {exc}", provider="firecrawl", status_code=402
            )
        if status == 408 or "timeout" in msg:
            return ProviderError(
                f"Request timed out: {exc}",
                provider="firecrawl",
                status_code=408,
                original_error=exc,
            )
        if status in RETRYABLE_STATUSES:
            return ProviderError(
                f"Server error ({status}): {exc}",
                provider="firecrawl",
                status_code=status,
                original_error=exc,
            )

        return ProviderError(
            f"{exc} (context: {context})" if context else str(exc),
            provider="firecrawl",
            status_code=status,
            original_error=exc,
        )
