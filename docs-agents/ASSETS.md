# ASSETS: Friends Plans Calendar

- **Version:** 1.0, 2026-10-08, written by the designer.
- **Sources:** SPEC.md ("No image or video assets are needed") and BRIEF.md (header conventions, §3 metadata, §6 file structure, §7.5 out of scope).

## No assets need to be generated

This project needs **no image or video assets**, and there is **no manual or AI asset-generation step**. The builder can go ahead without waiting for any files.

- `public/assets/` holds only `.gitkeep` and stays intentionally empty.
- The UI gets its visual character from the person colours on the plan bars, the typography and the whitespace (DESIGN.md §1 and §8).

## Asset list (images and video)

| File name | Type and format | Dimensions | Placement | Alt text | Generation prompt |
|---|---|---|---|---|---|
| (none) | N/A | N/A | N/A | N/A | N/A |

## Graphics written as code (not generated, listed for completeness)

| File or location | What it is | Size | Placement | Accessible name | Spec |
|---|---|---|---|---|---|
| `public/favicon.svg` | Hand-written SVG (four `<rect>` elements) | viewBox 32×32, scalable | `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` in `index.html` | None (browser tab icon) | DESIGN.md §8.3: exact geometry and hex fills |
| `AppMark` component (inline SVG, same geometry) | React component | 24px (header), 48px (gate, NotFound) | Header app-name link, PasscodeGate card, NotFound | `aria-hidden="true"`. The parent link or heading carries the name ("Friends Plans, this month's calendar") | DESIGN.md §8.3. The square uses `var(--color-mark-bg)` so it adapts to dark mode |
| Icons | `lucide-react` components (npm package, tree-shaken) | 16, 20 or 24px (`--icon-sm`, `--icon-md`, `--icon-lg`) | Throughout the UI | Decorative icons are `aria-hidden`. Icon-only buttons carry an `aria-label` | DESIGN.md §8.1 lists the icons used |

## Explicitly not needed

| Item | Reason |
|---|---|
| `og:image` / social preview | BRIEF §3: Open Graph tags without an image. The app is private behind a passcode |
| `apple-touch-icon` PNG, web manifest icons | No PWA or manifest is in scope. The SVG favicon covers browser tabs |
| Hero images, illustrations, empty-state artwork | Empty states use a lucide icon and text (DESIGN.md §6.7) |
| Photography or video | Out of scope (BRIEF §7.5) |
| Webfont files | DESIGN.md §2.1 uses the system font stack (0 KB) |

## Generation prompts

None. If a future iteration adds imagery, add one entry per file here with file name, format, dimensions, placement, alt text and a generation prompt that references the DESIGN.md colour tokens.
