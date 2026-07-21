# Brand Logo Sources — Map Marker Icons

Sourced for the MapLibre map marker switch (ADR-0013 / issue #34).
Assets live at `public/images/brands/` and are mapped from retailer slugs in
`lib/brand-logos.ts`.

## Source Table

| Retailer | Slug | File | Source | License | Notes |
|---|---|---|---|---|---|
| Lidl | `lidl` | `lidl.svg` | [Wikimedia Commons – File:Lidl-Logo.svg](https://commons.wikimedia.org/wiki/File:Lidl-Logo.svg) | Public domain (PD-textlogo) + trademark | Standard Lidl wordmark; blue/yellow/red circle |
| Aldi | `aldi` | `aldi.svg` | [Wikimedia Commons – File:Aldi_Süd_2017_logo.svg](https://commons.wikimedia.org/wiki/File:Aldi_S%C3%BCd_2017_logo.svg) | Public domain (PD-textlogo) + trademark | Aldi Süd logo (used by Aldi Ireland) |
| Tesco | `tesco` | `tesco.svg` | [Wikimedia Commons – File:Tesco_2016_logo.svg](https://commons.wikimedia.org/wiki/File:Tesco_2016_logo.svg) | Public domain (PD-textlogo) + trademark | Sourced from `www.tesco.com`; standard Tesco wordmark used in Ireland |
| SuperValu | `supervalu` | `supervalu.svg` | [Wikimedia Commons – File:SuperValuLogo.svg](https://commons.wikimedia.org/wiki/File:SuperValuLogo.svg) | Public domain (PD-textlogo) + trademark | Irish SuperValu wordmark (Musgrave Group) |
| Dunnes Stores | `dunnes` | `dunnes.svg` | [Wikimedia Commons – File:Logo_of_Dunnes_Stores.svg](https://commons.wikimedia.org/wiki/File:Logo_of_Dunnes_Stores.svg) | Public domain (PD-logo) + trademark | Clean two-line Dunnes Stores wordmark |
| Centra | `centra` | `centra.svg` | [Wikimedia Commons – File:Centra_logo.svg](https://commons.wikimedia.org/wiki/File:Centra_logo.svg) | Public domain (PD-textlogo) + trademark | Centra wordmark (Musgrave Group) |
| Spar | `spar` | `spar.svg` | [Wikimedia Commons – File:Spar-logo.svg](https://commons.wikimedia.org/wiki/File:Spar-logo.svg) | Public domain (PD-textlogo) + trademark | International SPAR wordmark/tree logo |
| Dealz | `dealz` | `dealz.png` | [Wikimedia Commons – File:Dealz_Logo_2023.png](https://commons.wikimedia.org/wiki/File:Dealz_Logo_2023.png) | Public domain (PD-textlogo) + trademark | No clean SVG found; using 2023 PNG fallback |
| Londis | `londis` | `londis.svg` | [Wikimedia Commons – File:Londis_logo.svg](https://commons.wikimedia.org/wiki/File:Londis_logo.svg) | Public domain (PD-shape) + trademark | UK Londis wordmark; Irish ADM Londis branding is similar |
| Costcutter | `costcutter` | `costcutter.svg` | [Wikimedia Commons – File:Costcutter_logo.svg](https://commons.wikimedia.org/wiki/File:Costcutter_logo.svg) | Public domain (PD-textlogo) + trademark | Costcutter wordmark (UK/Ireland symbol group) |
| Other | `other` | `other.svg` | Project-created | N/A | Generic store icon for unbranded/unknown retailers |

## Usage Notes

- All brand marks are used under Wikimedia Commons' public-domain "textlogo" / simple-geometry determination, **and remain trademarks of their respective owners**. Use is limited to retailer identification on the map.
- To add a new retailer: place `{slug}.svg` in `public/images/brands/` and add the entry to `lib/brand-logos.ts`.
- If a retailer updates its logo, replace the asset at the same path; no code changes are needed.
- The `other` slug uses a generic project-created icon; callers can still fall back to `getBrandLabel()` for a coloured letter badge.
