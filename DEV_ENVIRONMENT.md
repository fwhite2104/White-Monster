# DEV_ENVIRONMENT.md — Monster Cork

> Single source of truth for the development environment. Cross-references README.md for project docs.

## Required Tools

| Tool | Version (local) | Version (CI) | Notes |
|---|---|---|---|
| **Bun** | 1.3.14 | `oven-sh/setup-bun@v2` | Package manager, runtime, test runner. `bun install` / `bun dev` |
| **Node.js** | 26.3.0 | GitHub Actions (setup-bun includes Node) | Managed via `packageManager: bun@1.2.15` in package.json |
| **Python** | 3.14.4 | 3.11 (`.github/workflows/scrape-daily.yml`) | Only needed for scrapers in `scripts/scrapers/` |
| **TypeScript** | 5.9.3 (local) 6.0.3 (global) | CI runs `npx tsc --noEmit` (local) | Keep local and global in sync — see conflicts below |
| **Supabase CLI** | not installed locally | N/A | DB migrations managed via MCP or manual SQL |

## OpenCode MCP Servers (active after cleanup)

All configured in `~/.config/opencode/` — no project-level overrides.

| MCP Server | Config source | Why kept |
|---|---|---|
| **supabase** (remote) | `~/.config/opencode/opencode.jsonc` | Direct DB introspection, migrations, and queries against the Supabase project |
| **context7** (built-in) | `~/.config/opencode/opencode.json` | Up-to-date library/framework docs (Next.js, Tailwind, shadcn) |
| **websearch** (built-in) | `~/.config/opencode/opencode.json` | Web search for external reference during development |

> **Note:** `codegraph`, `obsidian`, `openspace`, `ast_grep`, `headroom`, `firecrawl-mcp` are **not** enabled in the active config. They may be referenced in older documentation but are not currently running.

## Test Commands

| Command | Framework | Scope | Notes |
|---|---|---|---|
| `bun test` | Vitest v4 | Unit tests (`lib/__tests__/`) | Uses `bunfig.toml` to exclude `e2e/` |
| `bun test:watch` | Vitest v4 | Same, watch mode | |
| `bun test:e2e` | Playwright v1.60 | E2E tests (`e2e/`) | Requires `bun run build && bun run start` (or CI webServer config) |
| `bun test:e2e:ui` | Playwright v1.60 | Same, UI mode | Opens Playwright inspector |
| `bun run lint` | ESLint v9 | All `.ts/.tsx` | Uses `eslint.config.mjs` (flat config) |
| `bun run build` | Next.js 16 | Production build | Runs TypeScript check + Turbopack |

### Scrapers (Python)

```bash
cd scripts/scrapers
pip install -r requirements.txt
export SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key>
python run_scrapers.py       # Run all scrapers
python aldi_ie.py            # Single retailer
```

CI runs daily at 09:00 UTC via `.github/workflows/scrape-daily.yml` (10:00 IST during DST).

## Environment Variables

See `README.md` for full descriptions. Quick reference:

| Variable | Required | Where used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Web app (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Web app (browser-safe, RLS-gated) |
| `SUPABASE_URL` | Scrapers only | Python ingestion scripts |
| `SUPABASE_SERVICE_KEY` | Scrapers only | Python ingestion scripts (service-role, never expose to client) |
| `FIRECRAWL_API_KEY` | Optional | Firecrawl-backed scrapers; skips gracefully if unset |

## Known Tool Conflicts

From the cleanup audit (June 2026):

1. **Global `@biomejs/biome` (v2.4.6) installed at `~/.bun/install/global`** — Project uses **ESLint** (`eslint.config.mjs`). Do NOT run `biome` in this repo; it would bypass project linting conventions.
2. **Global `typescript@6.0.3` vs local `typescript@^5`** — CI uses `npx tsc` which resolves local v5. If running `tsc` directly from PATH, you may get global v6. Use `npx tsc` or `bun x tsc` to stay on the project version.
3. **Dual Playwright packages** — `playwright@1.60.0` (browser launcher) + `@playwright/test@1.60.0` (test runner). Both are intentional — the standalone `playwright` is a peer dependency of `@playwright/test`. Do NOT remove either.
4. **No Prettier** — Deliberately omitted. All formatting conventions are enforced by ESLint.
5. **Scrapers install `playwright==1.50.0`** (Python) separately from `@playwright/test@1.60.0` (JS). These are independent runtimes — the Python one is only used in CI/CD for Aldi/Lidl scraping.
