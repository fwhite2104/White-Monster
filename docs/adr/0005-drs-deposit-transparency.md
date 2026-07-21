# ADR-0005: DRS Deposit Transparency (Separate Display)

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: Ireland's Deposit Return Scheme adds a refundable deposit per can, so users must see the base product price and the deposit separately.

## Context

Ireland's Deposit Return Scheme (DRS) adds €0.15 per eligible container. For Monster cans, this means the price shown on the shelf includes a refundable deposit. Options considered:

1. **Display total only** — simplest, but hides why the price is higher and makes it harder to compare the real product cost.
2. **Deduct deposit from displayed price** — shows the lower base price, but is misleading because the user must pay the deposit at checkout.
3. **Show base price and deposit separately** — transparent; the user sees both the product cost and the refundable amount.

## Decision

Split every total price into `base_price` and `drs_deposit` before returning it to the client. Display both values side by side in the UI and use the base price for per-can comparisons.

## Rationale

- **Transparency**: Users understand exactly what they pay at the till and what they can get back.
- **Fair comparison**: Per-can and sort-by-price logic use the base product price, not the deposit-inflated total.
- **Simple fixed-rate calculation**: The scheme uses a flat €0.15 per can, so the split is deterministic and requires no external API.
- **Regulatory clarity**: Separating the deposit aligns with how the scheme is presented to consumers.

## Trade-offs

- **Assumes standard can size**: `splitPrice()` multiplies the deposit by the can count from `getPackCount(packSize)` and does not adjust for can volume. This matches the current 250 ml can range but would need revisiting if larger DRS-eligible formats are tracked.
- **Display complexity**: Every price card and breakdown must render two numbers instead of one.
- **No checkout integration**: The deposit is informational only; the app does not handle payment or refund.

## Consequences

- `lib/drs.ts` exports `splitPrice(totalPrice, packSize)`, which returns `{ base_price, drs_deposit }` using `DRS_RATE = 0.15` and `getPackCount()` from `lib/constants.ts`.
- `Price` type in `lib/types.ts` includes optional `base_price` and `drs_deposit` fields.
- `app/api/prices/route.ts` calls `splitPrice()` on every price row before serializing the response.
- UI components `DrsBadge.tsx`, `DrsBreakdown.tsx`, and `DrsInfoDialog.tsx` render the deposit separately; `PriceCard.tsx` shows the combined breakdown.
- Sorting and per-can normalization use the base price, while the user still sees the full amount they would pay in store.
