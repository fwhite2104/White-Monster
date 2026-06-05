# Location Auto-Refresh

## TL;DR
> **Summary**: Add time-aware location caching with auto-refresh on load/reload. Persist timestamps with GPS fixes, expire cache after 20 minutes, and auto-request fresh coordinates when permissions allow — without breaking manual location or SSR.
> **Deliverables**: Modified `hooks/use-geolocation.ts` with timestamp caching, staleness detection, and permission-aware auto-refresh
> **Effort**: Short (single file, surgical changes)
> **Parallel**: NO — sequential single-file edit
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

## Context
### Original Request
Read and implement the `location-auto-refresh-prompt.md` specification: auto-refresh user location on every visit/reload, expire cache after 20 minutes, respect Permissions API, keep manual location sticky.

### Interview Summary
No interview needed — the prompt file is a complete, audited specification with exact implementation details, acceptance criteria, and shipping instructions.

### Metis Review (gaps addressed)
N/A — single well-defined task, no ambiguities.

## Work Objectives
### Core Objective
Make user location stay fresh: update automatically on load/reload and expire cache after 20 minutes.

### Deliverables
- Modified `hooks/use-geolocation.ts` with:
  - Timestamp in localStorage payload
  - `LOCATION_MAX_AGE_MS` constant (20 minutes)
  - `isLocationStale()` helper
  - Permission-aware auto-refresh in `useEffect`
  - Backward-compatible cache reading

### Definition of Done (verifiable conditions with commands)
1. `bun run build` succeeds with no new errors/warnings
2. `bun run lint` passes
3. With permission granted: page load updates coordinates automatically (source: "gps"), no flash to Cork default
4. Cache older than 20 min is treated as stale and refreshed
5. Stored payload includes timestamp on every GPS fix
6. With permission denied/prompt: no auto-dialog, no "denied" banner
7. Manual location is not overwritten by auto-refresh
8. No SSR/hydration errors

### Must Have
- Timestamp persisted with every GPS fix
- `LOCATION_MAX_AGE_MS = 20 * 60 * 1000` constant
- `isLocationStale(cached)` helper returning true when no timestamp or older than 20 min
- Auto-refresh on mount (after hydration) when Permissions API says "granted"
- Skip auto-refresh when Permissions API says "prompt" or "denied"
- Fallback: auto-refresh only when usable cached fix exists (implies prior grant) if Permissions API unavailable
- Manual location (`source: "manual"`) not overwritten by auto-refresh
- Optimistic UI: show cached coords while fresh fix loads
- Backward compatibility: legacy cache without timestamp treated as stale

### Must NOT Do (guardrails, AI slop patterns, scope boundaries)
- Do NOT modify any file other than `hooks/use-geolocation.ts`
- Do NOT rename the public hook API or return value shape
- Do NOT change the data layer, map, API routes, or other components
- Do NOT add new dependencies
- Do NOT refactor unrelated code
- Do NOT reduce `timeout` below 10s
- Do NOT change `maximumAge: 30000` in getCurrentPosition options
- Do NOT auto-fire permission dialog when state is "prompt"
- Do NOT use `watchPosition` — use `useEffect` + `getCurrentPosition` per the spec
- Do NOT add `setInterval` for periodic refresh — only refresh on mount/reload

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: tests-after (existing test infrastructure in `lib/__tests__/`)
- QA policy: Every task has agent-executed scenarios
- Evidence: .sisyphus/evidence/task-{N}-{slug}.{ext}

## Execution Strategy
### Parallel Execution Waves
> Single file — no parallelism needed.

Wave 1: [Task 1, Task 2] — Add constants and helpers
Wave 2: [Task 3] — Modify storage functions
Wave 3: [Task 4] — Add auto-refresh logic
Wave 4: [Task 5] — Verify and ship

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|------|------------|--------|
| 1. Add LOCATION_MAX_AGE_MS constant | — | 2, 3, 4 |
| 2. Add isLocationStale helper | 1 | 3, 4 |
| 3. Modify saveLocationToStorage to include timestamp | 1 | 4 |
| 4. Add auto-refresh useEffect | 1, 2, 3 | 5 |
| 5. Verify and ship | 1-4 | — |

