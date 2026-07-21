# ADR-0011: Dark-Only Theme

**Status**: Accepted
**Date**: 2026-07-20
**Driver**: The app targets a dark, brand-aligned aesthetic (Monster Energy) and does not need to support a light theme or theme toggle.

## Context

The UI is built around a dark palette with a green primary accent. Supporting both light and dark modes would roughly double the color surface and introduce theme toggle UX. Options considered:

1. **Light + dark themes with user toggle** — broad accessibility, but requires two complete color sets, a toggle control, and state persistence.
2. **System-preference dark-only** — respects `prefers-color-scheme`, but still needs light fallback and adds complexity.
3. **Dark-only** — a single color palette, no toggle, no light scheme, and CSS variables point directly to dark values.

## Decision

Ship a dark-only theme. Define dark color values on `:root` in `app/globals.css` and include a `.dark` custom variant only for shadcn/ui compatibility, not for a second theme.

## Rationale

- **Simpler CSS**: only one set of background, foreground, card, and accent variables is needed, roughly halving the CSS variables and theme tokens.
- **Brand alignment**: the dark palette with green accent (`oklch(0.72 0.22 145)`) matches the Monster Energy brand identity.
- **No toggle UI**: removing the theme toggle reduces cognitive load and keeps the header clean.
- **shadcn compatibility**: the `@custom-variant dark` rule keeps shadcn/ui primitives working without requiring a separate light theme.

## Trade-offs

- **Excludes light-theme users**: users who prefer or need light interfaces cannot switch; this is accepted for the project's narrow brand focus.
- **No `prefers-color-scheme` handling**: the app does not automatically adapt to system light mode; it always renders dark.
- **Reduced accessibility for some users**: low-vision users who rely on high-contrast light themes may find the dark palette less comfortable.

## Consequences

- `app/globals.css` sets `--background: oklch(0.12 0.02 255)` and `--foreground: #f8fafc` on `:root`, making the default dark.
- The green primary accent is used consistently across `--primary`, `--accent`, `--ring`, and chart variables.
- `AGENTS.md` documents "Dark-only theme: `:root` is dark" as a project convention.
- `README.md` describes the dark-only approach and the `.dark` shadcn compatibility class.
- No theme toggle component exists in the app.
- Future expansion to a light theme would require adding a full second color set and a toggle, effectively revisiting this ADR.
