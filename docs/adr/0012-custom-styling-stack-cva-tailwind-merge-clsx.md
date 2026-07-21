# ADR-0012: Custom Styling Stack — CVA + tailwind-merge + clsx

**Status**: Accepted
**Date**: 2026-07-20
**Driver**: The app needs a reusable, type-safe component styling system that supports variants (like shadcn/ui patterns) without adding a CSS-in-JS library.

## Context

Components need conditional class names, safe Tailwind class merging, and variant-based styling for buttons, cards, badges, and inputs. Options considered:

1. **CSS-in-JS (styled-components, Emotion)** — familiar runtime styling, but adds runtime cost, server/client hydration concerns, and a second styling language alongside Tailwind.
2. **Inline Tailwind classes** — no extra dependencies, but becomes repetitive and error-prone for variants (e.g., button sizes, states).
3. **`clsx` + `tailwind-merge` + `class-variance-authority` (CVA)** — composes conditional classes, resolves Tailwind conflicts, and defines typed component variants in plain TypeScript, all while staying within the Tailwind utility-first model.

## Decision

Use `clsx` for conditional class names, `tailwind-merge` for intelligent class deduplication, and CVA for component variant definitions. This matches the shadcn/ui base-nova pattern configured in `components.json`.

## Rationale

- **Fits shadcn/ui conventions**: `components.json` configures the project with Tailwind CSS variables and the base-nova style, which expects `cn()` and CVA-based primitives.
- **Type-safe variants**: CVA variant props are typed, preventing invalid class combinations and giving IDE autocomplete.
- **No runtime CSS-in-JS**: all styling is resolved at build time via Tailwind classes; no styled-components runtime or hydration mismatch risk.
- **Conflict-free merging**: `tailwind-merge` handles overlapping Tailwind utilities (e.g., multiple `p-*` classes) so composed components do not silently break.

## Trade-offs

- **More boilerplate than inline classes**: defining variants in CVA adds a small amount of structure compared to ad-hoc class strings.
- **CVA dependency**: a small extra package is added to the project for variant definitions.
- **No runtime style composition**: CSS-in-JS enables dynamic runtime theming and style injection; this stack does not.
- **Styling lives in JS**: component styles are co-located in TypeScript files rather than separate CSS files, which some developers prefer to avoid.

## Consequences

- `components.json` is configured for the shadcn/ui base-nova style with Tailwind CSS variables and `@/lib/utils` alias.
- The project adopts `clsx` for conditional classes and `tailwind-merge` for class merging, typically composed into a `cn()` helper.
- CVA is used to define typed variants for reusable components (sizes, colors, states).
- `README.md` documents the convention: "Component styling — `class-variance-authority` (CVA) + `tailwind-merge` + `clsx` — no CSS-in-JS".
- App-specific components in `components/app/` and future shadcn/ui primitives in `components/ui/` follow this pattern.
- Adding CSS-in-JS later would conflict with this decision and require broad refactoring.