### Agent Dispatch Summary (wave → task count → categories)
Wave 1: 2 tasks — quick (constants + helper)
Wave 2: 1 task — quick (storage)
Wave 3: 1 task — quick (auto-refresh)
Wave 4: 1 task — quick (verification)

## TODOs

- [x] 1. Add LOCATION_MAX_AGE_MS constant

  **What to do**: Add a single constant near the top of `hooks/use-geolocation.ts`, next to `STORAGE_KEY`:
  ```typescript
  const LOCATION_MAX_AGE_MS = 20 * 60 * 1000; // 20 minutes
  ```
  Place it at line ~30, after `STORAGE_KEY` definition.

  **Must NOT do**: Do not rename or move existing constants.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single line addition
  - Skills: [] — No special skills needed
  - Omitted: [`supabase`, `e2e-testing`] — Not relevant

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [2, 3, 4] | Blocked By: []

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `hooks/use-geolocation.ts:29` — Where `STORAGE_KEY` is defined, add constant right after

  **Acceptance Criteria** (agent-executable only):
  - [ ] `LOCATION_MAX_AGE_MS` is defined as `20 * 60 * 1000`
  - [ ] It appears on the line after `STORAGE_KEY` definition
  - [ ] `bun run build` still succeeds

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Constant exists and has correct value
    Tool: Bash
    Steps: grep -n "LOCATION_MAX_AGE_MS" hooks/use-geolocation.ts
    Expected: Output shows the constant with value 1200000 (20 * 60 * 1000)
    Evidence: .sisyphus/evidence/task-1-constant.txt
  ```

  **Commit**: NO — grouped with final commit

- [x] 2. Add isLocationStale helper

  **What to do**: Add a helper function after the `LOCATION_MAX_AGE_MS` constant:
  ```typescript
  function isLocationStale(cached: { lat: number; lng: number; accuracy?: number; timestamp?: number }): boolean {
    if (!cached.timestamp) return true; // Legacy entry without timestamp = stale
    return Date.now() - cached.timestamp > LOCATION_MAX_AGE_MS;
  }
  ```
  Place it after the constant, before `isClient` definition.

  **Must NOT do**: Do not modify the `isClient` or `isValidCoordinate` helpers.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single function addition
  - Skills: [] — No special skills needed
  - Omitted: [`supabase`, `e2e-testing`] — Not relevant

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [3, 4] | Blocked By: [1]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `hooks/use-geolocation.ts:59-75` — `loadCachedLocation` shows the shape of cached data
  - Pattern: `hooks/use-geolocation.ts:31-33` — `isClient` helper pattern to follow

  **Acceptance Criteria** (agent-executable only):
  - [ ] `isLocationStale` function exists with correct signature
  - [ ] Returns `true` when `timestamp` is undefined
  - [ ] Returns `true` when `Date.now() - timestamp > LOCATION_MAX_AGE_MS`
  - [ ] Returns `false` when timestamp exists and is within 20 minutes
  - [ ] `bun run build` still succeeds

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Function exists and has correct logic
    Tool: Bash
    Steps: grep -n "isLocationStale" hooks/use-geolocation.ts
    Expected: Function definition found
    Evidence: .sisyphus/evidence/task-2-helper.txt

  Scenario: Legacy entries treated as stale
    Tool: Bash
    Steps: grep -A5 "if (!cached.timestamp)" hooks/use-geolocation.ts
    Expected: Returns true for entries without timestamp
    Evidence: .sisyphus/evidence/task-2-legacy.txt
  ```

  **Commit**: NO — grouped with final commit

