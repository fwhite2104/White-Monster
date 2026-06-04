#!/usr/bin/env python3
"""
Firecrawl crawl example — recursive site crawling for price discovery.

Demonstrates how to use Firecrawl crawl to discover Monster energy drink
products across an entire retailer site, including:

    1. Basic crawl with depth/page limits
    2. Path-filtered crawl (only product pages)
    3. Using crawl results for downstream price extraction

Usage:
    export FIRECRAWL_API_KEY=fc-...
    python examples/crawl_example.py
"""

import os
import sys
from pprint import pprint

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from providers.base import CrawlConfig, ScrapeConfig
from providers.firecrawl_provider import FirecrawlProvider


def main():
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print("ERROR: FIRECRAWL_API_KEY is not set.")
        sys.exit(1)

    provider = FirecrawlProvider(api_key=api_key)

    # --- Example 1: Basic crawl with limits ---
    print("=" * 60)
    print("Example 1: Basic crawl — limited to 10 pages, depth 2")
    print("=" * 60)

    config = CrawlConfig(
        url="https://www.tesco.ie/groceries/",
        max_pages=10,
        max_depth=2,
        include_paths=[r".*search.*monster.*", r".*product.*"],
        scrape_options={"formats": ["markdown"]},
    )

    result = provider.crawl(config)
    print(f"Crawled {result.total_pages} pages")
    print(f"Documents retrieved: {len(result.documents)}")
    if result.credits_used is not None:
        print(f"Credits used: {result.credits_used}")
    print()

    # Show first few documents.
    for i, doc in enumerate(result.documents[:5]):
        print(f"  [{i+1}] {doc.url}")
        print(f"       Title: {doc.title}")
        print(f"       Content: {len(doc.content)} chars")
    print()

    # --- Example 2: Path-filtered crawl (products only) ---
    print("=" * 60)
    print("Example 2: Path-filtered crawl — product pages only")
    print("=" * 60)

    config = CrawlConfig(
        url="https://www.tesco.ie/groceries/en-IE/",
        max_pages=25,
        max_depth=3,
        include_paths=[r".*/product/.*", r".*/p/.*"],
        exclude_paths=[r".*/account/.*", r".*/help/.*", r".*/contact/.*"],
        scrape_options={"formats": ["markdown"]},
        delay_s=1.0,
    )

    result = provider.crawl(config)
    print(f"Crawled {result.total_pages} product pages")
    product_docs = [
        d for d in result.documents
        if any(p in d.url for p in ["/product/", "/p/"])
    ]
    print(f"Product pages found: {len(product_docs)}")
    for doc in product_docs[:10]:
        print(f"  - {doc.title:50s} {doc.url}")
    print()

    # --- Example 3: Map-then-scrape pattern (URL discovery + extraction) ---
    print("=" * 60)
    print("Example 3: Firecrawl map for URL discovery, then targeted scrape")
    print("=" * 60)
    print("(Uses map to discover Monster product URLs, then scrapes each)")
    print()

    # Use scrape with a search URL to discover products (simpler than map).
    search_config = ScrapeConfig(
        url="https://www.tesco.ie/groceries/en-IE/search?query=monster+energy&page=1",
        only_main_content=True,
        block_ads=True,
        location={"country": "IE", "languages": ["en-IE"]},
    )

    search_doc = provider.scrape(search_config)
    print(f"Search page: {search_doc.url}")
    print(f"Content length: {len(search_doc.content)} chars")

    # Extract any links containing "monster" from the page.
    import re
    monster_links = re.findall(
        r'(https?://[^\s"\']*monster[^\s"\']*)',
        search_doc.content,
        re.IGNORECASE,
    )
    print(f"Monster-related links found in content: {len(monster_links)}")
    for link in monster_links[:5]:
        print(f"  - {link}")
    print()


if __name__ == "__main__":
    main()
