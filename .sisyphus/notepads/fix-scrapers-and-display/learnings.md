# Learnings - fix-scrapers-and-display

## 2026-06-01T21:15:42Z Session Start

### Codebase Conventions
- All scrapers extend BaseScraper ABC in base.py
- Scrapers return List[Dict] with keys: product_name, price, currency, retailer
- run_scrapers.py orchestrates: create Supabase client → scrape → get_or_create store → push_prices
- Push_prices uses ilike("name", f"%{first_word}%") which is BROKEN — maps ALL to product #1
- curl_cffi with impersonate="chrome" for Tesco and Dunnes (Akamai/Cloudflare bypass)
- Supabase server client uses NEXT_PUBLIC_SUPABASE_ANON_KEY (anon key), NOT service role
- Migrations are additive only (no DROP statements, no column renames)

### Critical Patterns
- PostgREST does NOT auto-include FK columns when omitted from explicit .select()
- Supabase join syntax: .select('stores(id,name), products(id,name)') returns nested objects
- LSP diagnostics check: lsp_diagnostics(filePath=".", extension=".ts") for TypeScript
- Build check: cd monster-cork && bun run build
- Venv at /tmp/scraper-venv with curl_cffi, beautifulsoup4, requests, supabase

### Bug Root Causes
1. Product matching: split()[0] takes first word, ilike matches ALL → always picks data[0]
2. Pack size filter: regex on product names, but seed names have no pack indicators
3. Missing store_id/product_id: .select() omits FK columns
4. No RLS INSERT on stores: only SELECT policy exists, server client uses anon key

### T3 Fix — push_prices() Product Matching Rewrite
- Replaced `ilike("name", f"%{p['product_name'].split()[0]}%")` with exact variant + pack_size matching
- Added `_extract_variant(product_name)` module-level helper with keyword-based mapping:
  - "zero sugar"/"white zero" → 'zero_sugar'
  - "ultra white" (not rosa/paradise) → 'ultra_white'
  - "ultra rosa"/"rosa" → 'ultra_rosa'
  - "ultra paradise"/"paradise" → 'ultra_paradise'
  - Fallback: 'zero_sugar'
- Calls `BaseScraper._detect_pack_size()` to match pack_size column ('single' vs '4_pack')
- Unknown pack_size defaults to 'single'
- Logs successful matches and warnings on no-match
- `grep "split()\[0\]" run_scrapers.py` returns empty

## F2 Code Quality Review Results (2026-06-01)

### Build: PASS
- `bun run build` — compiled, TypeScript check, all 7 static pages generated cleanly

### Files Reviewed: 11
### Clean: 10 | Issues: 1 | Verdict: APPROVE

### Only Issue: `: any` annotations in `app/api/prices/route.ts`
- Lines 34, 38, 41, 49: parameter type annotations on Supabase join .map()/.filter()/.sort() callbacks
- Not `as any` casts (which would be worse), but still bypasses type checking
- Low severity — Supabase nested join types are complex and this is a pragmatic pattern
- Recommendation: define a `PriceJoinResult` interface for the Supabase query return type

### Negative Checks Passed:
- `as any` literal: 0
- `@ts-ignore`/`@ts-expect-error`: 0
- `console.log` in TS/TSX: 0
- Empty catch blocks: 0
- Empty `except: pass` in Python: 0 (tesco_ie.py/dunnes_ie.py have proper `continue`/`return None`)
- Unused imports: 0 (all DISABLED comments are intentional)
- Commented-out code: 0
- AI slop: 0

### Python Scraper Logging:
- `print()` in run_scrapers.py and cleanup_prices.py are intentional operational logging, not debug leftovers
- All scraper files use `self._log()` for structured output

### SQL Migrations:
- 004_add_pack_size.sql: valid syntax; duplicate barcodes between single/4-pack is a data model concern, not a bug
- 005_add_stores_insert_policy.sql: valid syntax, follows existing pattern
