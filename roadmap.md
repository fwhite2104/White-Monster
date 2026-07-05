# Monster Cork — Agile Recovery Roadmap
> Generated: July 2026 | Stack: Next.js 16, React 19, TypeScript, Supabase/PostgreSQL+PostGIS, Python scrapers, GitHub Actions, Vercel
> Methodology: Agile sprints — tackle environment first, then backend stability, then frontend fixes, then polish.
> **How to use this file:** Work through each Sprint in order. Copy the prompt block for each task and paste it directly into opencode. Complete and verify each task before moving to the next.

---

## Table of Contents
1. [Sprint 0 — Agent Environment Cleanup](#sprint-0)
2. [Sprint 1 — Backend Investigation & Stability](#sprint-1)
3. [Sprint 2 — Desktop/Laptop Bug Fixes](#sprint-2)
4. [Sprint 3 — Mobile UI/UX Fixes](#sprint-3)
5. [Sprint 4 — Barcode Scanner (Cross-Platform)](#sprint-4)
6. [Sprint 5 — Regression & Cleanup](#sprint-5)

---

## Priority Order Rationale
Fix the dev environment **first** — a messy agent setup with 12 MCP servers wastes tokens and produces noisy, unreliable AI assistance. Once the environment is clean, investigate backend data issues before touching the frontend, because stale/missing data would make frontend bugs impossible to reproduce accurately. Desktop location and data freshness come next (core UX loop), followed by mobile UI polish, and finally the barcode scanner (most complex, camera API + library).

---

---

# Sprint 0 — Agent Environment Cleanup {#sprint-0}
**Goal:** Reduce opencode MCP overhead, remove stale tooling, establish a clean agentic dev baseline.
**Acceptance criteria:** opencode runs with ≤4 MCP servers; no stale global tool configs; project has a single, documented tooling manifest.

---

## Task 0.1 — Audit & Trim MCP Servers

### Context
You are currently running 12 MCP servers in opencode which consume tokens on every prompt. Most are either unknown, unused, or redundant for this Next.js/Supabase project. The goal is to reduce to only what is actively needed.

### Prompt for opencode:
```
TASK: Audit and trim the opencode MCP server configuration for this project.

CONTEXT:
This is a Next.js 16 / Supabase / Python scraper project called Monster Cork. The current opencode MCP config has 12 servers enabled:
- ast_grep
- codegraph
- context7
- ecc: chrome-devtools
- firecrawl-mcp
- grep-app
- headroom
- lsp
- obsidian
- openspace
- supabase
- websearch

INSTRUCTIONS:
1. Locate the opencode MCP configuration file (likely ~/.config/opencode/config.json or opencode.json in project root or home dir — check both).
2. Print the full current contents of the config file so I can review it.
3. For each of the 12 servers, output a one-line explanation of what it does and whether it is needed for a Next.js/Supabase/Python project.
4. Produce a revised config that keeps ONLY:
   - supabase (database access)
   - context7 (up-to-date library docs — useful for Next.js/React/Supabase)
   - websearch (general research)
   - lsp (code intelligence — keep if it is the project LSP, remove if it is a separate heavy server)
   Remove all others.
5. Write the revised config back to the correct file location.
6. Do NOT remove any project source files — this is config only.
7. Confirm the final server list after writing.
8. You have access to hidden files.

OUTPUT: Print before/after server lists and the path of the file that was modified.
```

---

## Task 0.2 — Audit & Remove Stale Global/Local Tool Configs

### Context
The project has accumulated stale config files for tools like Playwright (configured but possibly unused for local dev), globally installed packages, and per-directory tool installs that conflict. This task identifies and cleans them.

### Prompt for opencode:
```
TASK: Audit and clean up stale tooling configs in the Monster Cork project.

CONTEXT:
The project has playwright.config.ts, vitest.config.ts, and potentially other tool configs. There may also be globally installed packages and per-directory installs that are conflicting or unused.

INSTRUCTIONS:
1. List all config files in the project root and any subdirectories that relate to testing/tooling:
   - playwright.config.ts
   - vitest.config.ts
   - .eslintrc* / eslint.config.mjs
   - Any .tool-versions, .nvmrc, .node-version, .python-version files
   - Any jest.config.*, babel.config.*, or other test runner configs that should NOT be here given we use Vitest
2. Run: `bun pm ls` (or `bun list`) to show installed packages and flag any that appear unused or duplicated
3. Check for any scripts/ subdirectory package.json or requirements.txt files beyond the main one at scripts/scrapers/requirements.txt
4. Check for any globally installed conflicting packages: `bun pm ls -g 2>/dev/null || npm ls -g --depth=0 2>/dev/null`
5. For each stale item found, ask me to confirm before deleting. List them all first, then wait.
6. After my confirmation, remove confirmed stale items.
7. Ensure playwright.config.ts is correct for the e2e/ test directory and that `bun test:e2e` still resolves properly after cleanup.

OUTPUT: A table of found items with columns: File/Package | Status (Keep/Stale/Confirm) | Reason
```

---

## Task 0.3 — Document the Clean Dev Environment

### Context
After cleanup, create a single source of truth for the development environment so future sessions start clean.

### Prompt for opencode:
```
TASK: Create a DEV_ENVIRONMENT.md file documenting the current clean development setup.

INSTRUCTIONS:
1. Create a new file at the project root called DEV_ENVIRONMENT.md
2. It must contain the following sections:
   a. **Required Tools** — bun version, node version, python version, supabase CLI version if used
   b. **opencode MCP Servers** — list the servers that are now active after Task 0.1 cleanup, with one sentence on why each is kept
   c. **Test Commands** — `bun test` (vitest unit), `bun test:e2e` (playwright), how to run individual scrapers locally
   d. **Environment Variables** — list all variables from .env.example or README, noting which are required vs optional
   e. **Known Tool Conflicts** — any notes from the audit in Task 0.2 about things to avoid re-installing
3. Keep it concise — this is a reference doc, not a tutorial.
4. Do not duplicate content that is already in README.md verbatim; cross-reference it instead.

OUTPUT: Confirm file created and print its contents.
```

---

---

# Sprint 1 — Backend Investigation & Stability {#sprint-1}
**Goal:** Confirm scraper health, diagnose why packs >4 cans are not appearing, and ensure community-reported prices are flowing correctly.
**Acceptance criteria:** Scrapers run without errors; pack sizes beyond 4-pack are either confirmed unsupported (and documented) or fixed; reported prices appear in query results.

---

## Task 1.1 — Scraper Health Audit

### Context
Scrapers run daily via GitHub Actions at 06:00 UTC. It is unknown whether they are currently failing silently, hitting rate limits, or producing stale data. This task audits the last run and the scraper code itself.

### Prompt for opencode:
```
TASK: Audit the health of all Python scrapers in scripts/scrapers/.

CONTEXT:
Scrapers: aldi_ie.py, lidl_ie.py, tesco_ie.py, dunnes_ie.py, supervalu_ie.py, supervalu_softdrinks_ie.py, centra_ie.py, firecrawl_ie.py
Orchestrator: run_scrapers.py
Base class: base.py
GitHub Actions workflow: .github/workflows/scrape-daily.yml

INSTRUCTIONS:
1. Read and summarise base.py — what retry logic, rate limiting, and error handling does it implement?
2. Read run_scrapers.py — how does it invoke scrapers? Does it catch per-scraper failures? Does it log results?
3. For each individual scraper file, check:
   a. What URL/API endpoint does it target?
   b. Does it search for "monster" / "Monster Energy" specifically or broadly?
   c. What pack sizes does it look for? (single, 4-pack, any others?)
   d. Does it validate the product name against the 17 known variants in lib/constants.ts?
   e. Are there any hardcoded selectors (CSS/XPath) that look fragile or outdated?
4. Check scripts/scrapers/diagnose_dunnes.py — what does it report about Dunnes?
5. Check cleanup_prices.py — what does it clean up and on what schedule?
6. Open .github/workflows/scrape-daily.yml and confirm:
   a. The cron schedule
   b. Which secrets it uses
   c. Whether it reports failures (e.g. Slack/email notification on failure)
7. Produce a health summary table: Scraper | Target | Pack Sizes Captured | Fragility Risk | Notes

OUTPUT: The health summary table plus any urgent issues flagged inline.
```

---

## Task 1.2 — Diagnose Missing Pack Sizes (>4 Cans)

### Context
No packs over 4 cans are being reported or caught by scrapers. Monster Energy sells larger multipacks (e.g. 12-pack, 24-pack) at some Irish retailers (notably Costco-style stores or online). This needs investigation at both the database schema and scraper levels.

### Prompt for opencode:
```
TASK: Investigate why packs larger than 4 cans are absent from the app and fix or document the gap.

CONTEXT:
The app currently supports pack_size values of "single" and "4_pack" (see lib/constants.ts and migration 004_add_pack_size.sql).
The issue: no packs over 4 cans are being reported by scrapers OR by users.

INSTRUCTIONS:
1. Open lib/constants.ts and find the PACK_SIZES or equivalent constant. List all allowed pack_size values.
2. Open supabase/migrations/004_add_pack_size.sql — what does the CHECK constraint on pack_size allow?
3. Check the API route app/api/prices/route.ts:
   a. What pack_size values are accepted in GET params?
   b. Does the validation in lib/validate.ts restrict pack_size to an enum?
4. Check each scraper in scripts/scrapers/ for any logic that would ignore or skip items with pack sizes other than "single" or "4_pack".
5. Check the POST /api/prices submission handler — does it validate/reject pack sizes beyond "4_pack"?
6. Check components/dashboard/FilterDrawer.tsx and components/dashboard/StoreUploadForm.tsx — are pack sizes beyond "4_pack" available in the UI dropdowns?

FINDINGS → DECISION TREE:
- If the schema CHECK constraint blocks larger packs: write a new Supabase migration to add "12_pack" and "24_pack" to the enum (or convert to a free-text validated field), AND update lib/constants.ts, lib/validate.ts, FilterDrawer.tsx, and StoreUploadForm.tsx consistently.
- If scrapers are filtering them out: update each scraper to capture them and map them to the correct pack_size value.
- If the UI simply doesn't offer them as options: add them to the dropdown without schema changes.
- If larger packs genuinely do not exist at tracked retailers: add a comment in lib/constants.ts documenting this decision and close the issue.

Apply whichever fixes are appropriate. Write a migration if schema changes are needed.

OUTPUT: A summary of root cause + list of files changed + migration name if applicable.
```

---

## Task 1.3 — Investigate Community Reported Prices Pipeline

### Context
Community-reported prices are submitted via POST /api/prices, stored in user_prices, and should override scraper prices in query results. It is unconfirmed whether this pipeline is functioning correctly end-to-end.

### Prompt for opencode:
```
TASK: End-to-end audit of the community price reporting pipeline.

CONTEXT:
Flow: User submits price → POST /api/prices → user_prices table (7-day expiry) → GET /api/prices merges user_prices with scraper prices (lowest price per store+product wins, user_reported preferred).

INSTRUCTIONS:
1. Read app/api/prices/route.ts fully — trace both the POST handler and GET handler.
   In GET: find where mergeUserPrices() or equivalent is called. Confirm user_prices are included.
   In POST: confirm the store upsert logic, the expires_at calculation, and the rate limit check.
2. Read lib/prices.ts — review mergeUserPrices() and expandNationalPrices(). 
   Does mergeUserPrices correctly prefer user_reported over scraper data?
   Does it filter out expired rows (expires_at < now)?
3. Check the RLS policies on user_prices (look in supabase/migrations/ for the relevant migration).
   Can the anon key INSERT into user_prices? Can it SELECT unexpired rows?
4. Check lib/rate-limit.ts — does checkRateLimitDB work without auth? What happens if the rate_limits table is unreachable?
5. Identify any bugs or gaps in the above. Fix any confirmed bugs.
6. Write a simple SQL test query (do NOT run it, just print it) that I can paste into the Supabase SQL editor to verify user_prices are being stored and returned correctly:
   SELECT * FROM user_prices WHERE expires_at > now() ORDER BY created_at DESC LIMIT 10;

OUTPUT: Bug list (or "no bugs found") + any fixed files + the SQL test query.
```

---

## Task 1.4 — Verify Data Freshness & Health Endpoint

### Context
The /api/health endpoint tracks data freshness and prevents Supabase free-tier pausing. Data staleness has been flagged as a potential issue.

### Prompt for opencode:
```
TASK: Audit the /api/health endpoint and verify data freshness logic is correct.

INSTRUCTIONS:
1. Read app/api/health/route.ts fully.
   a. How does it determine "fresh" vs "stale" vs "outdated"? (thresholds: fresh <48h, stale <7d, outdated >7d)
   b. Does it query the prices table or price_history table for the latest updated_at?
   c. Is the Supabase keep-alive ping (to prevent free-tier pausing) implemented here? How?
2. Check .github/workflows/ for any cron that calls /api/health as a keep-alive. If missing, note it.
3. Verify the Vercel cron config (vercel.json if it exists, or next.config.ts) — is there a scheduled invocation of /api/health?
4. If data freshness is reporting stale when scrapers are running:
   a. Check whether scraper upserts update the updated_at column on the prices table.
   b. Check migration 001 or the prices table DDL for an updated_at column with a trigger or default.
5. Fix any identified freshness tracking bugs.
6. If no Vercel cron or GitHub Actions keep-alive exists, create one:
   - Add a GitHub Actions workflow .github/workflows/keepalive.yml that calls GET /api/health every 3 days using curl with the Vercel deployment URL stored as a repository secret VERCEL_APP_URL.

OUTPUT: Freshness logic summary + list of fixes applied + keepalive workflow created (or confirmed existing).
```

---

---

# Sprint 2 — Desktop/Laptop Bug Fixes {#sprint-2}
**Goal:** Fix geolocation permission flow on desktop and ensure data is not perceived as stale by users.
**Acceptance criteria:** Desktop users see a proper browser permission prompt; after declining, a clear manual fallback is shown immediately; data freshness indicator is accurate.

---

## Task 2.1 — Fix Geolocation Permission Flow on Desktop

### Context
On desktop/laptop, location permission is declined with no prompt showing — meaning the browser either silently denies it or the app is calling the Geolocation API in a way that doesn't trigger the browser's native permission dialog. The hook is in hooks/use-geolocation.ts.

### Prompt for opencode:
```
TASK: Fix the desktop geolocation permission flow so the browser prompt always appears and denial is handled gracefully.

CONTEXT:
The geolocation hook is at hooks/use-geolocation.ts. The onboarding screen is components/dashboard/FirstVisitScreen.tsx. The "denied" state screen is in components/dashboard/StateScreens.tsx.

INSTRUCTIONS:
1. Read hooks/use-geolocation.ts fully. Answer:
   a. Is navigator.geolocation.getCurrentPosition() called on mount automatically, or only on user action?
   b. Is the Permissions API (navigator.permissions.query({ name: "geolocation" })) being used to pre-check status before calling getCurrentPosition? (This is the likely culprit — if the permission is "prompt" but the code checks first and miscategorises it, the prompt never fires.)
   c. What happens when the user denies? Does it set a "denied" state? Is that state persisted to localStorage?
   d. Is there any catch block that swallows the GeolocationPositionError silently?

2. Known desktop-specific issues to check:
   a. Some browsers on desktop will not show a permission prompt if the page is not served over HTTPS. Confirm the dev server uses localhost (which is treated as secure). Note this in a comment.
   b. The Permissions API `.query()` result can be "prompt", "granted", or "denied". If the code calls `.query()` and then calls `getCurrentPosition()` only if the result is "granted", it will never trigger the prompt. Fix this: `getCurrentPosition()` should ALWAYS be called when the intent is to request location — the browser handles the prompt itself.
   c. Check if there is a cached "denied" state in localStorage that is preventing re-prompting. If so, add a "Reset location permission" button to the denied state screen.

3. Fix the hook so that:
   - On first visit (no cached state), `getCurrentPosition()` is called on user action (clicking "Use my location" in FirstVisitScreen), NOT on mount.
   - On subsequent visits, cached coords from localStorage are used immediately, with a background refresh.
   - On denial: set state to "denied", show StateScreens denied variant, AND show a manual location search input as fallback.
   - On timeout (>10 seconds): show timeout state with manual fallback.

4. Update StateScreens.tsx denied variant to include:
   - Clear message: "Location access was declined. Search for your area manually below."
   - The manual location search input (reuse existing LocationBanner or SearchBar component).
   - A small help text: "To re-enable, click the lock icon in your browser's address bar."

5. Ensure the fix works in both Chromium (desktop) and Firefox desktop.

OUTPUT: List of files modified + a brief description of the root cause found.
```

---

## Task 2.2 — Fix Data Staleness UX on Desktop

### Context
Users on desktop may see stale data without any clear indication. The /api/health endpoint tracks freshness but it is unclear if this information is surfaced in the UI.

### Prompt for opencode:
```
TASK: Ensure data staleness is clearly communicated to desktop users and that stale data triggers a visible, non-intrusive warning.

CONTEXT:
Health endpoint: GET /api/health — returns { status, freshness: "fresh"|"stale"|"outdated", lastUpdated, responseTime }
The app uses hooks/use-price-query.ts for data fetching.

INSTRUCTIONS:
1. Read hooks/use-price-query.ts — does it fetch from /api/health or include a freshness field in the price response?
2. Read app/api/prices/route.ts GET handler — does the response include a data_freshness or last_updated field?
3. Check if any existing component displays data freshness (search for "stale", "fresh", "lastUpdated", "data freshness" in components/).

IF NO FRESHNESS INDICATOR EXISTS in the UI:
4. Add a data freshness indicator:
   a. In app/api/prices/route.ts GET, add a last_scraped_at field to the response by querying: SELECT MAX(updated_at) FROM prices WHERE source = 'scraper'
   b. In hooks/use-price-query.ts, expose lastScrapedAt from the hook return value.
   c. In components/dashboard/LocationBanner.tsx (or create a small DataFreshnessChip.tsx component), show:
      - If fresh (<48h): nothing (no UI noise)
      - If stale (48h–7d): a small amber chip "Prices may be outdated · Last updated X days ago"
      - If outdated (>7d): a red chip "Price data is outdated · Last updated X days ago" with a link to /api/health for debugging

5. The chip should be subtle — small font, muted styling, placed below the location banner, not in the main content area.
6. Do not add a loading spinner or skeleton for this — it can render after the main data loads.

OUTPUT: Files modified + screenshot-description of what the new UI element looks like.
```

---

---

# Sprint 3 — Mobile UI/UX Fixes {#sprint-3}
**Goal:** Fix UI/UX issues on the deals page on mobile.
**Acceptance criteria:** The deals page renders correctly on small screens (375px–430px viewport); no horizontal overflow; touch targets ≥44px; deal cards are readable.

---

## Task 3.1 — Audit Mobile Deals Page

### Context
The deals page has unspecified UI/UX issues on mobile. Before fixing, we need to know exactly what is broken.

### Prompt for opencode:
```
TASK: Audit the mobile UI/UX of the deals page and produce a fix list.

CONTEXT:
The deals tab renders via the "Deals" tab in the bottom nav (BottomTabNav.tsx). The relevant components are:
- components/dashboard/WeeklyDealsBanner.tsx
- components/dashboard/DealCard.tsx
- components/dashboard/DealBadge.tsx  
- components/dashboard/DealExpiryTimer.tsx
- components/dashboard/ItemComparisonView.tsx (may be the deals comparison view)

INSTRUCTIONS:
1. Read each of the above components. For each, note:
   a. Does it use fixed pixel widths that would overflow on mobile (375px)?
   b. Are flex/grid layouts set to nowrap where they should wrap?
   c. Are touch targets (buttons, links) at least 44px tall?
   d. Is text truncated correctly with ellipsis, or does it overflow?
   e. Are images or icons sized with fixed px values that break on small screens?

2. Check app/page.tsx or the main dashboard component — how is the deals tab/panel conditionally rendered? Is it inside a container with overflow:hidden that might clip content?

3. Check globals.css for any mobile-breakpoint overrides relevant to deal cards.

4. List ALL identified issues in a table: Component | Issue | Severity (High/Med/Low) | Suggested Fix

5. Then apply fixes for all High and Medium severity issues:
   - Replace fixed widths with responsive equivalents (w-full, max-w-*, min-w-0)
   - Add flex-wrap where needed
   - Ensure min-h-[44px] on all interactive elements
   - Use truncate or line-clamp-2 for overflowing text
   - Replace any px-based responsive logic with Tailwind sm:/md: breakpoints

6. After fixing, describe what a deals card looks like at 375px width.

OUTPUT: Issue table + list of files modified + description of final mobile layout.
```

---

## Task 3.2 — Mobile Navigation & General UX Pass

### Context
While fixing the deals page, do a broader mobile UX pass to catch any other obvious issues in the bottom nav or tab transitions.

### Prompt for opencode:
```
TASK: Perform a mobile UX pass on BottomTabNav and tab transitions.

CONTEXT:
The app uses a bottom tab navigation bar for mobile (components/dashboard/BottomTabNav.tsx) with tabs: List, Deals, Stores (map), Search.

INSTRUCTIONS:
1. Read BottomTabNav.tsx:
   a. Is it fixed to the bottom of the viewport (position: fixed, bottom: 0)?
   b. Does the main content area have padding-bottom to prevent content being hidden behind the nav bar?
   c. Are tab icons and labels readable at small sizes?
   d. Is the active tab clearly distinguished?

2. Check that the main content scroll container (likely in app/page.tsx) has `pb-20` or equivalent to clear the bottom nav.

3. Check framer-motion tab transition animations — do they cause layout shift or overflow on mobile? If so, add `overflow-x: hidden` to the tab container.

4. Check the Search tab (if it exists as a component) — does the search input auto-focus on mobile? If so, disable autofocus on mobile to prevent the keyboard from immediately pushing layout up.

5. Fix any issues found. Keep changes minimal — this is a polish pass, not a redesign.

OUTPUT: List of issues found + files modified.
```

---

---

# Sprint 4 — Barcode Scanner (Cross-Platform) {#sprint-4}
**Goal:** Restore barcode scanner functionality on both desktop (camera unavailable) and mobile (not working).
**Acceptance criteria:** Desktop shows a clear "camera not available" fallback; mobile camera scanner opens, scans a barcode, and returns the correct Monster variant.

---

## Task 4.1 — Diagnose Barcode Scanner Failures

### Context
The barcode scanner uses html5-qrcode. On desktop it fails silently (camera unavailable), and on mobile it simply does not work. This task diagnoses before fixing.

### Prompt for opencode:
```
TASK: Diagnose barcode scanner failures on desktop and mobile.

CONTEXT:
Barcode scanner components:
- components/dashboard/ScanButton.tsx (FAB trigger)
- components/dashboard/BarcodeScanner.tsx (html5-qrcode implementation)
- components/dashboard/ScanResult.tsx (result overlay)
Library: html5-qrcode (check package.json for version)

INSTRUCTIONS:
1. Read BarcodeScanner.tsx fully. Answer:
   a. Which html5-qrcode API is used — Html5QrcodeScanner (renders its own UI) or Html5Qrcode (programmatic)?
   b. How is the camera started? Is getUserMedia called directly or via the library?
   c. Is there error handling for when the camera is not available (NotAllowedError, NotFoundError, NotReadableError)?
   d. Is the component wrapped in a try/catch or does it use the library's error callback?
   e. Is the component using useEffect with proper cleanup (stop scanning on unmount)?
   f. Is this component dynamically imported with `ssr: false`? (Required — html5-qrcode cannot run server-side)

2. Read ScanButton.tsx — how does it trigger BarcodeScanner? Is it a modal, a full-screen overlay, or inline?

3. Read ScanResult.tsx — how does it receive the scan result? Is it via a callback prop, context, or state in parent?

4. Check package.json for the html5-qrcode version. Note: html5-qrcode has known issues on iOS Safari with certain versions and requires specific camera constraints.

5. Check if there is a CSP header in middleware.ts that blocks camera access or media device APIs.

6. Produce a diagnostic report:
   - Desktop issue: likely root cause
   - Mobile issue: likely root cause
   - html5-qrcode version: current vs recommended
   - CSP issue: yes/no

OUTPUT: Diagnostic report only. Do NOT apply fixes yet — that is the next task.
```

---

## Task 4.2 — Fix Desktop Barcode Scanner (Graceful Fallback)

### Context
On desktop, the camera is genuinely unavailable (no webcam, or permission denied). The fix is not to force camera access but to show a clean, helpful fallback UI — a manual variant selector or barcode number input.

### Prompt for opencode:
```
TASK: Implement a graceful desktop fallback for the barcode scanner.

CONTEXT:
On desktop, camera access may be unavailable. Rather than showing a broken scanner, show a manual lookup fallback.

INSTRUCTIONS:
1. In BarcodeScanner.tsx, wrap the camera initialisation in a try/catch and handle these specific error types:
   - NotAllowedError → user denied camera permission
   - NotFoundError → no camera hardware found
   - NotReadableError → camera is in use by another app
   - OverconstrainedError → camera constraints not satisfiable

2. For all of the above errors, instead of showing a blank/broken UI, render a fallback panel:
   - A message: "Camera not available on this device."
   - A dropdown select of all 17 Monster variants (use the MONSTER_VARIANTS constant from lib/constants.ts)
   - A "Find prices for this variant" button that calls the same onScanResult callback that a successful scan would call
   - Optionally: a text input for manual barcode entry (EAN-13) with a lookup button

3. The fallback should be styled consistently with the rest of the app (dark theme, green accent, shadcn Select component).

4. Ensure the fallback is also shown if the browser does not support getUserMedia at all (check `!navigator.mediaDevices` guard).

5. Update ScanButton.tsx if needed to ensure the scanner modal/overlay has a proper close button (X) that is reachable by keyboard (Escape key).

OUTPUT: Files modified + description of the fallback UI.
```

---

## Task 4.3 — Fix Mobile Barcode Scanner

### Context
On mobile the scanner simply does not work. Common causes: incorrect camera facing mode (front vs rear), iOS Safari requiring specific constraints, html5-qrcode version bugs, or CSP blocking.

### Prompt for opencode:
```
TASK: Fix the mobile barcode scanner so it opens and successfully scans Monster can barcodes.

CONTEXT:
Monster Energy cans use EAN-13 barcodes. The scanner must use the rear camera on mobile. Library: html5-qrcode.

INSTRUCTIONS:
1. Based on the diagnostic from Task 4.1, apply the relevant fixes:

   a. Camera facing mode: Ensure the scanner requests the rear (environment) camera:
      Use: { facingMode: { exact: "environment" } } as camera constraints.
      Fallback to { facingMode: "environment" } if "exact" fails (some devices don't support exact).

   b. html5-qrcode version: If the current version is below 2.3.8, update it:
      Run: bun add html5-qrcode@latest
      Check the changelog for iOS Safari fixes.

   c. iOS Safari specific: html5-qrcode on iOS requires the video element to have `playsinline` attribute.
      Check if the library version in use sets this. If not, after the scanner initialises, find the video element in the DOM and add the attribute: 
      document.querySelector("#qr-video")?.setAttribute("playsinline", "true")
      Do this inside a useEffect after the scanner starts.

   d. CSP fix: In middleware.ts, check the Content-Security-Policy header for:
      - media-src directive — must include 'self' and blob: to allow camera streams
      - If missing: add `media-src 'self' blob:;` to the CSP string

   e. Cleanup: Ensure the scanner is properly stopped on component unmount using the html5-qrcode stop() method in the useEffect cleanup function. Failure to stop causes "camera in use" errors on re-open.

2. After the scan succeeds, the result (EAN-13 barcode string) must be looked up against the products table.
   Check: is there a barcode lookup function that maps EAN-13 → Monster variant slug? 
   If not, create one in lib/products.ts:
   - Fetch products from Supabase where barcode = scannedCode
   - Return the variant slug
   - If no match: show a "Barcode not recognised — please select variant manually" message with the fallback UI from Task 4.2

3. Test the full flow mentally: scan → EAN lookup → variant slug → prices fetch with that variant.

OUTPUT: Files modified + list of specific fixes applied per platform issue.
```

---

---

# Sprint 5 — Regression & Cleanup {#sprint-5}
**Goal:** Verify all fixes work together, run tests, and update documentation.
**Acceptance criteria:** Unit tests pass; E2E tests pass (or are updated); README Known Gaps section is updated.

---

## Task 5.1 — Run Tests & Fix Regressions

### Prompt for opencode:
```
TASK: Run all tests and fix any regressions introduced by previous sprint fixes.

INSTRUCTIONS:
1. Run unit tests: `bun test` — fix any failures.
2. Run E2E tests: `bun test:e2e` in headless mode.
   - If e2e/barcode-scanner.spec.ts fails because it tries to use a real camera, mock the camera in the test using Playwright's page.route() or fake media devices.
   - If e2e/price-list.spec.ts fails due to geolocation changes, update the test to mock geolocation: use Playwright's context.grantPermissions(["geolocation"]) and context.setGeolocation({ latitude: 51.8985, longitude: -8.4756 }) (Cork city center).
3. Run `bun run lint` and fix any ESLint errors (warnings are acceptable, errors are not).
4. Run `bun run build` — confirm the production build succeeds with no TypeScript errors.

OUTPUT: Test results summary + list of any fixes applied.
```

---

## Task 5.2 — Update README Known Gaps

### Prompt for opencode:
```
TASK: Update the README.md Known Gaps section to reflect the current state after all sprint fixes.

INSTRUCTIONS:
1. Read the current README.md Known Gaps section.
2. Remove or update any gaps that were fixed in this sprint cycle:
   - Geolocation desktop prompt issue (fixed in Sprint 2)
   - Data staleness UX (fixed in Sprint 2)
   - Barcode scanner mobile/desktop (fixed in Sprint 4)
   - Pack sizes >4 cans (fixed or documented in Sprint 1)
3. Add any NEW known gaps identified during the sprint but not yet fixed.
4. Keep the section honest and current — it is useful for future contributors.

OUTPUT: The updated Known Gaps section (diff format or full rewrite).
```

---

## Task 5.3 — Final Supabase Security Check

### Prompt for opencode:
```
TASK: Run a final security and performance check on the Supabase project.

INSTRUCTIONS:
1. Using the Supabase MCP tool, run get_advisors for both "security" and "performance" advisory types on the project.
2. For each advisory returned, assess severity and whether it is actionable now.
3. For any HIGH severity security advisories: apply the recommended fix immediately.
4. For MEDIUM/LOW: document them in a new section of DEV_ENVIRONMENT.md called "## Supabase Advisories (pending)".
5. Check that all tables modified in this sprint (user_prices, prices, products) still have correct RLS policies.

OUTPUT: Advisory list with severity + actions taken or deferred.
```

---

---

## Sprint Velocity Guide

| Sprint | Estimated Sessions | Complexity |
|--------|-------------------|------------|
| Sprint 0 — Env Cleanup | 1–2 | Low |
| Sprint 1 — Backend | 3–4 | High |
| Sprint 2 — Desktop Bugs | 2 | Medium |
| Sprint 3 — Mobile UI | 1–2 | Medium |
| Sprint 4 — Barcode Scanner | 3 | High |
| Sprint 5 — Regression | 1–2 | Low |

**Recommended session order:** Complete each task fully before starting the next. Do not run Sprint 4 before Sprint 0 — the extra MCP servers will burn tokens unnecessarily during the complex scanner debugging sessions.

---

*This roadmap was generated for the Monster Cork project (Next.js 16 / Supabase / Python scrapers). Last updated: July 2026.*
