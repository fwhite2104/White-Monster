# SCRAPERS KNOWLEDGE BASE

**Scope:** Python 3 data scrapers for Irish grocery retailers: Aldi IE, Lidl IE, Tesco IE, SuperValu IE, Dunnes Stores.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new retailer scraper | `base.py` → new file → `run_scrapers.py` | Extend `BaseScraper`, register in `main()` |
| Change request politeness | `base.py` | `delay` default is 2.0s |
| Change User-Agent | `base.py` | `MonsterCork/1.0` bot string |
| Modify Tesco IE scraping | `tesco_ie.py` | `curl_cffi` + BeautifulSoup, Akamai bypass |
| Modify SuperValu IE scraping | `supervalu_ie.py` | Direct Mercatus API, no anti-bot needed |
| Modify Dunnes Stores scraping | `dunnes_ie.py` | `curl_cffi` + BeautifulSoup, Cloudflare resilience |
| Modify price upsert logic | `run_scrapers.py` | `push_prices()` handles insert vs update |
| Change store matching | `run_scrapers.py` | `get_or_create_store()` matches by retailer + name |
| Update Python deps | `requirements.txt` | `curl-cffi` + `beautifulsoup4` + `requests` + `supabase` |

## CONVENTIONS
- All scrapers extend `BaseScraper` (ABC in `base.py`)
- 2-second delay between requests (`self._wait()`)
- User-Agent: `MonsterCork/1.0 (Price Comparison Bot; +https://monster-cork.vercel.app)`
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

## ANTI-PATTERNS
- Do NOT add browser automation (Selenium/Playwright) — scrapers are API-only
- Do NOT remove the 2s delay — politeness requirement for retailer APIs
- Do NOT hardcode store coordinates in individual scraper files — use `run_scrapers.py` orchestration
- Do NOT commit `SUPABASE_SERVICE_KEY` — it must come from env var only
- Do NOT use plain `requests` for Tesco or Dunnes — Akamai/Cloudflare will block immediately; always use `curl_cffi`
- Do NOT remove the `"monster"` filter from any scraper — only Monster energy drink prices are tracked
- Do NOT change the `X-Shopping-Mode` UUID in `supervalu_ie.py` — it unlocks promotions data
