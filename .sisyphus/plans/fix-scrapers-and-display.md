# Fix Scrapers and Display: Make Monster Cork Actually Work

## TL;DR

> **Quick Summary**: Fix 9 bugs (4 critical) that prevent Monster Cork from displaying correct prices. The core issues are: wrong product-variant mapping in scrapers, broken pack-size filtering, missing API fields, and RLS policy blocking user uploads.
> 
> **Deliverables**:
> - Working product-variant matching so each Monster variant shows correct prices
> - Working 4-pack and single-can filtering
> - API response that includes all needed fields (store_id, product_id)
> - User price uploads that work for new stores
> - Cleaned up existing price data with correct product mappings
> - Aldi/Lidl scrapers properly commented out with error messages
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 5 → Task 8 → Task 10 → F1-F4

---

## Context

### Original Request
"The app is nearly working but its not perfect. I think the scrapers arent working properly or are not displaying properly."

### Interview Summary
**Key Discussions**:
- Product matching: `ilike("name", f"%{p['product_name'].split()[0]}%")` takes only the first word and matches ALL products → always picks product #1 ("White Monster Zero Sugar")
- Pack-size filter: API regex checks product names for "4 pack" etc., but seed products have no pack indicators → "4-Pack" always returns zero results
- API response omits `store_id` and `product_id` → map highlights broken, distances all 0
- No RLS INSERT policy on stores table → user uploads for new stores fail with 500
- Aldi/Lidl scrapers are broken (403/ DNS errors) → need to be disabled gracefully

**Research Findings**:
- Supabase server client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (NOT service role), so RLS policies ARE enforced on user-facing API
- PostgREST does NOT auto-include FK columns when they're omitted from explicit `.select()` — `store_id`/`product_id` are genuinely missing from API response
- All existing prices in DB are assigned to product #1 (zero_sugar) due to the product matching bug
- SuperValu creates two separate store entries at same coordinates — should use one store for both scraper outputs

### Metis Review
**Identified Gaps** (addressed):
- Data cleanup after fixing product matching → Added as explicit Task 6
- Need to verify actual scraper output before writing variant matching logic → Added dry-run step in Task 2
- Keep SuperValu scrapers separate (not consolidate) → Both write to same store entry via `run_scrapers.py` change
- pack_size column should be on products table with 'single' default → Added migration Task 1
- PostgREST FK column behavior verified → Bug #3 confirmed real
- RLS bug confirmed real (anon key, no INSERT policy) → Added migration Task 1

---

## Work Objectives

### Core Objective
Fix all 9 bugs so that prices display correctly for each retailer and each Monster variant, 4-pack filtering works, the map highlights stores on hover, and user price uploads succeed.

### Concrete Deliverables
- Migration adding `pack_size` column to products table and 4-pack product rows
- Migration adding RLS INSERT policy on stores table
- Fixed `push_prices()` with variant-based product matching
- Fixed API response including `store_id` and `product_id`
- Fixed pack_size filtering using DB column instead of regex
- Fixed `run_scrapers.py` — both SuperValu scrapers write to same store, Aldi/Lidl commented out
- Data cleanup: delete all existing scraper-sourced prices (will be re-scraped)
- Fixed regex in `base.py` (`\b4\s*\.\s*` pattern removed)
- Consistent default radius (10km everywhere)

### Definition of Done
- [ ] `bun run build` compiles with zero errors
- [ ] Each Monster variant shows only its own prices (not all mapped to zero_sugar)
- [ ] Selecting "4-Pack" in UI returns 4-pack products (not zero results)
- [ ] Selecting "Single Can" returns only single-can products
- [ ] Selecting "All Sizes" returns everything
- [ ] API response includes `store_id` and `product_id` at top level
- [ ] Map hover-highlight works (store_id matches store on map)
- [ ] POST /api/prices with new store name returns 201 (not 500)
- [ ] Aldi/Lidl scrapers are commented out with clear error messages
- [ ] Both SuperValu scrapers write to same store entry

### Must Have
- Variant-based product matching in `push_prices()`
- `pack_size` column on products table with migration
- 4-pack product entries in seed data (White Monster Zero Sugar 4-Pack, Monster Ultra White 4-Pack)
- `store_id` and `product_id` in API response
- RLS INSERT policy on stores
- Data cleanup (delete mis-mapped scraper prices)
- Aldi/Lidl commented out with error messages
- Consistent default radius (10km)

### Must NOT Have (Guardrails)
- Do NOT add browser automation (Selenium/Playwright) for scrapers
- Do NOT remove the 2s delay in scrapers
- Do NOT change the X-Shopping-Mode UUID in supervalu_ie.py
- Do NOT commit SUPABASE_SERVICE_KEY
- Do NOT use plain requests for Tesco or Dunnes — Akamai/Cloudflare will block
- Do NOT remove the "monster" filter from any scraper
- Do NOT consolidate SuperValu scrapers into one file
- Do NOT add fuzzy matching or ML to product matching — keyword extraction only
- Do NOT bypass RLS on the user-facing API — fix the policy instead
- Do NOT drop or rename existing columns — additive migrations only

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None — no test framework
- **Framework**: N/A
- **Agent-Executed QA**: YES — mandatory for all tasks

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — send requests, assert status + response fields
- **Database**: Use Bash (Supabase CLI or psql) — query, assert row counts and values
- **Scraper**: Use Bash (python3) — run scraper, assert output format and values

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation changes):
├── Task 1: Database migrations (pack_size column + RLS policy) [quick]
├── Task 2: Fix push_prices product matching in run_scrapers.py [quick]
├── Task 3: Fix API route — add store_id/product_id + fix pack_size filter [quick]
├── Task 4: Comment out Aldi/Lidl scrapers with error messages [quick]

