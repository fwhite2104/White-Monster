# SCRAPERS KNOWLEDGE BASE

**Scope:** Python 3 data scrapers for Irish grocery retailers: Aldi IE, Lidl IE, Tesco IE, SuperValu IE, Dunnes Stores, and Firecrawl-backed retailers.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new retailer scraper | `base.py` → new file → `run_scrapers.py` | Extend `BaseScraper`, register in `main()` |
| Change request politeness | `base.py` | `delay` default is 2.0s |
| Change User-Agent | `base.py` | `MonsterIreland/1.0` bot string |
| Modify Tesco IE scraping | `tesco_ie.py` | `curl_cffi` + BeautifulSoup, Akamai bypass |
| Modify SuperValu IE scraping | `supervalu_ie.py` | Direct Mercatus API, no anti-bot needed |
| Modify Dunnes Stores scraping | `dunnes_ie.py` | `curl_cffi` + BeautifulSoup, Cloudflare resilience |
| Modify price upsert logic | `run_scrapers.py` | `push_prices()` handles insert vs update |
| Change store matching | `run_scrapers.py` | `get_or_create_store()` matches by retailer + name |
| Update Python deps | `requirements.txt` | `curl-cffi` + `beautifulsoup4` + `requests` + `supabase` + `firecrawl-py` |
| Add a Firecrawl-backed retailer | `providers/base.py` → `providers/firecrawl_provider.py` → `firecrawl_ie.py` → `run_scrapers.py` | Add entry to `FIRECRAWL_RETAILERS` in `firecrawl_ie.py` |
| Add/modify scraping provider | `providers/base.py` | Extend `ScrapingProvider` ABC |
| Modify Firecrawl connection | `providers/firecrawl_provider.py` | SDK config (timeout, retries, API URL) |
| Tweak product name parsing | `firecrawl_ie.py` | `_parse_markdown()` or `PRODUCT_SCHEMA` |
| Run Firecrawl scrape example | `examples/scrape_example.py` | Requires `FIRECRAWL_API_KEY` |
| Run Firecrawl crawl example | `examples/crawl_example.py` | Requires `FIRECRAWL_API_KEY` |

## CONVENTIONS
- All scrapers extend `BaseScraper` (ABC in `base.py`)
- 2-second delay between requests (`self._wait()`)
- User-Agent: `MonsterIreland/1.0 (Price Comparison Bot; +https://monster-cork.vercel.app)`
- Accept-Language: `en-IE,en;q=0.9`
- Logging prefix: `[{retailer}] {message}` via `self._log()`
- Scrapers return `List[Dict]` with keys: `product_name`, `price`
- `run_scrapers.py` orchestrates: create Supabase client → scrape → get/create store → upsert prices
- Prices are upserted: update existing `(store_id, product_id, source='scraper')` row or insert new
- Service-role Supabase key is required (bypasses RLS)
- **Tesco IE & Dunnes**: Use `curl_cffi.Session(impersonate="chrome")` to spoof TLS fingerprint (bypasses Akamai/Cloudflare TLS fingerprinting)
- **SuperValu IE**: Uses standard `requests.Session` — direct Mercatus API with `X-Shopping-Mode` header
- **Aldi IE & Lidl IE**: Use standard `requests.Session` — direct internal JSON APIs
- HTML scrapers (Tesco, Dunnes) use `BeautifulSoup` with multiple fallback CSS selectors for resilience
- All scrapers filter for `"monster" in product_name.lower()` before returning results
- **Firecrawl-backed scrapers** (`firecrawl_ie.py`): Extend `BaseScraper` like custom scrapers, but use `FirecrawlProvider` internally for anti-bot bypass and JS rendering. Active only when `FIRECRAWL_API_KEY` is set.
- **Provider abstraction** (`providers/`): All scraping backends implement `ScrapingProvider` ABC. `FirecrawlProvider` wraps the Firecrawl SDK. A placeholder `_EmptyProvider` returns empty results when no API key is configured (no-crash design).
- **Two extraction strategies**: Structured extraction (LLM-based JSON, +4 credits/page, more reliable) and regex parsing of markdown (zero extra cost, fragile). Default is structured extraction via `PRODUCT_SCHEMA`.
- **Backend selection**: Add retailer entries to `FIRECRAWL_RETAILERS` dict in `firecrawl_ie.py`. Each entry specifies search URL, extraction mode, and optional crawl config. The orchestrator iterates this dict automatically.
- **Firecrawl scraping rules**: Use `scrape` for single URLs, `crawl` for recursive site ingestion, structured extraction only when schema adds real value, browser actions sparingly for JS-heavy pages.

## ANTI-PATTERNS
- Browser automation (Playwright) is ALLOWED for stores where API access is blocked (Aldi IE, Lidl IE). Prefer API/curl_cffi where it works.
- Do NOT remove the 2s delay — politeness requirement for retailer APIs
- Do NOT hardcode store coordinates in individual scraper files — use `run_scrapers.py` orchestration
- Do NOT commit `SUPABASE_SERVICE_KEY` — it must come from env var only
- Do NOT use plain `requests` for Tesco or Dunnes — Akamai/Cloudflare will block immediately; always use `curl_cffi`
- Do NOT remove the `"monster"` filter from any scraper — only Monster energy drink prices are tracked
- Do NOT change the `X-Shopping-Mode` UUID in `supervalu_ie.py` — it unlocks promotions data
- **Firecrawl anti-patterns**:
  - Do NOT use Firecrawl for retailers where the existing custom scraper works reliably (Tesco, Dunnes, Aldi, Lidl, SuperValu, Centra) — the custom scrapers are free and don't consume Firecrawl credits
  - Do NOT set `max_pages` > 200 in a single crawl run without testing — Firecrawl defaults to 10,000 pages and credits burn fast
  - Do NOT pass camelCase parameter names to the Python SDK — use snake_case (the SDK auto-converts API responses but request params use native Python style)
  - Do NOT depend on Firecrawl `extract` endpoint — it's deprecated; use `scrape` with JSON format or the `agent` endpoint instead
  - Do NOT store `FIRECRAWL_API_KEY` in code or committed files — it must come from env var only (`.env` for local, GitHub Secrets for CI/CD)
  - Do NOT remove the `_EmptyProvider` fallback — it ensures Firecrawl scrapers degrade gracefully when no API key is configured