- [x] 3. Modify saveLocationToStorage to include timestamp

  **What to do**: Modify the `saveLocationToStorage` function (currently lines ~77-91) to include `timestamp: Date.now()` in the stored payload:
  ```typescript
  function saveLocationToStorage(location: { lat: number; lng: number; accuracy?: number }): void {
    if (!isClient) return;
    try {
      const payload = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: Date.now() // Add this line
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage might be full or disabled
    }
  }
  ```
  The key change is adding `timestamp: Date.now()` to the payload object.

  **Must NOT do**: Do not change the function signature or return type. Do not change the storage key.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single line addition in existing function
  - Skills: [] — No special skills needed
  - Omitted: [`supabase`, `e2e-testing`] — Not relevant

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [4] | Blocked By: [1]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `hooks/use-geolocation.ts:77-91` — Current `saveLocationToStorage` implementation
  - Pattern: `hooks/use-geolocation.ts:170` — Where it's called on GPS success

  **Acceptance Criteria** (agent-executable only):
  - [ ] `saveLocationToStorage` includes `timestamp: Date.now()` in the payload
  - [ ] The payload shape is `{lat, lng, accuracy, timestamp}`
  - [ ] `bun run build` still succeeds

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Timestamp is persisted
    Tool: Bash
    Steps: grep -n "timestamp: Date.now()" hooks/use-geolocation.ts
    Expected: Found in saveLocationToStorage function
    Evidence: .sisyphus/evidence/task-3-timestamp.txt

  Scenario: Payload structure is correct
    Tool: Bash
    Steps: grep -B2 -A2 "timestamp:" hooks/use-geolocation.ts
    Expected: timestamp appears alongside lat, lng, accuracy
    Evidence: .sisyphus/evidence/task-3-payload.txt
  ```

  **Commit**: NO — grouped with final commit

- [x] 4. Add auto-refresh useEffect

  **What to do**: Add a `useEffect` hook after the main state initialization (after line ~114) that:
  1. Runs only on mount (after hydration)
  2. Checks Permissions API to determine if auto-refresh is allowed
  3. If permission is "granted" AND location is not manual, calls `requestLocation()` silently
  4. If permission is "prompt" or "denied", does nothing (lets user trigger manually)
  5. Falls back to: auto-refresh only if a usable cached fix exists (implies prior grant)

  Implementation:
  ```typescript
  // Auto-refresh location on mount (after hydration)
  useEffect(() => {
    if (!isClient) return;
    
    // Don't auto-refresh if user has set manual location
    if (state.source === 'manual') return;
    
    // Check Permissions API if available
    const checkAndRefresh = async () => {
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          if (result.state === 'granted') {
            // Permission already granted — safe to auto-refresh
            requestLocation();
          } else if (result.state === 'prompt') {
            // Don't auto-fire dialog — wait for user action
            return;
          } else {
            // denied — never auto-request
            return;
          }
        } else {
          // Permissions API unavailable — fallback:
          // Only auto-refresh if we have a usable cached fix (implies prior grant)
          if (state.location && state.source === 'cached' && !isLocationStale(state.location)) {
            // Cache is fresh — no need to refresh
            return;
          }
          // No cache or stale cache — attempt refresh
          requestLocation();
        }
      } catch {
        // Permissions API error — be conservative, don't auto-refresh
      }
    };
    
    // Small delay to ensure hydration is complete
    const timer = setTimeout(checkAndRefresh, 100);
    return () => clearTimeout(timer);
  }, []); // Empty deps — run only on mount
  ```

  **Must NOT do**: 
  - Do not use `setInterval` or periodic refresh
  - Do not auto-fire when permission is "prompt" (intrusive dialog)
  - Do not overwrite manual location
  - Do not add the `state` dependency to the useEffect deps (would cause loops)

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Single useEffect addition
  - Skills: [] — No special skills needed
  - Omitted: [`supabase`, `e2e-testing`] — Not relevant

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [5] | Blocked By: [1, 2, 3]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `hooks/use-geolocation.ts:100-114` — Where to add the useEffect (after state initialization)
  - Pattern: `hooks/use-geolocation.ts:118-214` — `requestLocation` function to call
  - Pattern: `hooks/use-geolocation.ts:216-238` — `setManualLocation` to understand manual source
  - Pattern: `hooks/use-geolocation.ts:31-33` — `isClient` guard pattern

  **Acceptance Criteria** (agent-executable only):
  - [ ] `useEffect` exists that runs on mount
  - [ ] Checks Permissions API before requesting
  - [ ] Does not auto-refresh when permission is "prompt" or "denied"
  - [ ] Does not overwrite manual location
  - [ ] Falls back to cache-based refresh when Permissions API unavailable
  - [ ] `bun run build` succeeds with no hydration errors

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Auto-refresh useEffect exists
    Tool: Bash
    Steps: grep -n "useEffect" hooks/use-geolocation.ts | head -5
    Expected: Shows useEffect call with mount-only deps
    Evidence: .sisyphus/evidence/task-4-useeffect.txt

  Scenario: Permissions API is checked
    Tool: Bash
    Steps: grep -n "permissions" hooks/use-geolocation.ts
    Expected: navigator.permissions.query is called
    Evidence: .sisyphus/evidence/task-4-permissions.txt

  Scenario: Manual location is not overwritten
    Tool: Bash
    Steps: grep -A2 "source === 'manual'" hooks/use-geolocation.ts
    Expected: Early return before auto-refresh
    Evidence: .sisyphus/evidence/task-4-manual.txt

  Scenario: Prompt permission does not auto-fire
    Tool: Bash
    Steps: grep -B1 -A1 "prompt" hooks/use-geolocation.ts
    Expected: Returns early without calling requestLocation
    Evidence: .sisyphus/evidence/task-4-prompt.txt
  ```

  **Commit**: YES | Message: `feat(location): auto-refresh user location on load and expire cache after 20 minutes` | Files: [`hooks/use-geolocation.ts`]

