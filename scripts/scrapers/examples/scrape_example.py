#!/usr/bin/env python3
"""
Firecrawl scrape example — single-page extraction.

Demonstrates how to use the Firecrawl provider directly to scrape a
retailer's search page and extract Monster energy drink products.

Usage:
    export FIRECRAWL_API_KEY=fc-...
    python examples/scrape_example.py

    # Or pass the key inline:
    FIRECRAWL_API_KEY=fc-... python examples/scrape_example.py
"""

import os
import sys
from pprint import pprint

# Ensure the parent directory is on the path so we can import providers/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from providers.base import ScrapeConfig
from providers.firecrawl_provider import FirecrawlProvider


def main():
    api_key = os.environ.get("FIRECRAWL_API_KEY")
    if not api_key:
        print("ERROR: FIRECRAWL_API_KEY is not set.")
        print("  export FIRECRAWL_API_KEY=fc-...")
        sys.exit(1)

    provider = FirecrawlProvider(api_key=api_key)

    # --- Example 1: Basic scrape (markdown content) ---
    print("=" * 60)
    print("Example 1: Basic scrape — markdown content")
    print("=" * 60)

    config = ScrapeConfig(
        url="https://www.tesco.ie/groceries/en-IE/search?query=monster+energy",
        only_main_content=True,
        block_ads=True,
        location={"country": "IE", "languages": ["en-IE"]},
    )

    doc = provider.scrape(config)
    print(f"URL: {doc.url}")
    print(f"Title: {doc.title}")
    print(f"Content length: {len(doc.content)} characters")
    print(f"Metadata keys: {list(doc.metadata.keys())}")
    print()

    # --- Example 2: Structured extraction with JSON schema ---
    print("=" * 60)
    print("Example 2: Structured extraction with JSON schema")
    print("=" * 60)

    product_schema = {
        "type": "object",
        "properties": {
            "products": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "price": {"type": "number", "description": "Price in EUR"},
                        "currency": {"type": "string"},
                    },
                    "required": ["name", "price"],
                },
            }
        },
        "required": ["products"],
    }

    config = ScrapeConfig(
        url="https://www.tesco.ie/groceries/en-IE/search?query=monster+energy",
        only_main_content=True,
        block_ads=True,
        location={"country": "IE", "languages": ["en-IE"]},
        extract_schema=product_schema,
    )

    doc = provider.scrape(config)
    raw_json = doc.metadata.get("json", {})
    products = raw_json.get("products", []) if isinstance(raw_json, dict) else []

    if products:
        print(f"Found {len(products)} products via structured extraction:")
        for p in products:
            print(f"  - {p.get('name', '?'):40s} EUR {p.get('price', '?'):>6}")
    else:
        print("No structured products extracted.")
        print("Metadata:", {k: v for k, v in doc.metadata.items() if v})

    print()

    # --- Example 3: Scrape with custom headers and wait ---
    print("=" * 60)
    print("Example 3: Scrape with custom wait and ad blocking")
    print("=" * 60)

    config = ScrapeConfig(
        url="https://www.supervalu.ie/shopping/browse/c/O301710",  # Sports & Energy Drinks
        only_main_content=True,
        wait_for_ms=3000,  # Wait 3s for JS rendering
        block_ads=True,
        location={"country": "IE", "languages": ["en-IE"]},
    )

    doc = provider.scrape(config)
    print(f"URL: {doc.url}")
    print(f"Content length: {len(doc.content)} characters")
    print(f"Snippet: {doc.content[:300]}...")
    print()


if __name__ == "__main__":
    main()