Wave 2 (After Wave 1 — fixes and cleanup):
├── Task 5: Fix base.py regex + SuperValu same-store + default radius [quick]
├── Task 6: Data cleanup — delete mis-mapped scraper prices [quick]
├── Task 7: Fix PriceCard null safety + remove storesWithDistance distance override [quick]

Wave 3 (After Wave 2 — verification and testing):
├── Task 8: Run scrapers end-to-end and verify correct product mapping [deep]
├── Task 9: Test frontend with Playwright — verify all filters and display [unspecified-high]
├── Task 10: Push to GitHub and verify CI passes [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 5 (pack_size column) |
| 2 | — | 6 (product matching) |
| 3 | — | 7 (API response fix) |
| 4 | — | 8 (scrapers run) |
| 5 | 1 | 8 (base.py + run_scrapers) |
| 6 | 2 | 8 (clean data) |
| 7 | 3 | 9 (frontend display) |
| 8 | 5, 2 | 10 (end-to-end) |
| 9 | 7, 6 | 10 (frontend tested) |
| 10 | 8, 9 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1 `quick`, T2 `quick`, T3 `quick`, T4 `quick`
- **Wave 2**: 3 tasks — T5 `quick`, T6 `quick`, T7 `quick`
- **Wave 3**: 3 tasks — T8 `deep`, T9 `unspecified-high`, T10 `quick`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. Add database migrations: pack_size column + RLS INSERT policy for stores

  **What to do**:
  - Create `supabase/migrations/004_add_pack_size.sql` that:
    - Adds `pack_size TEXT NOT NULL DEFAULT 'single'` to the `products` table (CHECK constraint: `pack_size IN ('single', '4_pack', 'unknown')`)
    - Adds 4-pack product rows for the existing variants:
      - `('White Monster Zero Sugar 4-Pack', 'zero_sugar', 4x250, '5060536310047', NULL, '4_pack')`
      - `('Monster Ultra White 4-Pack', 'ultra_white', 4x250, '5060536310146', NULL, '4_pack')`
      - `('Monster Ultra Rosa 4-Pack', 'ultra_rosa', 4x250, '5060536310122', NULL, '4_pack')`
      - `('Monster Ultra Paradise 4-Pack', 'ultra_paradise', 4x250, '5060536310139', NULL, '4_pack')`
    - Sets `size_ml` to 250 for all existing products (they are all 250ml single cans)
  - Create `supabase/migrations/005_add_stores_insert_policy.sql` that:
    - Adds `CREATE POLICY "Anyone can insert stores" ON stores FOR INSERT WITH CHECK (true);`
  - Verify both migrations are additive only (no DROP, no column renames)

  **Must NOT do**:
  - Do NOT drop or rename any existing columns
  - Do NOT modify existing row data (the pack_size default handles it)
  - Do NOT add columns other than pack_size

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Task 5 (needs pack_size column), Task 6 (needs clean data to verify), Task 8 (needs 4-pack products)
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `supabase/migrations/001_initial_schema.sql` — Current schema: products table has `name, variant, size_ml, barcode, image_url` columns. Follow the same `CREATE TABLE` / `ALTER TABLE` pattern.
  - `supabase/migrations/002_seed_products.sql` — Existing seed data pattern: `INSERT INTO products (name, variant, size_ml, barcode, image_url) VALUES ...`. Follow this format for new 4-pack rows.
  - `supabase/migrations/003_seed_cork_stores.sql` — Store seeding pattern for reference.

  **API/Type References** (contracts to implement against):
  - `lib/types.ts:14-23` — Product interface: `variant: string, size_ml: number`. The `pack_size` field needs to be added here after the migration.
  - `lib/constants.ts:17-22` — MONSTER_VARIANTS array. 4-pack entries may need to be added here if the UI should show them in the variant dropdown.

  **Why Each Reference Matters**:
  - `001_initial_schema.sql`: Shows the exact column types and constraints pattern to follow. The `pack_size` column should use `TEXT` with a `CHECK` constraint, matching the style of `source TEXT NOT NULL DEFAULT 'scraper'` in the prices table.
  - `002_seed_products.sql`: Shows how product rows are inserted. 4-pack rows should follow the same format but include `pack_size` column.
  - `lib/types.ts`: The Product interface will need `pack_size` added after this migration is applied.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Migration files exist and are syntactically valid SQL
    Tool: Bash
    Preconditions: Project directory exists
    Steps:
      1. ls supabase/migrations/004_add_pack_size.sql — file must exist
      2. ls supabase/migrations/005_add_stores_insert_policy.sql — file must exist
      3. grep -c "ALTER TABLE" supabase/migrations/004_add_pack_size.sql — must be >= 1
      4. grep -c "pack_size" supabase/migrations/004_add_pack_size.sql — must be >= 2 (column + check)
      5. grep "4_pack" supabase/migrations/004_add_pack_size.sql — must find 4-pack product rows
      6. grep "INSERT.*WITH CHECK" supabase/migrations/005_add_stores_insert_policy.sql — must find policy
    Expected Result: Both files exist, contain expected SQL, and are additive only
    Failure Indicators: File missing, DROP statements found, CHECK constraint missing
    Evidence: .sisyphus/evidence/task-1-migrations-exist.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(db): add pack_size column to products and RLS INSERT policy for stores`
  - Files: `supabase/migrations/004_add_pack_size.sql`, `supabase/migrations/005_add_stores_insert_policy.sql`

- [x] 2. Fix push_prices product matching in run_scrapers.py

  **What to do**:
  - In `scripts/scrapers/run_scrapers.py`, replace the `push_prices()` function's product matching logic (lines 49-59):
    - Remove the fragile `ilike("name", f"%{p['product_name'].split()[0]}%")` approach
    - Implement variant-based matching: extract a variant keyword from the scraped `product_name` and match it against the `products.variant` column
    - Variant extraction logic (add as a helper function `_extract_variant`):
      - Check for "zero sugar" or "white zero" → match `variant='zero_sugar'`
      - Check for "ultra white" → match `variant='ultra_white'`
      - Check for "ultra rosa" or "rosa" → match `variant='ultra_rosa'`
      - Check for "ultra paradise" or "paradise" → match `variant='ultra_paradise'`
      - Fallback: match by `ilike("name", f"%{keyword}%")` with the extracted keyword
    - Also factor in `pack_size` from the scraper's `_detect_pack_size()` result:
      - If the scraper indicates `pack_size='4_pack'`, match against products where `pack_size='4_pack'`
      - If the scraper indicates `pack_size='single'` or `'unknown'`, match against products where `pack_size='single'`
    - After finding the product, log the matching: `self._log(f"  Matched '{p['product_name']}' → product_id={product_id}")`
    - If no match found, log a warning and skip (don't crash)

  **Must NOT do**:
  - Do NOT use fuzzy matching, Levenshtein distance, or ML
  - Do NOT change the `List[Dict]` return format from scrapers
  - Do NOT remove the "monster" filter from any scraper

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 6 (needs correct matching for data cleanup)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `scripts/scrapers/base.py:28-81` — `_detect_pack_size()` and `_filter_by_pack_size()` — the existing pack size detection that should be used in the matching logic.
  - `scripts/scrapers/run_scrapers.py:46-90` — Current `push_prices()` function that needs fixing.
  - `supabase/migrations/002_seed_products.sql` — Existing product variants: `zero_sugar`, `ultra_white`, `ultra_rosa`, `ultra_paradise`.

  **API/Type References**:
  - `scripts/scrapers/run_scrapers.py:15-16` — Supabase client creation with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

  **Why Each Reference Matters**:
  - `base.py`: The `_detect_pack_size()` function already exists and should be reused in the matching logic rather than reimplemented.
  - `run_scrapers.py`: The current `push_prices()` function is the one that needs to be fixed. Lines 49-59 contain the broken `ilike` logic.
  - `002_seed_products.sql`: Shows the exact variant names used in the database, which the matching logic must align with.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Product matching maps correct variants
    Tool: Bash (python3)
    Preconditions: Scraper venv active at /tmp/scraper-venv
    Steps:
      1. cd /home/feilim/Projects/Monster-App/monster-cork/scripts/scrapers
      2. source /tmp/scraper-venv/bin/activate
      3. python3 -c "
from run_scrapers import _extract_variant
assert _extract_variant('Monster Energy Ultra White 500ml') == 'ultra_white'
assert _extract_variant('White Monster Zero Sugar 250ml') == 'zero_sugar'
assert _extract_variant('Monster Ultra Rosa 4 Pack') == 'ultra_rosa'
# Note: pack_size is handled separately by _detect_pack_size(), not by _extract_variant
assert _extract_variant('Monster Ultra Paradise Can') == 'ultra_paradise'
assert _extract_variant('Monster Energy Drink') == 'zero_sugar'  # fallback
print('All variant extraction tests passed')
"
    Expected Result: All assertions pass, variant extraction works correctly
    Failure Indicators: AssertionError on any variant, import failure
    Evidence: .sisyphus/evidence/task-2-variant-matching.txt

  Scenario: push_prices does not use ilike with first word
    Tool: Bash
    Preconditions: File modified
    Steps:
      1. grep -n "split()\[0\]" scripts/scrapers/run_scrapers.py — must return empty
      2. grep -n "_extract_variant" scripts/scrapers/run_scrapers.py — must find the function
      3. grep -n "variant" scripts/scrapers/run_scrapers.py — must find variant-based matching
    Expected Result: No `split()[0]` pattern exists, variant matching is implemented
    Failure Indicators: `split()[0]` still found, no `_extract_variant` function
    Evidence: .sisyphus/evidence/task-2-no-first-word-match.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(scrapers): replace broken product matching with variant-based lookup`
  - Files: `scripts/scrapers/run_scrapers.py`

- [x] 3. Fix API route — add store_id/product_id + fix pack_size filter

  **What to do**:
  - In `app/api/prices/route.ts`:
    - **Add `store_id` and `product_id`** to the Supabase `.select()` on line 19. Change from:
      ```
      id, price, source, scraped_at,
      ```
      to:
      ```
      id, store_id, product_id, price, source, scraped_at,
      ```
    - **Fix the pack_size filter** (lines 40-49) to use the `products.pack_size` column instead of regex on product names. Change the filter logic to:
      ```typescript
      if (packSize !== 'all') {
        filtered = filtered?.filter((p: any) => {
          const productPackSize = p.products?.pack_size ?? 'single'
          if (packSize === '4_pack') return productPackSize === '4_pack'
          if (packSize === 'single') return productPackSize === 'single'
          return true
        })
      }
      ```
    - **Fix the default radius** on line 12: change `?? '20'` to `?? String(DEFAULT_RADIUS_KM)` and add `import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'` (CORK_CENTER is already imported, add DEFAULT_RADIUS_KM).
  - In `lib/types.ts`:
    - Add `pack_size: string` to the `Product` interface (after `image_url`)

  **Must NOT do**:
  - Do NOT remove the `stores` and `products` nested objects from the select
  - Do NOT change the distance calculation logic
  - Do NOT remove the regex patterns in base.py (they're still used by scrapers)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 7 (needs store_id for PriceCard fix), Task 9 (needs pack_size filter for testing)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `app/api/prices/route.ts:17-27` — Current Supabase query structure. Add `store_id, product_id` to this select.
  - `app/api/stores/route.ts` — Stores API route for reference on how it handles radius (uses 50km default which needs to be fixed too).
  - `lib/constants.ts:24` — `DEFAULT_RADIUS_KM = 10` — the constant that should be used everywhere.

  **API/Type References**:
  - `lib/types.ts:14-23` — Product interface. Add `pack_size: string` after `image_url`.
  - `lib/types.ts:25-38` — Price interface. Already has `store_id` and `product_id` fields, but they weren't being returned by the API.

  **Why Each Reference Matters**:
  - `route.ts:17-27`: This is the exact query that needs `store_id` and `product_id` added. Without these, `page.tsx:73` fails to match prices to stores.
  - `route.ts:40-49`: This is the regex-based pack_size filter that returns zero results for 4-packs. Must be replaced with DB column lookup.
  - `lib/constants.ts:24`: The authoritative default radius that all APIs should use.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: API response includes store_id and product_id at top level
    Tool: Bash (curl)
    Preconditions: Next.js dev server running on localhost:3000, Supabase has test data
    Steps:
      1. curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=all" | jq '.prices[0] | keys'
      2. Verify the keys array includes "store_id" and "product_id"
    Expected Result: API response includes store_id and product_id at the top level of each price object
    Failure Indicators: store_id or product_id missing from keys
    Evidence: .sisyphus/evidence/task-3-api-keys.txt

  Scenario: Pack size filter returns 4-pack products when selected
    Tool: Bash (curl)
    Preconditions: 4-pack products exist in database (from Task 1 migration)
    Steps:
      1. curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=4_pack" | jq '.prices | length'
      2. Verify result is >= 0 (not an error)
      3. curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=single" | jq '.prices | length'
      4. Verify result is >= 0
    Expected Result: Both pack_size filters return results (not zero) when data exists
    Failure Indicators: 4_pack returns empty array, or any filter returns an error
    Evidence: .sisyphus/evidence/task-3-pack-filter.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(api): add store_id/product_id, use DB pack_size column, fix default radius`
  - Files: `app/api/prices/route.ts`, `lib/types.ts`

- [x] 4. Comment out Aldi/Lidl scrapers with clear error messages

  **What to do**:
  - In `scripts/scrapers/run_scrapers.py`:
    - Comment out the Lidl and Aldi scraper imports on lines 8-9 (keep them but add `# DISABLED:` prefix)
    - Comment out the Lidl scraping block (lines 98-102) and replace with a print statement: `print("\n--- Lidl Ireland --- SKIPPED (API DNS resolution error - see aldi_ie.py/lidl_ie.py for details)")`
    - Comment out the Aldi scraping block (lines 104-109) and replace with a print statement: `print("\n--- Aldi Ireland --- SKIPPED (API 403 Forbidden - see aldi_ie.py/lidl_ie.py for details)")`
    - Remove `lidl_prices` and `aldi_prices` from the total count on line 139: change to `total = len(tesco_prices) + len(supervalu_prices) + len(supervalu_sd_prices) + len(dunnes_prices)`
  - In `scripts/scrapers/aldi_ie.py`:
    - Add a docstring note at the top: `DISABLED: Aldi IE API returns 403 Forbidden (Akamai blocked). Do not remove this scraper — it may be re-enabled if an alternative API is found.`
  - In `scripts/scrapers/lidl_ie.py`:
    - Add a docstring note at the top: `DISABLED: Lidl IE API DNS resolution error (search.api.lidl.ie no longer resolves). Do not remove this scraper — it may be re-enabled if an alternative API is found.`

  **Must NOT do**:
  - Do NOT delete the Aldi or Lidl scraper files — they may be useful in the future
  - Do NOT change any other scraper files
  - Do NOT modify the GitHub Actions workflow

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Task 8 (needs correct scraper orchestrator)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `scripts/scrapers/run_scrapers.py:93-109` — Current Lidl and Aldi scraping blocks that need to be commented out.
  - `scripts/scrapers/run_scrapers.py:139` — Total count line that includes all 6 scrapers.

  **Why Each Reference Matters**:
  - `run_scrapers.py:93-109`: These are the exact lines to comment out with informative skip messages.
  - `aldi_ie.py` and `lidl_ie.py`: Need docstring notes explaining WHY they're disabled, so future developers don't waste time trying to enable them.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Aldi and Lidl scrapers are skipped with clear messages
    Tool: Bash (python3)
    Preconditions: Venv active at /tmp/scraper-venv, Supabase env vars NOT set (dry run)
    Steps:
      1. cd /home/feilim/Projects/Monster-App/monster-cork/scripts/scrapers
      2. python3 -c "from run_scrapers import main; print('import ok')" — must not crash on import
      3. grep -c "SKIPPED" scripts/scrapers/run_scrapers.py — must be >= 2
      4. grep -c "DISABLED" scripts/scrapers/aldi_ie.py — must be >= 1
      5. grep -c "DISABLED" scripts/scrapers/lidl_ie.py — must be >= 1
    Expected Result: All files have appropriate skip/disable markers and don't crash on import
    Failure Indicators: Import crashes, no SKIPPED/DISABLED markers found
    Evidence: .sisyphus/evidence/task-4-disabled-scrapers.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(scrapers): disable Aldi and Lidl scrapers with clear error messages`
  - Files: `scripts/scrapers/run_scrapers.py`, `scripts/scrapers/aldi_ie.py`, `scripts/scrapers/lidl_ie.py`

- [x] 5. Fix base.py regex, SuperValu same-store, and run_scrapers.py orchestrator

  **What to do**:
  - In `scripts/scrapers/base.py`:
    - Remove the overly aggressive `\b4\s*\.\s*` pattern from `_detect_pack_size()` (line 51). This pattern matches decimal prices like "4.99" as 4-packs, which is wrong.
  - In `scripts/scrapers/run_scrapers.py`:
    - Change the SuperValu Soft Drinks store name from `"SuperValu Ireland Soft Drinks (National)"` to `"SuperValu Ireland (National)"` so both SuperValu scrapers push prices to the SAME store entry (lines 127-130). This eliminates the duplicate store marker on the map.
    - Remove the second `get_or_create_store` call for SuperValu Soft Drinks (line 128) and reuse the `supervalu_store` variable from line 122.
    - Update the total count line to not double-count.

  **Must NOT do**:
  - Do NOT remove other regex patterns from `_detect_pack_size()` — they're still needed
  - Do NOT consolidate the two SuperValu scraper files into one
  - Do NOT change the X-Shopping-Mode UUID

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6 and 7, but depends on Task 1 for pack_size column)
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: Task 8 (needs correct base.py and run_scrapers.py)
  - **Blocked By**: Task 1 (pack_size column needed for product matching context)

  **References**:

  **Pattern References**:
  - `scripts/scrapers/base.py:39-53` — The `four_pack_patterns` list containing the aggressive `\b4\s*\.\s*` regex that needs removal.
  - `scripts/scrapers/run_scrapers.py:119-130` — The two SuperValu store creation blocks that need to be merged.

  **Why Each Reference Matters**:
  - `base.py:51`: The `\b4\s*\.\s*` pattern incorrectly matches prices like "4.99 EUR" as 4-packs.
  - `run_scrapers.py:127-130`: Creates a second store for SuperValu Soft Drinks, causing duplicate map markers at the same location.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Aggressive 4-pack regex removed from base.py
    Tool: Bash
    Steps:
      1. grep -n "4\\\\s\\*\\\\\\\\\\." scripts/scrapers/base.py — must return empty (pattern removed)
      2. grep -c "4_pack" scripts/scrapers/base.py — must still be >= 5 (other patterns intact)
    Expected Result: The `\b4\s*\.\s*` pattern is gone but other 4-pack detection still works
    Failure Indicators: Pattern still present, or other patterns accidentally removed
    Evidence: .sisyphus/evidence/task-5-regex-fix.txt

  Scenario: SuperValu uses same store entry for both scrapers
    Tool: Bash
    Steps:
      1. grep -n "SuperValu Ireland Soft Drinks" scripts/scrapers/run_scrapers.py — must return empty
      2. grep -n "supervalu_store" scripts/scrapers/run_scrapers.py — must appear at least 3 times (once created, twice used)
    Expected Result: Only one SuperValu store entry, both scrapers push to same store
    Failure Indicators: "Soft Drinks" store name still present, or supervalu_store not reused
    Evidence: .sisyphus/evidence/task-5-same-store.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `fix(scrapers): remove aggressive regex, unify SuperValu store entry`
  - Files: `scripts/scrapers/base.py`, `scripts/scrapers/run_scrapers.py`

- [x] 6. Data cleanup — delete mis-mapped scraper prices from database

  **What to do**:
  - Create a one-time cleanup script at `scripts/scrapers/cleanup_prices.py` that:
    - Connects to Supabase using `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` env vars
    - Deletes ALL rows from the `prices` table where `source='scraper'` (these are all mis-mapped to product #1)
    - Logs the number of deleted rows
    - Does NOT touch `source='user_upload'` rows (those are correct user submissions)
  - Add a comment explaining this is a ONE-TIME script to be run once after fixing product matching, then it can be deleted
  - The scrapers will re-populate correct data on their next run

  **Must NOT do**:
  - Do NOT delete user-uploaded prices (`source='user_upload'`)
  - Do NOT modify the products or stores tables
  - Do NOT add this to the daily scraper workflow

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5 and 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 8 (needs clean data before re-scraping)
  - **Blocked By**: Task 2 (product matching must be fixed first)

  **References**:

  **Pattern References**:
  - `scripts/scrapers/run_scrapers.py:14-16` — Supabase client creation pattern (env vars, create_client).

  **Why Each Reference Matters**:
  - `run_scrapers.py`: Shows the correct pattern for creating a Supabase client with env vars. The cleanup script should follow the same pattern.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Cleanup script exists and only deletes scraper-sourced prices
    Tool: Bash (python3 syntax check)
    Steps:
      1. python3 -m py_compile scripts/scrapers/cleanup_prices.py — must succeed
      2. grep "source.*scraper" scripts/scrapers/cleanup_prices.py — must find the filter
      3. grep "user_upload" scripts/scrapers/cleanup_prices.py — must NOT find user_upload deletion
      4. grep -c "ONE-TIME" scripts/scrapers/cleanup_prices.py — must be >= 1
    Expected Result: Script compiles, only deletes scraper-sourced prices, has ONE-TIME marker
    Failure Indicators: Syntax error, deletes user_upload rows, missing ONE-TIME comment
    Evidence: .sisyphus/evidence/task-6-cleanup-script.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `chore(scrapers): add one-time cleanup script for mis-mapped prices`
  - Files: `scripts/scrapers/cleanup_prices.py`

- [x] 7. Fix PriceCard null safety and remove storesWithDistance distance override

  **What to do**:
  - In `components/dashboard/PriceCard.tsx`:
    - Replace `price.stores!` with `price.stores ?? { name: 'Unknown', retailer: 'other', lat: 0, lng: 0, suburb: '', address: '' }` on line 29
    - Replace `price.products!` with `price.products ?? { name: 'Unknown Product', variant: 'unknown' }` on line 30
    - This prevents crash if joined data is missing
  - In `app/page.tsx`:
    - Fix the `storesWithDistance` computation (lines 72-78) to use `p.store_id` for matching instead of finding by price (the current logic `prices.find((p) => p.store_id === s.id)` is correct, but only works now that Task 3 adds `store_id` to the API response)
    - Fix the default radius in the stores API call (line 47): change `fetch(\`/api/stores?lat=${lat}&lng=${lng}&radius=${radius}\`)` — no change needed here since it already passes `radius` which defaults to 10km. But add a comment noting this uses DEFAULT_RADIUS_KM from constants.

  **Must NOT do**:
  - Do NOT remove the non-null assertions without providing fallback values
  - Do NOT change the distance calculation logic in PriceCard
  - Do NOT add new components or features

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5 and 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9 (needs fixed PriceCard for testing)
  - **Blocked By**: Task 3 (needs store_id in API response for page.tsx fix)

  **References**:

  **Pattern References**:
  - `components/dashboard/PriceCard.tsx:29-30` — The `price.stores!` and `price.products!` non-null assertions.
  - `app/page.tsx:72-78` — The `storesWithDistance` computation that uses `p.store_id`.
  - `app/api/stores/route.ts:12-15` — Default radius in stores API.

  **Why Each Reference Matters**:
  - `PriceCard.tsx:29-30`: These non-null assertions crash the page if the joined data is undefined. Must add fallback values.
  - `page.tsx:72-78`: This computation relies on `store_id` being in the price objects, which is only true after Task 3 adds it.
  - `stores/route.ts:12-15`: Shows the stores API also has a default radius inconsistency (50km) that should be noted.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: PriceCard renders without crash when stores/products are missing
    Tool: Bash (build check)
    Preconditions: Code changes made
    Steps:
      1. cd monster-cork && bun run build — must succeed
      2. grep -c "??" components/dashboard/PriceCard.tsx — must be >= 2 (null coalescing)
    Expected Result: Build compiles, PriceCard uses null coalescing instead of non-null assertions
    Failure Indicators: Build fails, or grep finds 0 null coalescing operators
    Evidence: .sisyphus/evidence/task-7-null-safety.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `fix(ui): add null safety to PriceCard, document default radius`
  - Files: `components/dashboard/PriceCard.tsx`, `app/page.tsx`

- [x] 8. Run scrapers end-to-end and verify correct product mapping

  **What to do**:
  - Run the environment setup and each scraper individually to verify they return data:
    1. `source /tmp/scraper-venv/bin/activate`
    2. `cd scripts/scrapers`
    3. `python3 -c "from tesco_ie import TescoIEScraper; import json; r=TescoIEScraper().scrape('monster energy', 'all'); print(json.dumps(r[:3], indent=2)); print(f'Total: {len(r)}')"`
    4. `python3 -c "from supervalu_ie import SuperValuIEScraper; import json; r=SuperValuIEScraper().scrape('monster', 'all'); print(json.dumps(r[:3], indent=2)); print(f'Total: {len(r)}')"`
    5. `python3 -c "from supervalu_softdrinks_ie import SuperValuSoftDrinksScraper; import json; r=SuperValuSoftDrinksScraper().scrape('monster', 'all'); print(json.dumps(r[:3], indent=2)); print(f'Total: {len(r)}')"`
    6. `python3 -c "from dunnes_ie import DunnesIEScraper; import json; r=DunnesIEScraper().scrape('monster', 'all'); print(json.dumps(r[:3], indent=2)); print(f'Total: {len(r)}')"`
  - Verify each scraper returns products with correct fields: `product_name`, `price`, `currency`, `retailer`
  - Run the cleanup script: `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python3 cleanup_prices.py`
  - Run all scrapers via `run_scrapers.py`: `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python3 run_scrapers.py`
  - Verify in Supabase that prices are mapped to CORRECT product variants (not all to product #1)
  - If any scraper fails, debug and fix the issue

  **Must NOT do**:
  - Do NOT enable Aldi or Lidl scrapers
  - Do NOT use plain `requests` for Tesco or Dunnes
  - Do NOT remove the 2s delay
  - Do NOT commit SUPABASE_SERVICE_KEY

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO — depends on Tasks 1, 2, 5 being complete
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10 (push to GitHub)
  - **Blocked By**: Tasks 1, 2, 5 (migrations, matching, base.py)

  **References**:

  **Pattern References**:
  - `scripts/scrapers/run_scrapers.py:93-144` — The main() function that orchestrates all scrapers.
  - `scripts/scrapers/AGENTS.md` — Conventions for running scrapers.

  **Why Each Reference Matters**:
  - `run_scrapers.py`: The orchestrator to verify. After our changes (Aldi/Lidl commented out, same SuperValu store, variant matching), this must run without crashes.
  - `AGENTS.md`: Contains the correct way to run scrapers and expected output format.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Each active scraper returns products with correct fields
    Tool: Bash (python3)
    Preconditions: Venv active, internet access, retailers not blocking
    Steps:
      1. Run each scraper (Tesco, SuperValu, SuperValu SoftDrinks, Dunnes)
      2. Verify each returns a list of dicts with: product_name, price, currency, retailer
      3. Verify price is a positive float (> 0, < 20 for single cans, < 30 for 4-packs)
      4. Verify currency is "EUR"
      5. Verify retailer matches the scraper name
    Expected Result: Each scraper returns >= 1 product with correct fields and reasonable prices
    Failure Indicators: Empty list, missing fields, prices > 30 EUR, currency != EUR
    Evidence: .sisyphus/evidence/task-8-scraper-output.txt

  Scenario: Prices are mapped to correct product variants in database
    Tool: Bash (Supabase query via python3)
    Preconditions: Scrapers have run and pushed data to Supabase
    Steps:
      1. Query Supabase: SELECT p.variant, COUNT(*) FROM prices pr JOIN products p ON pr.product_id = p.id WHERE pr.source='scraper' GROUP BY p.variant
      2. Verify that multiple variant categories have prices (not all mapped to zero_sugar)
      3. Verify that ultra_white has different prices than zero_sugar (not identical)
    Expected Result: Prices are distributed across variant categories, not all mapped to one product
    Failure Indicators: All prices under one variant, or ultra_white and zero_sugar have identical counts
    Evidence: .sisyphus/evidence/task-8-variant-mapping.txt
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `chore(scrapers): verify end-to-end scraper execution with variant mapping`
  - Files: Any fixes to scrapers discovered during testing

- [x] 9. Test frontend with Playwright — verify all filters and display

  **What to do**:
  - Start the Next.js dev server: `cd monster-cork && bun dev`
  - Open the app in browser and verify:
    1. Prices display on the default view (variant=zero_sugar, pack_size=all)
    2. Switching variant to "Ultra White" shows different prices (not the same as "Zero Sugar")
    3. Switching pack size to "4-Pack" shows products with pack_size='4_pack'
    4. Switching pack size to "Single Can" shows only single products
    5. Switching pack size back to "All Sizes" shows everything
    6. Store hover on price card highlights map marker
    7. Map shows store locations with correct distances
    8. No "No prices found" for single-can variant
  - Use Playwright to capture screenshots of each state as evidence
  - If any test fails, debug the issue and fix

  **Must NOT do**:
  - Do NOT add new features
  - Do NOT change the UI design
  - Do NOT modify the Supabase schema

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: [`/playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 10, after Task 8 data is in Supabase)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10 (needs verified frontend)
  - **Blocked By**: Tasks 3, 7 (API response fix + PriceCard fix), Task 6 (clean data)

  **References**:

  **Pattern References**:
  - `app/page.tsx:39-66` — The fetchData function that calls both APIs and updates state.
  - `components/dashboard/SortControls.tsx:58-68` — The pack size dropdown that triggers filtering.

  **Why Each Reference Matters**:
  - `page.tsx:39-66`: The main data fetching logic. If store_id isn't in the response, the map highlighting won't work.
  - `SortControls.tsx:58-68`: The dropdown UI that the user interacts with to switch pack size. Needs to actually filter results.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Variant filter shows different prices for different variants
    Tool: Playwright
    Preconditions: Dev server running, scrapers have pushed data
    Steps:
      1. Navigate to http://localhost:3000
      2. Screenshot the default view (zero_sugar)
      3. Note the prices shown
      4. Change variant dropdown to "Monster Ultra White"
      5. Wait for data load
      6. Screenshot the ultra_white view
      7. Compare prices — they should be different from step 3
    Expected Result: Different variants show different prices (not all mapped to same product)
    Failure Indicators: Ultra White shows same prices as Zero Sugar, or shows no prices
    Evidence: .sisyphus/evidence/task-9-variant-filter.png

  Scenario: Pack size filter shows 4-pack products when selected
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000
      2. Change pack size dropdown to "4-Pack"
      3. Wait for data load
      4. Screenshot the 4-pack view
      5. Change pack size to "Single Can"
      6. Wait for data load
      7. Screenshot the single view
      8. Change pack size to "All Sizes"
      9. Screenshot the all view
    Expected Result: 4-Pack shows only 4-pack products (not "No prices found"), Single shows only singles, All shows everything
    Failure Indicators: 4-Pack shows "No prices found", or shows single-can products
    Evidence: .sisyphus/evidence/task-9-pack-filter.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `test(ui): verify variant and pack size filters work correctly`
  - Files: Any fixes to frontend discovered during testing

- [x] 10. Push to GitHub and verify CI passes

  **What to do**:
  - Stage all changes and commit with a comprehensive message
  - Push to the main branch: `git push origin main`
  - Wait for GitHub Actions to complete the daily scraper workflow
  - Verify the production build passes: `bun run build`
  - If CI fails, fix the issue and push again

  **Must NOT do**:
  - Do NOT force-push
  - Do NOT modify .github/workflows/ except to fix the scraper workflow if needed

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`/git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO — final step after all other tasks
  - **Parallel Group**: Wave 3 (after Tasks 8 and 9)
  - **Blocks**: F1-F4 (final verification)
  - **Blocked By**: Tasks 8, 9 (all changes must be tested first)

  **References**:

  **Pattern References**:
  - `.github/workflows/scrape-daily.yml` — The daily scraper workflow.
  - `package.json` — Build and lint scripts.

  **Why Each Reference Matters**:
  - `scrape-daily.yml`: Needs to reflect the Aldi/Lidl scraper removal (commented out in run_scrapers.py).
  - `package.json`: Contains the build and lint commands that CI will run.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Production build compiles without errors
    Tool: Bash
    Steps:
      1. cd monster-cork && bun run build
      2. Verify exit code is 0
      3. Verify no TypeScript errors
    Expected Result: Build succeeds with zero errors
    Failure Indicators: TypeScript errors, build failures, missing imports
    Evidence: .sisyphus/evidence/task-10-build.txt

  Scenario: Git push succeeds and CI passes
    Tool: Bash
    Steps:
      1. git add -A && git commit -m "fix: scrapers and display — variant matching, pack size, API fixes"
      2. git push origin main
      3. Wait for GitHub Actions workflow to complete
      4. Verify workflow passes (or at least the scraper steps for Tesco/SuperValu/Dunnes)
    Expected Result: Push succeeds, CI passes (Aldi/Lidl steps will print SKIPPED messages)
    Failure Indicators: Push fails, CI fails, TypeScript build errors
    Evidence: .sisyphus/evidence/task-10-ci.txt
  ```

  **Commit**: YES
  - Message: `fix: scrapers and display — variant matching, pack size, API fixes, RLS policy`
  - Files: All modified files across all tasks

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + `bun run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (variant switching, pack size switching, map interaction). Test edge cases: empty state, invalid variant, pack_size=unknown. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `fix(scrapers): fix product matching, pack size, API response, RLS policy` — migration files, run_scrapers.py, route.ts, aldi_ie.py, lidl_ie.py
- **Wave 2**: `fix(scrapers): cleanup regex, same-store, null safety, data reset` — base.py, run_scrapers.py, PriceCard.tsx, page.tsx, data cleanup script
- **Wave 3**: `chore(scrapers): verify end-to-end and push` — verification evidence
- Each task within a wave is committed as part of the wave commit

---

## Success Criteria

### Verification Commands
```bash
# Build checks
cd monster-cork && bun run build     # Expected: compiles with zero errors
cd monster-cork && bun run lint       # Expected: no errors

# API checks (requires running dev server)
curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=all" | jq '.prices[0] | keys'
# Expected: includes "store_id", "product_id", "stores", "products"

curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=4_pack" | jq '.prices | length'
# Expected: > 0 (if 4-pack products exist in DB)

curl -s "http://localhost:3000/api/prices?variant=zero_sugar&pack_size=single" | jq '.prices | length'
# Expected: > 0

curl -s "http://localhost:3000/api/prices?variant=ultra_white" | jq '.prices | length'
# Expected: different count from zero_sugar (not all mapped to same product)

# Scraper checks (requires venv)
cd scripts/scrapers && source /tmp/scraper-venv/bin/activate
python3 -c "from tesco_ie import TescoIEScraper; s=TescoIEScraper(); r=s.scrape('monster white', 'all'); print(len(r), [x['product_name'] for x in r[:3]])"
# Expected: > 0 products with correct names

# Database checks (requires Supabase access)
# After data cleanup + re-scrape:
# zero_sugar products should NOT have ultra_white prices, and vice versa
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build passes with zero errors
- [ ] Each variant shows only its own prices
- [ ] "4-Pack" filter returns results (not zero)
- [ ] "Single Can" filter returns only singles
- [ ] API response includes store_id and product_id
- [ ] Map hover-highlight works
- [ ] User price upload for new stores succeeds (201)
- [ ] Aldi/Lidl scrapers are commented out with error messages