- [ ] 5. Verify and ship

  **What to do**: Run verification checks and ship:
  1. Run `bun run build` — must succeed with no new errors
  2. Run `bun run lint` — must pass
  3. Commit with message: `feat(location): auto-refresh user location on load and expire cache after 20 minutes`
  4. Push to remote

  **Must NOT do**: Do not skip build verification. Do not commit if build fails.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: Verification and git commands
  - Skills: [`git-master`] — For proper commit workflow
  - Omitted: [`supabase`, `e2e-testing`] — Not relevant

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [] | Blocked By: [1-4]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json` — Build and lint scripts
  - Pattern: `hooks/use-geolocation.ts` — The file being modified

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run build` succeeds with exit code 0
  - [ ] `bun run lint` passes
  - [ ] Commit created with correct message
  - [ ] Push to remote succeeds

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Build succeeds
    Tool: Bash
    Steps: bun run build
    Expected: Exit code 0, no errors
    Evidence: .sisyphus/evidence/task-5-build.txt

  Scenario: Lint passes
    Tool: Bash
    Steps: bun run lint
    Expected: Exit code 0, no errors
    Evidence: .sisyphus/evidence/task-5-lint.txt

  Scenario: Commit is clean
    Tool: Bash
    Steps: git log --oneline -1
    Expected: Shows commit with message "feat(location): auto-refresh user location on load and expire cache after 20 minutes"
    Evidence: .sisyphus/evidence/task-5-commit.txt

  Scenario: Push succeeds
    Tool: Bash
    Steps: git push
    Expected: Exit code 0, pushed to remote
    Evidence: .sisyphus/evidence/task-5-push.txt
  ```

  **Commit**: NO — this task IS the commit

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> After all implementation is complete, run these verification checks:
1. `bun run build` — must succeed
2. `bun run lint` — must pass
3. Review the diff to confirm only `hooks/use-geolocation.ts` was modified
4. Confirm no new files were added
5. Confirm no other files were modified

## Commit Strategy
- Single commit after all tasks complete
- Message: `feat(location): auto-refresh user location on load and expire cache after 20 minutes`
- Push to remote immediately after commit

## Success Criteria
1. With permission **granted**: loading/reloading updates coordinates automatically (source: "gps"), no flash to Cork default
2. Cache older than 20 minutes is treated as stale and refreshed
3. Stored payload includes timestamp on every GPS fix
4. With permission **denied** or **prompt**: no auto-dialog, no "denied" banner
5. Manual location is not overwritten by auto-refresh
6. No SSR/hydration errors; `next build` is clean
7. Code is pushed to remote
