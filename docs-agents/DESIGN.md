# DESIGN: Friends Plans Calendar

- **Version:** 1.0, 2026-10-08, written by the designer.
- **Inputs:** `docs-agents/BRIEF.md` v1.0 (user decisions in §8 applied: English UI, en-GB dates, weeks start Monday), `SPEC.md`. `REVIEW-LOG.md` has no rounds yet, so there is no critic feedback to address.
- **How to use this file:** every value is a token. §10 contains CSS you can paste into `src/styles/tokens.css` and `src/styles/person-colors.css` as is. Component CSS Modules should only reference `var(--…)` tokens, never raw hex values. The only exception is `public/favicon.svg` (§8.3).
- **Contrast method:**
  - WCAG 2.x relative luminance (sRGB linearisation per channel, `L = 0.2126 R + 0.7152 G + 0.0722 B`) and the ratio `(L1 + 0.05) / (L2 + 0.05)`.
  - Computed per hex value and rounded to 2 decimals. An online checker may differ by ±0.01.
  - The luminance `L` is listed for each colour so the numbers can be checked.
  - Every pair clears its threshold by at least 0.2, so rounding cannot flip a result.

---

## 1. Visual direction

**Mood:** a shared paper wall calendar on a friend's fridge, with warm off-white paper, calm ink and bright stickers for people. It is friendly and quiet, not a corporate dashboard.

**Principles (tied to BRIEF §1–§2):**

1. **Colour belongs to people.** The chrome (header, buttons, toolbar, grid) is neutral warm grey and ink. The 12 person colours are the only saturated colours in the UI, so a bar's colour can never be confused with a button, link or status. Primary buttons and the FAB are ink: near-black in light mode and near-white in dark mode. This supports G2: "each person has one consistent colour in every view".
2. **Names are always the label.** Every bar, dot and list row shows the person's name next to the colour (WCAG 1.4.1). Colour speeds up scanning, and the name guarantees identification.
3. **Two lightness tiers for people.** Six "deep" colours carry white text and six "bright" colours carry ink text. Adjacent lanes therefore differ in lightness as well as hue. Lightness survives every colour-vision deficiency, and hue alone does not (§3.4).
4. **Phone first, one hand.** The 375px month grid sets the geometry (§5.2). The primary action sits bottom-right within thumb reach, and every control has a hit area of at least 44×44px (with the documented exceptions in §6.1).
5. **Fast and stable.** System fonts, no images, and fixed row heights per breakpoint. The grid draws from date maths before data arrives, so nothing shifts. This supports CLS below 0.05 and Lighthouse performance of 90 or more.
6. **Calm motion.** Short, purposeful transitions on sheets and toasts only. Data never animates (§7).

**References:**
- Google Calendar mobile month view (bar density)
- Apple Calendar (calm neutrals)
- The Okabe–Ito colour-blind-safe palette (hue order for c1–c8)

---

## 2. Typography

### 2.1 Font family: system stack, no webfont

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif;
```

**Why no webfont:**
- **Performance:** 0 KB, no font request, and no FOUT or CLS. This protects Lighthouse ≥ 90 and CLS < 0.05.
- **Native feel:** SF Pro on iOS, Roboto on Android and Segoe UI on Windows match the friends' phones. All three cover Czech diacritics (Klára, Tomáš, Jiří).
- **Nothing to configure:** no CSP change is needed (`font-src 'self'` stays unused) and there is no GDPR font-CDN issue.

**Numerals:** `font-variant-numeric: tabular-nums` on date numbers in grids, timeline headers, ranges, counts, "+N" and the PIN input.

**Root:** `html { font-size: 100%; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }`. Body: `font: 400 var(--text-base)/var(--leading-base) var(--font-sans); color: var(--color-text); background: var(--color-bg);`.

### 2.2 Type scale

| Token | Size | Line height | Default weight | Letter spacing | Used for |
|---|---|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | `--leading-xs` 1rem (16px) | 500 | 0.01em | Weekday header, "+N", badges ("You"), swatch labels, timeline weekday initial |
| `--text-bar` | **12px (px, not rem)** | `--leading-bar` 18px (= calendar bar height) | 600 | 0 | Calendar bar labels. Timeline bar labels use the same size with 28px line height |
| `--text-sm` | 0.875rem (14px) | `--leading-sm` 1.25rem (20px) | 400 | 0 | Hints, meta lines, list secondary text, chips, toasts, toolbar buttons |
| `--text-base` | 1rem (16px) | `--leading-base` 1.5rem (24px) | 400 | 0 | Body, **all inputs** (16px stops iOS zooming on focus), buttons (at 600) |
| `--text-lg` | 1.125rem (18px) | `--leading-lg` 1.625rem (26px) | 700 | -0.005em | Month title and sheet titles below 768px, list item title |
| `--text-xl` | 1.25rem (20px) | `--leading-xl` 1.75rem (28px) | 700 | -0.01em | Month title and sheet titles at 768px and up, dialog titles |
| `--text-2xl` | 1.5rem (24px) | `--leading-2xl` 2rem (32px) | 700 | -0.015em | Page titles (People, Admin), event detail title, PIN digits |
| `--text-3xl` | 1.875rem (30px) | `--leading-3xl` 2.25rem (36px) | 700 | -0.02em | Gate and NotFound titles, lower bound |
| `--text-4xl` | 2.25rem (36px) | `--leading-4xl` 2.5rem (40px) | 700 | -0.02em | Gate and NotFound titles, upper bound |

**Weights:** `--weight-regular: 400`, `--weight-medium: 500`, `--weight-semibold: 600`, `--weight-bold: 700`. Only these four are used.

**Fluid rule (one place only):** the gate and NotFound titles use `font-size: clamp(var(--text-3xl), 1.5rem + 1.6vw, var(--text-4xl)); line-height: 1.15`. Everything else steps at breakpoints (§5). Body text is never fluid.

**Units:**
- Text is in `rem`, except the bar labels (`--text-bar`, in `px`).
- Bars have fixed pixel heights, which is what gives the grid zero layout shift, and their labels must fit those heights exactly. Browser zoom still scales them, which satisfies WCAG 1.4.4.

**Minimum size:** no text smaller than 12px anywhere.

---

## 3. Colour tokens

### 3.1 UI tokens: light and dark

`L` is relative luminance. A dash means the token is decorative, an overlay or exempt.

| Token | Light | L | Dark | L | Role |
|---|---|---|---|---|---|
| `--color-bg` | `#F6F5F2` | 0.913 | `#111317` | 0.0065 | Page background |
| `--color-surface` | `#FFFFFF` | 1.000 | `#1A1D23` | 0.0140 | In-month day cells, cards, list cards, timeline cells and name column |
| `--color-surface-raised` | `#FFFFFF` | 1.000 | `#22262D` | 0.0192 | Sheets, side panel, dialogs. Light mode separates by shadow, dark mode by tone |
| `--color-surface-sunken` | `#EEECE7` | 0.839 | `#0C0E11` | 0.0043 | Outside-month day cells, notes block, segmented track (light) |
| `--color-surface-weekend` | `#F7F5F0` | 0.914 | `#16191E` | 0.0096 | Saturday and Sunday columns (calendar and timeline) |
| `--color-input-bg` | `#FFFFFF` | 1.000 | `#15181C` | 0.0090 | Text, date, PIN and textarea fields |
| `--color-text` | `#1A1C20` | 0.0119 | `#ECEDEF` | 0.846 | Primary text |
| `--color-text-muted` | `#5E6168` | 0.119 | `#A3A7AF` | 0.385 | Secondary text, outside-month day numbers, placeholders, hints |
| `--color-border` | `#E2DFD8` | — | `#2E323A` | — | Decorative dividers and grid lines |
| `--color-border-week` | `#CFCBC2` | — | `#3A3F48` | — | Timeline Monday separators (decorative) |
| `--color-border-strong` | `#858891` | 0.246 | `#737882` | 0.187 | Input, checkbox and secondary-button boundaries (WCAG 1.4.11) |
| `--color-primary` | `#1A1C20` | 0.0119 | `#ECEDEF` | 0.846 | Primary button, FAB, today circle, checked checkbox and radio |
| `--color-primary-hover` | `#33363C` | 0.0367 | `#D5D7DB` | 0.679 | Hover on primary |
| `--color-on-primary` | `#FFFFFF` | 1.000 | `#111317` | 0.0065 | Text and icons on primary |
| `--color-accent` | `#2457C5` | 0.112 | `#8AB4F8` | 0.448 | Links, active-filter outline |
| `--color-accent-subtle` | `#E6ECFA` | 0.837 | `#1F2A44` | 0.0237 | Active FilterButton background, filter note row |
| `--color-today-bg` | `#EEF2FC` | 0.887 | `#1C2740` | 0.0207 | Today cell (calendar) and today column (timeline) tint |
| `--color-focus` | `#2457C5` | 0.112 | `#8AB4F8` | 0.448 | Focus ring (§6.1) |
| `--color-chip` | `#ECE9E2` | 0.816 | `#2C3038` | 0.0294 | "+N" pill, "You" badge, chips, segmented track (dark) |
| `--color-hover` | `#1A1C200A` | — | `#ECEDEF0F` | — | Hover overlay on non-bar surfaces |
| `--color-pressed` | `#1A1C2014` | — | `#ECEDEF1F` | — | Pressed overlay |
| `--color-scrim` | `#14161A73` | — | `#000000A6` | — | `::backdrop` for sheets and dialogs |
| `--color-inverse-surface` | `#24272C` | 0.0201 | `#ECEDEF` | 0.846 | Toast background |
| `--color-on-inverse` | `#FFFFFF` | 1.000 | `#111317` | 0.0065 | Toast text and action |
| `--color-success` | `#1E7A46` | 0.146 | `#5CC98A` | 0.459 | Success text and icons |
| `--color-success-bg` | `#E6F4EC` | 0.876 | `#12301F` | 0.0234 | Success notice background |
| `--color-warning` | `#8A5A00` | 0.127 | `#F2C26B` | 0.585 | Warning icons and text (lockouts, admin) |
| `--color-warning-bg` | `#FDF1D6` | 0.886 | `#33270F` | 0.0219 | AdminBanner, lockout box |
| `--color-danger` | `#B42318` | 0.110 | `#FF8A80` | 0.410 | Error text, field error border, danger-ghost button |
| `--color-danger-bg` | `#FDECEA` | 0.868 | `#3A1715` | 0.0157 | ErrorBanner background |
| `--color-danger-solid` | `#B42318` | 0.110 | `#C4302B` | 0.140 | Solid "Delete" buttons |
| `--color-danger-solid-hover` | `#961B12` | — | `#A82520` | — | Darker, so the contrast with white only increases |
| `--color-on-danger` | `#FFFFFF` | 1.000 | `#FFFFFF` | 1.000 | Text on solid danger |
| `--color-toast-success` | `#5CC98A` | 0.459 | `#1E7A46` | 0.146 | Success icon in toasts (inverse surface) |
| `--color-toast-danger` | `#FF8A80` | 0.410 | `#B42318` | 0.110 | Error icon in toasts |
| `--color-disabled-bg` | `#ECE9E2` | — | `#262A31` | — | Disabled control fill (exempt, WCAG 1.4.3) |
| `--color-disabled-text` | `#8C8F96` | — | `#6E737C` | — | Disabled label (exempt) |
| `--color-skeleton` | `#E9E6E0` | — | `#262A31` | — | Skeleton blocks |
| `--color-shimmer` | `#FFFFFF99` | — | `#FFFFFF0F` | — | Moving highlight in shimmer |
| `--color-mark-bg` | `#1A1C20` | — | `#2C3038` | — | App-mark square (§8.3) |
| `--color-away-1` | `#EFEAE0` | 0.82 | `#1F2228` | 0.016 | AwayRow cell: up to 25% of filtered people away |
| `--color-away-2` | `#E3DACB` | 0.70 | `#2A2E36` | 0.028 | AwayRow: up to 50% |
| `--color-away-3` | `#D3C6B0` | 0.574 | `#3A3F49` | 0.049 | AwayRow: more than 50% |
| `--bar-edge` | `#0000001A` | — | `#00000000` | — | 1px inset hairline on bars in light mode (defines bright bars on white) |
| `--sticky-shadow` | `#00000026` | — | `#00000080` | — | Timeline name-column shadow when scrolled |

### 3.2 Contrast proof: UI text and boundary pairs

AA requires 4.5 for text and 3.0 for UI boundaries, focus rings and icons.

| Pair | Light | Dark | Required |
|---|---|---|---|
| text / bg | 15.56 | 15.87 | 4.5 ✓ |
| text / surface | 16.96 | 14.02 | 4.5 ✓ |
| text / surface-raised | 16.96 | 12.96 | 4.5 ✓ |
| text / surface-sunken | 14.37 | 16.50 | 4.5 ✓ |
| text / surface-weekend | 15.57 | 15.04 | 4.5 ✓ |
| text / today-bg | 15.14 | 12.68 | 4.5 ✓ |
| text / accent-subtle | 14.33 | 12.17 | 4.5 ✓ |
| text / chip ("+N", badges) | 13.99 | 11.30 | 4.5 ✓ |
| text / warning-bg (AdminBanner) | 15.13 | 12.47 | 4.5 ✓ |
| text / away-3 (worst AwayRow level) | 10.07 | 9.02 | 4.5 ✓ |
| text-muted / surface | 6.20 | 6.81 | 4.5 ✓ |
| text-muted / bg | 5.69 | 7.71 | 4.5 ✓ |
| text-muted / surface-raised | 6.20 | 6.29 | 4.5 ✓ |
| text-muted / surface-sunken (outside-month numbers) | 5.25 | 8.01 | 4.5 ✓ |
| text-muted / surface-weekend | 5.69 | 7.30 | 4.5 ✓ |
| text-muted / today-bg | 5.54 | 6.16 | 4.5 ✓ |
| text-muted / chip (unselected segment) | 5.12 | 5.48 | 4.5 ✓ |
| text-muted / input-bg (placeholder) | 6.20 | 7.38 | 4.5 ✓ |
| on-primary / primary (buttons, FAB, today circle) | 16.96 | 15.87 | 4.5 ✓ |
| on-primary / primary-hover | 12.11 | 12.90 | 4.5 ✓ |
| accent (link) / surface | 6.47 | 7.79 | 4.5 ✓ |
| accent (link) / bg | 5.94 | 8.82 | 4.5 ✓ |
| focus ring / bg, surface, raised | 5.94 / 6.47 / 6.47 | 8.82 / 7.79 / 7.20 | 3.0 ✓ |
| border-strong / surface and raised | 3.54 / 3.54 | 3.70 / 3.43 | 3.0 ✓ |
| border-strong / input-bg | 3.54 | 4.02 | 3.0 ✓ |
| danger / surface-raised | 6.57 | 6.65 | 4.5 ✓ |
| danger / danger-bg | 5.75 | 7.00 | 4.5 ✓ |
| on-danger / danger-solid | 6.57 | 5.52 | 4.5 ✓ |
| success / success-bg | 4.71 | 6.93 | 4.5 ✓ |
| success / surface | 5.35 | 7.96 | 4.5 ✓ |
| warning / warning-bg | 5.29 | 8.84 | 4.5 ✓ |
| warning / surface | 5.93 | 9.95 | 4.5 ✓ |
| on-inverse / inverse-surface (toast) | 14.98 | 15.87 | 4.5 ✓ |
| toast-success icon / inverse-surface | 7.26 | 4.56 | 3.0 ✓ |
| toast-danger icon / inverse-surface | 6.56 | 5.61 | 3.0 ✓ |

### 3.3 Person colours (the top visual priority)

**Rules (BRIEF §4.8):**
- Store only `colorId`.
- Components set `data-color="cN"`, and `person-colors.css` maps that to the local variables `--bar`, `--on-bar` and `--dot` (§10.2).

**What each token does:**
- `--person-cN-bar`: the bar fill, also used as the swatch fill.
- `--person-cN-on-bar`: the bar label colour, at least 4.5:1 on the bar. The lowest measured value is 4.91:1; 11 of the 12 colours are at 5:1 or more in both themes.
- `--person-cN-dot`: at least 3:1 against `--color-surface`, `--color-surface-raised` and `--color-bg`.
  - Dots and swatches render as `background: var(--bar); box-shadow: inset 0 0 0 2px var(--dot);`.
  - Where `dot = bar` the result is a solid dot.
  - For bright colours in light mode the result is a bright centre with a darker ring, so the hue stays recognisable and the 3:1 boundary is met.

**Ink for bright bars:** `#121417` (L 0.0069) in both themes, token `--person-ink`.

**Light theme** (bars sit on `--color-surface` `#FFFFFF`, `--color-surface-weekend`, `--color-surface-sunken` or `--color-today-bg`):

| ID | Name | Tier | `bar` | L | `on-bar` | **on-bar : bar** | `dot` | dot L | **dot : surface / bg** |
|---|---|---|---|---|---|---|---|---|---|
| c1 | Blue | deep | `#2160C4` | 0.127 | `#FFFFFF` | **5.94** | `#2160C4` | 0.127 | 5.94 / 5.45 |
| c2 | Orange | bright | `#F59A2E` | 0.427 | `#121417` | **8.39** | `#C46A0A` | 0.221 | 3.88 / 3.56 |
| c3 | Green | deep | `#0B7A5B` | 0.147 | `#FFFFFF` | **5.32** | `#0B7A5B` | 0.147 | 5.32 / 4.88 |
| c4 | Pink | bright | `#E98AC4` | 0.395 | `#121417` | **7.82** | `#C04A92` | 0.182 | 4.53 / 4.15 |
| c5 | Sky | bright | `#5CB8F0` | 0.428 | `#121417` | **8.41** | `#2589C8` | 0.225 | 3.82 / 3.51 |
| c6 | Red | deep | `#C8372D` | 0.152 | `#FFFFFF` | **5.20** | `#C8372D` | 0.152 | 5.20 / 4.77 |
| c7 | Yellow | bright | `#F2D03A` | 0.643 | `#121417` | **12.18** | `#9C7A00` | 0.210 | 4.04 / 3.71 |
| c8 | Purple | deep | `#6A38B0` | 0.090 | `#FFFFFF` | **7.49** | `#6A38B0` | 0.090 | 7.49 / 6.87 |
| c9 | Turquoise | bright | `#4FD8C4` | 0.548 | `#121417` | **10.50** | `#138F80` | 0.213 | 3.99 / 3.66 |
| c10 | Brown | deep | `#7A4E25` | 0.097 | `#FFFFFF` | **7.13** | `#7A4E25` | 0.097 | 7.13 / 6.54 |
| c11 | Lime | bright | `#A6D84A` | 0.577 | `#121417` | **11.02** | `#5E8A12` | 0.206 | 4.10 / 3.76 |
| c12 | Slate | deep | `#4D5B70` | 0.102 | `#FFFFFF` | **6.89** | `#4D5B70` | 0.102 | 6.89 / 6.32 |

The worst case for bright-tier dots is on `--color-surface-sunken` (L 0.839): 3.24 (sky) up to 3.84 (pink). All still meet 3:1.

**Dark theme** (bars sit on `--color-surface` `#1A1D23`; dots on surface or `--color-surface-raised` `#22262D`, and raised is the worst case shown):

| ID | Name | Tier | `bar` | L | `on-bar` | **on-bar : bar** | `dot` | dot L | **dot : raised** | bar : bg |
|---|---|---|---|---|---|---|---|---|---|---|
| c1 | Blue | deep | `#2F6BD0` | 0.157 | `#FFFFFF` | **5.08** | `#6A9BEA` | 0.324 | 5.41 | 3.66 |
| c2 | Orange | bright | `#F59A2E` | 0.427 | `#121417` | **8.39** | `#F59A2E` | 0.427 | 6.90 | 8.45 |
| c3 | Green | deep | `#13805F` | 0.164 | `#FFFFFF` | **4.91** | `#3DB88E` | 0.372 | 6.11 | 3.79 |
| c4 | Pink | bright | `#E98AC4` | 0.395 | `#121417` | **7.82** | `#E98AC4` | 0.395 | 6.43 | 7.88 |
| c5 | Sky | bright | `#5CB8F0` | 0.428 | `#121417` | **8.41** | `#5CB8F0` | 0.428 | 6.92 | 8.47 |
| c6 | Red | deep | `#C93D33` | 0.160 | `#FFFFFF` | **5.00** | `#EE6F64` | 0.305 | 5.13 | 3.72 |
| c7 | Yellow | bright | `#DDBE36` | 0.525 | `#121417` | **10.10** | `#DDBE36` | 0.525 | 8.31 | 10.18 |
| c8 | Purple | deep | `#8352D6` | 0.157 | `#FFFFFF` | **5.07** | `#A783EE` | 0.306 | 5.15 | 3.67 |
| c9 | Turquoise | bright | `#45C4B2` | 0.440 | `#121417` | **8.60** | `#45C4B2` | 0.440 | 7.08 | 8.67 |
| c10 | Brown | deep | `#976231` | 0.155 | `#FFFFFF` | **5.11** | `#C99560` | 0.348 | 5.75 | 3.64 |
| c11 | Lime | bright | `#96C443` | 0.464 | `#121417` | **9.03** | `#96C443` | 0.464 | 7.43 | 9.10 |
| c12 | Slate | deep | `#5C6B82` | 0.144 | `#FFFFFF` | **5.41** | `#93A1B8` | 0.352 | 5.81 | 3.44 |

**Why dark mode differs from light mode:**
- **Deep fills are lifted** from L 0.09–0.15 to about L 0.15. They separate from the near-black page by at least 3.4:1 and still keep white text at 4.9:1 or more.
- **The three most luminous bright fills** (yellow, turquoise and lime) are dimmed 10–20% to avoid glare at night.
- **Each person keeps the same text colour** (white or ink) in both themes.

**Picker names:** "Blue", "Orange", "Green", "Pink", "Sky", "Red", "Yellow", "Purple", "Turquoise", "Brown", "Lime", "Slate". These are UI copy, not stored data. Add them as `PERSON_COLOR_NAMES` in `shared/colors.ts`.

### 3.4 Distinguishability and colour-vision deficiency (CVD)

- **Hue order.** c1–c8 follow the Okabe–Ito CVD-safe set: blue, orange, bluish green, reddish-purple/pink, sky blue, vermillion-red, yellow and purple. The seed group (c1–c10) and any group of 8 people or fewer get the most separable set.
- **Alternating tiers.**
  - The order is c1 deep, c2 bright, c3 deep, c4 bright, c5 bright, c6 deep, c7 bright, c8 deep.
  - In light mode the tiers differ in luminance by at least **2.2:1** (deep L ≤ 0.152, bright L ≥ 0.395).
  - The label colour also flips between tiers (white or ink), in both themes. That is a strong cue that does not depend on hue.
  - The picker pre-selects the first unused colour, so the first friends to join alternate tiers.
- **Known residual confusion pairs.** These are same-tier pairs that are close under deuteranopia or protanopia:
  - Blue c1 and Purple c8, partly separated by lightness (L 0.127 vs 0.090)
  - Sky c5 and Turquoise c9
  - Orange c2 and Yellow c7 (L 0.43 vs 0.64)
  - Red c6 and Brown c10
  - Yellow c7 and Lime c11

  The later member of each pair sits late in the order (c7 and later). **Names on every bar** remain the guaranteed differentiator, as BRIEF §4.8 accepts.
- **Stack separation.** Lanes have a 2px gap, so two bars of the same colour (duplicates once there are more than 12 people) still read as separate objects.
- **Verification (QA and critic).**
  - In Chrome DevTools, open Rendering > "Emulate vision deficiencies" and check the seeded month in protanopia, deuteranopia, tritanopia and achromatopsia.
  - Expected: every bar is identifiable by its label, and bars in adjacent lanes that come from different tiers differ visibly in lightness.

---

## 4. Spacing, radii, elevation and sizes

### 4.1 Spacing scale (base unit 4px)

| Token | Value | Token | Value |
|---|---|---|---|
| `--space-0` | 0 | `--space-5` | 20px |
| `--space-px` | 1px | `--space-6` | 24px |
| `--space-0-5` | 2px | `--space-8` | 32px |
| `--space-1` | 4px | `--space-10` | 40px |
| `--space-1-5` | 6px | `--space-12` | 48px |
| `--space-2` | 8px | `--space-16` | 64px |
| `--space-3` | 12px | `--space-20` | 80px |
| `--space-4` | 16px | | |

### 4.2 Layout tokens

| Token | <768px | 768–1199px | ≥1200px | Notes |
|---|---|---|---|---|
| `--container-max` | 1280px | 1280px | 1280px | Max content width, centred (`margin-inline: auto`) |
| `--page-gutter` | 12px | 24px | 32px | Page inline padding. Combine with safe areas: `max(var(--page-gutter), env(safe-area-inset-left))` |
| `--cal-gutter` | 4px | 24px | 32px | Month grid only: nearly full-bleed on phones |
| `--page-pad-top` | 12px | 16px | 24px | Toolbar to content |
| `--page-pad-bottom` | `calc(88px + env(safe-area-inset-bottom))` | same | `calc(104px + env(safe-area-inset-bottom))` | Keeps the last row clear of the FAB |
| `--content-narrow` | 100% | 640px | 640px | People, Admin and NotFound column |
| `--header-h` | 52px | 60px | 60px | Sticky header |
| `--toolbar-h` | 48px | 56px | 56px | MonthToolbar |
| `--admin-banner-h` | 40px | 40px | 40px | Inside the sticky header block |
| `--sheet-pad` | 16px | 24px | 24px | Sheet body padding |
| `--sheet-panel-w` | — | 420px | 420px | Right-side panel |
| `--sheet-max-h` | `calc(100dvh - 48px)` | 100dvh | 100dvh | The bottom sheet leaves 48px of context visible |
| `--dialog-w` | `min(400px, 100vw - 32px)` | 400px | 400px | PinDialog, ConfirmDialog, Reset PIN |
| `--gate-card-w` | `min(400px, 100vw - 24px)` | 400px | 400px | Gate and admin login card |
| `--stack-gap` | 20px | 24px | 24px | Vertical gap between form fields |

### 4.3 Control sizes

| Token | Value | Use |
|---|---|---|
| `--tap-min` | 44px | Minimum hit area (exceptions in §6.1) |
| `--control-h-sm` | 36px | Small button (visual). Extend the hit area to 44px with `::before { content: ""; position: absolute; inset: -4px 0; }` |
| `--control-h` | 44px | Default button, segmented control track |
| `--control-h-lg` | 52px | Gate submit, sticky "Save plan", dialog primary |
| `--input-h` | 48px | Text and date inputs |
| `--pin-input-h` | 56px | PinInput |
| `--fab-size` | 56px | FAB |
| `--checkbox-size` | 22px | Visual box. The whole label row is a 44px target |
| `--dot-sm` / `--dot-md` / `--dot-lg` | 10 / 12 / 14px | Person dots: chips and timeline / list rows / people page |
| `--swatch-size` | 36px | ColorSwatchPicker circle |
| `--icon-sm` / `--icon-md` / `--icon-lg` | 16 / 20 / 24px | lucide icons |
| `--icon-stroke` | 2 | lucide `strokeWidth` |

### 4.4 Radii

| Token | Value | Used for |
|---|---|---|
| `--radius-xs` | 4px | Calendar bars, checkbox |
| `--radius-sm` | 6px | Timeline bars |
| `--radius-md` | 10px | Inputs, buttons, banners |
| `--radius-lg` | 16px | Cards, sheet top corners, dialogs |
| `--radius-full` | 9999px | Pills, dots, FAB, chips, segmented control |

### 4.5 Elevation

| Token | Light | Dark |
|---|---|---|
| `--shadow-1` | `0 1px 2px #1A1C2014` | `0 1px 2px #00000080` |
| `--shadow-2` | `0 4px 16px #1A1C201F` | `0 4px 16px #00000080` |
| `--shadow-3` | `0 12px 40px #1A1C2033` | `0 12px 40px #00000099` |
| `--shadow-fab` | `0 6px 20px #1A1C2047` | `0 6px 20px #00000099` |

### 4.6 Z-index

| Token | Value |
|---|---|
| `--z-cell-bg` | 0 |
| `--z-bars` | 1 |
| `--z-cells` | 2 |
| `--z-sticky-col` | 3 |
| `--z-sticky-head` | 4 |
| `--z-sticky-corner` | 5 |
| `--z-header` | 20 |
| `--z-fab` | 30 |
| `--z-toast` | 50 |

Sheets and dialogs use the native top layer (`showModal()`), so they need no z-index.

---

## 5. Breakpoints and the hard layouts

### 5.1 Breakpoints

CSS variables can't be used inside `@media`, so use these literal queries.

| Name | Query | Reference | What changes |
|---|---|---|---|
| `base` | (none) | 375px (supported down to 320px) | Month grid with 3 lanes and name-only bars. Header has the mark, ViewSwitch, chip and menu. FAB is icon-only. Sheets are bottom sheets. Short month title ("Sep 2026") |
| `compact` | `(max-width: 359.98px)` | 320px | ActingAsChip shows the dot only. FilterButton reads "All" or "3/10". Prev/Next buttons are 40×44px |
| `sm` | `(min-width: 400px)` | 414px | Full month name in the toolbar ("September 2026") |
| `md` | `(min-width: 768px)` | 768px | Month grid with 4 lanes; bars read "{name} · {title}". App name text appears in the header. FAB gets a label. Sheets become a 420px right panel. Timeline name column is 160px. Weekday header reads "Mon … Sun" |
| `lg` | `(min-width: 1200px)` | 1200px | Month grid with 6 lanes. 32px gutters |
| `xl` | `(min-width: 1440px)` | 1440px | Desktop reference. 1280px container centred (80px side margins). A 31-day timeline fits without scrolling |
| — | up to 1920px | — | Container stays 1280px, centred. No further changes |

Scope hover styles with `@media (hover: hover) and (pointer: fine)` so touch devices never get sticky hover.

### 5.2 Month grid geometry (prototyped first, at 375px)

**Arithmetic at 375px:**

| Step | Value |
|---|---|
| Viewport | 375px |
| `--cal-gutter` × 2 | −8px, leaving a grid width of 367px |
| Day column | 367 / 7 = **52.4px** (50.3px at 360; 44.6px at 320) |
| Bar inset at a rounded end | 2px each side, so a 1-day bar is **48.4px** wide |
| Label padding | 5px each side, leaving **38.4px of text** on a 1-day bar |
| 12px/600 system font (about 6.4px per average character) | **1-day bar: about 6 characters.** "Martin", "Klára" and "Tomáš" fit; "Kateřina" shows as "Kateř…" |
| 2-day bar | 2 × 52.4 − 4 = 100.9px, giving about 90px of text, or **about 14 characters**. A first name always fits, which meets "the name is visible on every segment at least 2 days wide" |
| Lane | 18px bar + 2px gap = **20px pitch** |
| Week row | 24px date row + 3 × 20px lanes + 4px bottom = **88px** |
| 6-row month | 528px. Adding the header (52), toolbar (48) and weekday row (24) gives **652px**. That fits a typical 375×812 phone's visible Safari or Chrome area (about 660–720px) |

**Why these numbers:**
- **Label size.** 12px semibold is the smallest size that stays legible at arm's length. At 11px, Android's Roboto starts losing Czech diacritics.
- **Bar height.** 18px is the smallest bar that holds 12px text with even vertical room (line height 18px).
- **Lane gap.** The 2px gap guarantees that the bounding boxes never intersect (the overlap e2e test).
- **Gutter.** A 4px gutter instead of 12px gives each day 2.3px more, which is about one more character per 1-day bar.
- **Lane cap.** Three lanes (the BRIEF cap) show the seed's "4 people away on one weekend" case as 3 bars plus "+1".

**Calendar tokens by breakpoint:**

| Token | <768px | 768–1199px | ≥1200px |
|---|---|---|---|
| `--cal-weekday-h` | 24px | 32px | 32px |
| `--cal-date-row-h` | 24px | 28px | 28px |
| `--cal-lanes` | 3 | 4 | 6 |
| `--cal-bar-h` | 18px | 18px | 18px |
| `--cal-lane-gap` | 2px | 2px | 2px |
| `--cal-lane-pitch` | 20px | 20px | 20px |
| `--cal-row-pad-bottom` | 4px | 6px | 6px |
| `--cal-week-h` | **88px** | **114px** | **154px** |
| `--cal-bar-inset` | 2px | 2px | 3px |
| `--cal-bar-radius` | 4px | 4px | 4px |
| `--cal-bar-arrow` | 5px | 5px | 6px |
| `--cal-bar-pad` | 5px | 6px | 6px |
| `--cal-bar-pad-cont` | 9px | 10px | 11px |
| `--cal-date-size` (weight 600) | 12px | 13px | 13px |
| `--cal-today-size` | 20px | 24px | 24px |
| `--cal-date-inset` | 4px | 6px | 6px |

`--cal-week-h` equals the date row plus lanes × pitch plus the bottom pad. Set it as an explicit `height` on `WeekRow` so data can never change it.

At 1440×900 (desktop), the chrome (60 + 56 + 32) plus 5 × 154 comes to 918px. A 5-row month therefore scrolls about 20–40px vertically, and that is accepted: the 6-lane cap comes from the brief, and readability wins over fitting the screen.

**Week-row structure.** Three layers share one CSS grid area:

```
WeekRow  position: relative; height: var(--cal-week-h);
         display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
         grid-template-rows: var(--cal-date-row-h) repeat(var(--cal-lanes), var(--cal-lane-pitch)) var(--cal-row-pad-bottom);
 ├─ layer 1  CellBackgrounds (aria-hidden): 7 divs, each spanning all rows. z: --z-cell-bg
 │           fill = today-bg > surface-sunken (outside month) > surface-weekend > surface
 ├─ layer 2  Bars (aria-hidden, pointer-events: none). z: --z-bars
 │           EventBar at grid-column: startCol+1 / span N; grid-row: lane + 2 (row 1 is the date row)
 └─ layer 3  DayCell <button>s: 7 transparent buttons spanning all rows. They hold the date number and "+N". z: --z-cells
```

- Buttons sit above the bars, so a tap anywhere in a cell (including on a bar) opens `/day/:date`.
- The focus ring is never hidden by a bar.

**Grid lines:**
- 1px `--color-border` between week rows (`border-top` on rows 2+).
- 1px `--color-border` between columns (`border-inline-start` on CellBackgrounds 2–7).
- At 768px and up, the grid has a 1px `--color-border` outer border, `--radius-md` corners and `overflow: hidden`.
- Below 768px there are no outer side borders (full bleed).

**Day number:**
- Top-left at `--cal-date-inset`, size `--cal-date-size` at weight 600, tabular numerals.
- Colour: `--color-text` in the month, `--color-text-muted` outside it.
- **Today:**
  - The number sits centred in a `--cal-today-size` circle filled with `--color-primary`.
  - The number is `--color-on-primary` at weight 700.
  - The cell background is `--color-today-bg`.
  - The circle is a shape cue, so colour is not the only signal.
- **The 1st of a month** (in or outside the month) reads "1 Nov" at 768px and up. Below 768px it shows the number only.

**"+N" indicator:**
- Placement: top-right of the date row, 3px from the right edge, vertically centred in the date row.
- Pill: 16px tall, padding `0 4px`, `--radius-full`, background `--color-chip`.
- Text: `--color-text`, 12px/700, line height 16px, tabular numerals.
- It lives inside the DayCell button and is `aria-hidden`. Its meaning is carried by the button's `aria-label`.
- At 320px, "28" plus "+12" still fits: about 13px + 2px + 25px inside 44.6px.

**EventBar (calendar variant):**
- **Box:** height `--cal-bar-h`.
  - `margin-inline-start: var(--cal-bar-inset)` unless `continuesBefore`, in which case 0, and the bar runs to the grid edge.
  - The same rule applies to the end: `margin-inline-end` is 0 when `continuesAfter`.
- **Paint:** the fill is drawn on `::before` (`position: absolute; inset: 0; background: var(--bar); border-radius; clip-path; box-shadow: inset 0 0 0 1px var(--bar-edge)`).
  - The element itself is never clipped.
  - The label sits above with `position: relative`.
- **Label:**
  - Font `--text-bar` with line height `--leading-bar`, colour `var(--on-bar)`.
  - `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
  - Padding `--cal-bar-pad`, or `--cal-bar-pad-cont` on the side next to a notch or arrow.
  - Every segment renders its own label, so the label repeats at the start of every segment.
- **Label content:**
  - Below 768px: `{name}`.
  - At 768px and up: `<span class="name">{name}</span> · {title}`. The name is weight 600 and the separator and title are weight 400.
- **Continuation edges** (`a` = `--cal-bar-arrow`):

  | Case | Shape | `clip-path` |
  |---|---|---|
  | `continuesAfter` | Right **arrow point** | `polygon(0 0, calc(100% - a) 0, 100% 50%, calc(100% - a) 100%, 0 100%)` |
  | `continuesBefore` | Left **notch** (chevron tail) | `polygon(0 0, 100% 0, 100% 100%, 0 100%, a 50%)` |
  | Both | Both shapes | `polygon(0 0, calc(100% - a) 0, 100% 50%, calc(100% - a) 100%, 0 100%, a 50%)` |

  - Rounded ends keep `--cal-bar-radius`. Continuing sides get a 0 radius, so set the logical corner radii individually.
  - The arrow at the end of one week row visually plugs into the notch at the start of the next, so continuation reads without colour.
- **Post-save highlight:** `data-highlight="true"` for `--duration-highlight`. A `::after` ring (`inset: -3px`, `border: 2px solid var(--color-focus)`, `border-radius: 6px`, no clip-path) animates per §7.

**Weekday header:**
- Height `--cal-weekday-h`, 12px/600 in `--color-text-muted`, centred.
- Below 768px: "M T W T F S S" as `<abbr title="Monday">M</abbr>`. At 768px and up: "Mon" … "Sun".
- The Saturday and Sunday header cells use `--color-surface-weekend`.

**Empty month (CLS-safe):**
- The brief asks for a banner "above the grid". Inserting it in the flow after the data arrives would push the whole grid down by about 60px. At 375px that is a CLS of about 0.08, above the 0.05 budget.
- **Decision:** render the empty-state card as an **overlay** inside the grid wrapper:
  - `position: absolute; top: calc(var(--cal-weekday-h) + var(--cal-week-h) * 0.5); left: 50%; transform: translateX(-50%); width: min(320px, calc(100% - 24px));`
  - `pointer-events: auto` on the card only.
- It is still visually at the top of the grid. The grid stays visible and nothing shifts.
- The card variant is in §6.7.

### 5.3 Timeline geometry

| Token | <768px | ≥768px | Notes |
|---|---|---|---|
| `--tl-name-w` | 96px | 160px | Sticky left column |
| `--tl-col-min` | 36px | 36px | `grid-template-columns: var(--tl-name-w) repeat(N, minmax(var(--tl-col-min), 1fr))` |
| `--tl-head-h` | 48px | 48px | Sticky header row: weekday initial and day number |
| `--tl-away-h` | 32px | 32px | Sticky "Away" row directly under the header (`top: var(--tl-head-h)`) |
| `--tl-row-pad` | 8px | 8px | Top and bottom padding inside each person row |
| `--tl-bar-h` | 28px | 28px | Bar `<button>` (BRIEF minimum is 24px) |
| `--tl-lane-gap` | 4px | 4px | |
| `--tl-row-h` (1 lane) | **44px** | **44px** | A row with n lanes is `16 + 28n + 4(n − 1)` px tall |
| `--tl-bar-inset` | 2px | 2px | At rounded ends. 0 at clipped (continuing) ends |
| `--tl-bar-radius` | 6px | 6px | |
| `--tl-bar-arrow` | 6px | 6px | Same polygon scheme as the calendar |
| `--tl-bar-pad` / `--tl-bar-pad-cont` | 6px / 10px | 8px / 12px | Label padding, plain end / next to a notch or arrow |

**Fit and scroll by width:**

| Width | Calculation | Result |
|---|---|---|
| 1440px | Container 1280px, minus the 160px name column, leaves 1120px; 1120 / 31 = **36.1px** per column | ≥ 36, **no scrolling**. A 17px Windows scrollbar does not change this: the viewport becomes 1423px and the container is still 1280px |
| 768px | Container 720px: (720 − 160) / 31 = 18px | Columns clamp to 36px and the container scrolls |
| 375px | Container 351px minus 96px leaves 255px | About **7 days visible**; the month scrolls |

**Scroll container** (`data-testid="timeline-scroll"`):
- `overflow: auto` on both axes, `overscroll-behavior-x: contain`, `-webkit-overflow-scrolling: touch`.
- `max-height: calc(100dvh - var(--header-h) - var(--toolbar-h) - 24px)`. Subtract `--admin-banner-h` too while the admin banner is shown.
- Scrolling both axes inside the container is what lets the sticky header and the sticky name column work together. The page never scrolls horizontally.
- Border `1px solid var(--color-border)`, plus `--radius-md` at 768px and up.

**Sticky parts:**
- Header row: `top: 0`, `--z-sticky-head`.
- AwayRow: `top: var(--tl-head-h)`, `--z-sticky-head`.
- Name column: `left: 0`, `--z-sticky-col`.
- Top-left corner cells: both, `--z-sticky-corner`.
- All sticky cells are opaque (`--color-surface`).
- The name column has `border-inline-end: 1px solid var(--color-border)`. When `scrollLeft > 0` (the view sets `data-scrolled`), it adds `box-shadow: 4px 0 8px -4px var(--sticky-shadow)`.

**Header cell** (`<button>`, 36×48px, wider at 1440px):
- Weekday initial: 12px/500, `--color-text-muted`.
- Day number: 14px/600, `--color-text`, tabular.
- Today: the number sits in a 24px `--color-primary` circle with `--color-on-primary` text.

**Column treatments** (they run through the header, the away row and all rows):
- Weekend columns use `--color-surface-weekend`.
- The today column uses `--color-today-bg`.
- Monday columns get `border-inline-start: 1px solid var(--color-border-week)`. Other days use `--color-border`.

**Name cell:**
- Dot `--dot-sm`, 8px gap, then the name in `--text-sm`/500, single line with ellipsis.
- Padding `0 8px 0 12px`. At 96px wide that leaves about 58px for the name (about 8 characters).
- The full name is in the row's accessible name.
- At 768px and up, the acting person gets "You" (12px/700, `--color-text-muted`) under the name.

**AwayRow:**
- Label cell "Away", 12px/600, `--color-text-muted`.
- Each day cell shows the distinct-people count (12px/700, tabular, `--color-text`). Zero shows "–" in `--color-text-muted`.
- Background by the share of filtered people away: 0 keeps the column background; up to 25% `--color-away-1`; up to 50% `--color-away-2`; more than 50% `--color-away-3`.
- The number is always shown, so colour is never the only cue.

**Bars:**
- Each bar is a `<button>` placed in its lane's grid row.
- Label: the plan title in `--text-bar` with a 28px line height.
- Paint and edges use the same `::before` technique as the calendar.
- 1-day bars are 32px wide: about 3 characters plus an ellipsis. The accessible name carries the full text.

**Auto-scroll:**
- On load, if the month contains today, set `scrollLeft = max(0, (todayIndex - 2) * columnWidth)`.
- Use `behavior: 'auto'` (instant), never smooth.

### 5.4 App shell layouts

**Header:**
- Sticky, height `--header-h`, opaque `--color-bg`, 1px bottom border `--color-border`.
- Inline padding `--page-gutter`. Items are in one flex row with a 4px gap below 768px and a 12px gap at 768px and up.

| Width | Left | Centre | Right |
|---|---|---|---|
| <768px | App-mark link, 40×44 (24px mark), `aria-label="Friends Plans, this month's calendar"` | ViewSwitch (about 145px) | ActingAsChip (`max-width: 110px`), Menu IconButton 44×44 |
| ≥768px | Mark + "Friends Plans" (17px/700, -0.01em) | ViewSwitch (segments min 96px) | ActingAsChip (`max-width: 220px`), Menu |

- **Budget at 375px:** 351px = 40 + 4 + 145 + 4 + 110 + 4 + 44.
- **ViewSwitch below 768px:** 13px/600 labels with `0 8px` padding: "Calendar" is 73px and "Timeline" is 68px, plus 4px of track.
- **Below 360px:** the chip collapses to a 44×44 dot-only button.

**MonthToolbar:**
- Height `--toolbar-h`, not sticky, inline padding `--page-gutter`.
- Left: the `<h1>` month title (`--text-lg` below 768px, `--text-xl` at 768px and up), with no wrapping.
- Right: Prev IconButton, "Today" (`sm` secondary, padding `0 12px`), Next IconButton, 4px gap, FilterButton.

| Width | Fit |
|---|---|
| 375px | Title "Sep 2026" (about 80px) + 44 + 64 + 44 + 4 + 91 ("3 of 10") = 327px, within 351px |
| 320px (compact) | Prev/Next 40px, Today padding `0 10px` (60px), FilterButton "3/10" (68px): 80 + 40 + 60 + 40 + 4 + 68 = 292px, within 296px |

**Fab:**
- `position: fixed; right: max(16px, calc(env(safe-area-inset-right) + 16px)); bottom: calc(16px + env(safe-area-inset-bottom));`
- At 1200px and up: `right: max(32px, calc((100vw - 1280px) / 2))`, which aligns it with the container edge.

**Sheets:**
- **Below 768px (bottom sheet):**
  - Full width, `max-height: var(--sheet-max-h)`, top corners `--radius-lg`.
  - Grabber: 36×4px, `--color-border-strong`, decorative, centred, 8px from the top.
  - Header row: 56px, with the title and a close IconButton.
  - Scrolling body.
  - Optional sticky footer with `padding: 12px var(--sheet-pad) calc(12px + env(safe-area-inset-bottom))` and a 1px `--color-border` top border.
- **768px and up (side panel):** a right-side panel, `--sheet-panel-w` wide, full height, square corners, `--shadow-3`.
- **Both:** `--color-surface-raised` background and a `--color-scrim` backdrop.

**Dialogs** (PinDialog, ConfirmDialog, Reset PIN):
- A centred `<dialog>`: `--dialog-w`, `--radius-lg`, `--shadow-3`, `--color-surface-raised`, padding 24px.
- Below 768px: `margin-top: 12dvh` instead of vertical centring, so the numeric keyboard never covers the input.

---

## 6. Component states

### 6.1 Global rules

**Focus-visible (every interactive element):**
- Default: `outline: 2px solid var(--color-focus); outline-offset: 2px;`.
- Inset (`outline-offset: -2px`): DayCell, full-width list rows, menu rows and timeline header cells, so neighbours don't clip the ring.
- Inputs: `border-color: var(--color-focus); box-shadow: 0 0 0 1px var(--color-focus);` (a 2px ring in total) and no outline.
- The focus colour is at least 3:1 on every surface (§3.2).
- Mouse focus shows no ring: `:focus:not(:focus-visible) { outline: none }`.

**Hover:**
- Only inside `@media (hover: hover) and (pointer: fine)`.
- Applied **instantly** (no colour transitions, §7).
- Implementation: `background-image: linear-gradient(var(--color-hover), var(--color-hover))`, so the base background token stays.

**Active (pressed):** the `--color-pressed` overlay plus `transform: scale(0.98)` (buttons) or `scale(0.96)` (FAB, IconButton), over `--duration-instant`.

**Disabled:**
- `--color-disabled-bg` and `--color-disabled-text`, border `--color-border`, `cursor: not-allowed`, no hover or active styles.
- Use the native `disabled` attribute, except when loading (below).

**Loading (buttons):**
- Width is locked: set `min-width` to the rendered width.
- The label is replaced by a 16px Spinner in `currentColor`; the label text stays in a visually hidden span.
- Set `aria-busy="true"` and `aria-disabled="true"` and ignore clicks. Not `disabled`, so focus stays on the button.

**Error (fields):**
- Border `--color-danger` plus `box-shadow: 0 0 0 1px var(--color-danger)`.
- Below the field, an `AlertCircle` 16px icon and the message in `--text-sm` `--color-danger`, linked by `aria-describedby`. Set `aria-invalid="true"`.
- On submit, focus moves to the first invalid field.

**Tap targets:**
- At least 44×44px, using `::before` hit-area expansion for visually smaller controls.
- Documented exceptions, all of which still exceed WCAG 2.5.8 AA (24×24):
  - Timeline header cells: 36×48px
  - 1-day timeline bars: 32×28px
  - Compact (<360px) Prev/Next buttons: 40×44px

### 6.2 Primitives

| Component | Default | Hover | Focus-visible | Active | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| **Button `primary`** | `--color-primary` bg, `--color-on-primary`, `--text-base`/600, height `--control-h` (lg: `--control-h-lg`), padding `0 20px`, `--radius-md` | bg `--color-primary-hover` | ring | scale(0.98) | §6.1 | spinner in on-primary | — |
| **Button `secondary`** | `--color-surface` bg (`--color-surface-raised` inside sheets), 1px `--color-border-strong`, `--color-text` | hover overlay | ring | pressed overlay + scale | §6.1 | spinner | — |
| **Button `ghost`** | transparent, `--color-text` | hover overlay | ring | pressed overlay | text `--color-disabled-text` | spinner | — |
| **Button `danger`** | `--color-danger-solid`, `--color-on-danger` | `--color-danger-solid-hover` | ring | scale | §6.1 | spinner in white | — |
| **Button `danger-ghost`** | transparent, text and 1px border `--color-danger` | bg `--color-danger-bg` | ring | pressed overlay | §6.1 | spinner | — |
| **Button `link`** | inline, `--color-accent`, 1px underline, `text-underline-offset: 3px` | 2px underline | ring (radius 4px) | — | muted, no underline | — | — |
| **Size `sm`** | height 36px visual (44px hit), `--text-sm`/600, padding `0 12px` | | | | | | |
| **IconButton** | 44×44, icon `--icon-md`, `--color-text`, transparent, `--radius-full`. `aria-label` required | hover overlay | ring | scale(0.96) | icon at 40% opacity | spinner replaces icon | — |
| **TextField / TextArea** | Label above (`--text-sm`/600, `--color-text`, 6px gap). Field `--input-h` (textarea: min 120px, max 280px, `resize: vertical`), `--color-input-bg`, 1px `--color-border-strong`, `--radius-md`, padding `0 14px` (textarea `12px 14px`), `--text-base`. Hint below (`--text-sm` muted). Notes counter right-aligned (`--text-xs` muted; `--color-danger` past the limit) | border `--color-text-muted` | input ring | — | bg `--color-disabled-bg`, text `--color-disabled-text` | — | §6.1 |
| **DateField** | As TextField, native `type="date"`, tabular numerals. `color-scheme` follows the theme, so the picker icon shows in dark mode. "From" and "To (last day)" sit side by side with a 12px gap at 360px and up, and stack below 360px | as TextField | as TextField | — | as TextField | — | e.g. "End date can't be before the start" under "To" |
| **Checkbox** | 22px box, `--radius-xs`, 2px `--color-border-strong`, label `--text-base`. The whole row is a 44px target | box border `--color-text` | ring around the box | — | §6.1 | — | — |
| **Checkbox (checked)** | box filled `--color-primary`, `Check` 16px in `--color-on-primary` | | | | | | |
| **Radio (EventForm "Who")** | 22px circle, 2px `--color-border-strong`. Checked: border `--color-primary` + 10px inner dot `--color-primary`. The row (52px) is the target | row hover overlay | ring around the circle | pressed overlay | §6.1 | — | group error under the legend |
| **SegmentedControl** (ViewSwitch, Theme) | Track: `--color-surface-sunken` (light) or `--color-chip` (dark), `--radius-full`, padding 2px, height 44px. Segments 40px tall, `--text-sm`/600, `--color-text-muted` | unselected text `--color-text` | ring on the segment | — | — | — | — |
| **Segment (selected)** | bg `--color-surface` (dark: `--color-surface-raised`), `--shadow-1`, text `--color-text`. `aria-current="page"` (ViewSwitch links) or checked radio (Theme) | | | | | | |
| **Spinner** | Ring of 16, 20 or 24px, 2px stroke: a `currentColor` arc on a track at 25% opacity, rotating | | | | | | |
| **Skeleton** | `--color-skeleton` block, `--radius-xs`. A `::after` shimmer stripe (`--color-shimmer`, 40% wide) | | | | | | |
| **Icon** | lucide, sized by `--icon-*`, `strokeWidth={2}`, `aria-hidden="true"` unless standalone (then `role="img"` + label) | | | | | | |

### 6.3 App shell

| Component | Spec and states |
|---|---|
| **Header** | Layout in §5.4. `position: sticky; top: 0; z-index: var(--z-header)`. When admin mode is active, the AdminBanner is rendered inside the same sticky block, under the header row. |
| **App-mark link** | 24px inline SVG (§8.3) in a 40×44 target with `--radius-md`. Hover overlay, focus ring. Shows the text "Friends Plans" at 768px and up. |
| **ViewSwitch** | SegmentedControl of two `<a>` links, "Calendar" and "Timeline". The selected link has `aria-current="page"`. Segment padding is `0 8px` below 768px and `0 16px` at 768px and up. Labels are 13px/600 below 768px. |
| **ActingAsChip** | Pill: 36px visual height (44px hit), `--color-chip`, padding `0 10px 0 8px`. Contents: dot `--dot-sm`, 6px gap, name (13px/600 below 768px, `--text-sm`/600 at 768px and up) with ellipsis. **No person:** a 10px ring dot in `--color-text-muted` + "Who are you?". **Admin mode:** a 14px `ShieldCheck` in `--color-warning` is appended. **Hover:** overlay. **Focus:** ring. **Active:** scale(0.98). **Loading** (session unknown): Skeleton pill 88×36. **Below 360px:** dot only, with `aria-label` "Acting as {name}. Change" or "Who are you?". `data-testid="acting-as"`. |
| **Menu button** | IconButton `Menu`, `aria-label="Menu"`, `aria-haspopup="dialog"`. |
| **MenuSheet** | Sheet titled "Menu". When acting, it opens with a 64px identity block: dot `--dot-lg` + name in `--text-lg` + "This device acts as {name}" (`--text-sm` muted). Rows are 52px tall, padding `0 var(--sheet-pad)`: icon (`--icon-md`, muted) + label (`--text-base`/500) + `ChevronRight` for navigation rows, with 1px `--color-border` dividers. Items: People (`Users`); Admin (`ShieldCheck`); a "Theme" label (`--text-sm`/600 muted) with SegmentedControl System / Light / Dark; "Forget me on this device" (`UserX`, only while acting); "Lock calendar" (`Lock`, text and icon `--color-danger`). Rows have hover overlay, inset ring and pressed overlay. |
| **MonthToolbar** | Layout in §5.4. Prev/Next are IconButtons `ChevronLeft`/`ChevronRight` labelled "Previous month" / "Next month". "Today" is an `sm` secondary button, always enabled. |
| **FilterButton** | `sm` secondary: `Filter` 16px + "All" or "3 of 10" (tabular; "3/10" below 360px with `aria-label` "Filter people: 3 of 10"). **Active filter:** bg `--color-accent-subtle`, border `--color-accent`, text `--color-text`. The state is also in the label text. |
| **PersonFilter** | Sheet titled "Show people". Top row: "All" and "None" as `sm` ghost buttons. Then Checkbox rows (52px): dot `--dot-md` + name, sorted by name. Changes apply live. Footer: primary "Done", full width. No people: EmptyState block "No people yet." |
| **Fab** | **Below 768px:** a 56×56 circle, `--color-primary`, `Plus` 24px in `--color-on-primary`, `--shadow-fab`, `aria-label="Add plan"`. **768px and up:** a 56px-tall pill, padding `0 24px 0 20px`, icon + 8px + "Add plan" in `--text-base`/600. **Hover:** `--color-primary-hover`. **Focus:** ring with offset 3px. **Active:** scale(0.96). Preloads EventForm on `pointerdown`. Rendered only on the calendar and timeline. While DayDetail is open, the modal makes the FAB inert, and DayDetail's own "Add plan on this day" button takes its role. |
| **AdminBanner** | Height `--admin-banner-h`, full width, `--color-warning-bg`, 1px bottom border `--color-border`, inline padding `--page-gutter`. Contents: `ShieldCheck` 16px in `--color-warning` + "Admin mode: you can edit or delete any plan." (`--text-sm`/500, `--color-text`, single line with ellipsis; below 480px the visible text is "Admin mode") + right-aligned `sm` ghost "Exit admin mode". `role="status"`, `data-testid="admin-banner"`. |

### 6.4 Calendar and timeline

| Component | Spec and states |
|---|---|
| **MonthGrid** | Layout in §5.2. **Loading:** the grid renders from date maths with an empty bar layer, and a shimmer stripe sweeps each week row's lane area. There are no fake bars, so nothing pretends to be data. `aria-busy="true"`. **Empty:** overlay card (§5.2, §6.7). **Error:** ErrorBanner above the grid in normal flow; the grid stays without bars. Errors are rare and come after a user-visible failure, so the shift is accepted. |
| **DayCell `<button>`** | Transparent over the backgrounds. **Hover:** `box-shadow: inset 0 0 0 2px var(--color-border-strong)`. It is a ring, not a fill, so bar-label contrast is never reduced. **Focus-visible:** `outline: 2px solid var(--color-focus); outline-offset: -2px`. **Active:** inset ring in `--color-text`. **Today, outside-month and weekend:** see §5.2. Uses `touch-action: manipulation`. There is no disabled state: outside-month cells stay tappable. |
| **EventBar (calendar)** | Layout in §5.2. Not interactive (`pointer-events: none`, inside the `aria-hidden` layer), so it has no hover or focus state. Highlight per §7. |
| **TimelineGrid / TimelineRow** | Layout in §5.3. On pointer devices, row hover puts the overlay on the name cell. **Loading:** the header renders from date maths; 6 skeleton rows of 44px, each with a 10px circle and a 64×12px block in the name cell and empty day cells. **Empty:** EmptyState block "No people yet" with the primary button "Add person", inside the scroll area. **Error:** ErrorBanner above the timeline. |
| **EventBar (timeline `<button>`)** | Default per §5.3. **Hover:** a `::after` with the same `clip-path` and `box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--on-bar) 45%, transparent)`. **Focus-visible:** outline 2px `--color-focus`, offset 2px, `z-index: 2`; the element is unclipped, so the ring is complete. **Active:** scale(0.98). **Highlight:** as the calendar. Accessible name: "{name}: {title}, {place}, {range}". |
| **AwayRow** | Layout in §5.3. Not interactive. While loading, every cell shows "–". |
| **Timeline header cell `<button>`** | **Hover:** overlay. **Focus:** inset ring. **Active:** pressed overlay. **Today:** per §5.3. `aria-label` is the full date, e.g. "Monday 12 October 2026". |

### 6.5 Sheets and views

| Component | Spec and states |
|---|---|
| **Sheet** | Layout in §5.4. Title in `--text-lg`/700 below 768px and `--text-xl`/700 at 768px and up. Close: IconButton `X`, "Close". On open, focus goes to the element the view names (EventForm: the plan-name field), otherwise the first focusable. **Loading** (data not ready, e.g. a direct load of `/plans/:id`): a title skeleton (60% × 20px) and 3 skeleton lines. **Missing record:** EmptyState block "This plan no longer exists." with a "Back to the calendar" link. While open, the page behind doesn't scroll (`overflow: hidden` on `html`). |
| **DayDetail** | **Header:** Prev-day IconButton (`ChevronLeft`, "Previous day"), title "Monday 12 October 2026" (wraps to 2 lines below 400px), Next-day IconButton (`ChevronRight`, "Next day"). Below: "3 people away" (`--text-sm` muted). **List:** EventListItems with 1px `--color-border` dividers and no outer card. **Around:** heading "Around ({n})" (`--text-sm`/600 muted), then PersonBadge `chip`s wrapping with an 8px gap. **Filter note:** a row on `--color-accent-subtle`, `--radius-md`, padding 12px: `EyeOff` 16px + "2 plans hidden by filter" (`--text-sm`) + link button "Show all". **Action:** "Add plan on this day", secondary, full width, `Plus` icon, after the list. **Empty:** EmptyState block with `Sun` and "Everyone's around." |
| **EventListItem `<button>`** | Full width, min height 72px, padding `12px var(--sheet-pad)`, left-aligned. **Line 1:** dot `--dot-md` + name (`--text-sm`/600). **Line 2:** title (`--text-lg`/700, one line with ellipsis). **Line 3:** `MapPin` 14px + place (`--text-sm`, `--color-text`). **Line 4:** "12–16 Oct · day 2 of 5" (`--text-sm` muted, tabular). **Line 5:** notes preview (`--text-sm` muted, `white-space: pre-line`, `-webkit-line-clamp: 2`); omitted if there are no notes. Trailing `ChevronRight` muted. **Hover:** overlay. **Focus:** inset ring. **Active:** pressed overlay. `data-testid="day-event"`. |
| **EventDetail** | Owner PersonBadge `chip`. Title in `--text-2xl`/700 with `overflow-wrap: anywhere`. **Meta rows** (16px gap; 20px muted icon + `--text-base`): `MapPin` place; `CalendarDays` range; `Clock` duration ("5 days"). **Notes:** a block on `--color-surface-sunken` (dark: `--color-surface`), `--radius-md`, padding 16px, `--text-base`, `white-space: pre-wrap`, `overflow-wrap: anywhere`; omitted when empty. **Actions:** footer row with a 12px gap and equal widths: "Edit" (secondary, `Pencil`) and "Delete" (danger-ghost, `Trash2`). **Lock hint** (device is not the owner and admin is off): both buttons show a 14px `Lock` icon instead of their own, and a line below reads "{owner}'s PIN needed" (`--text-sm` muted). The buttons stay enabled because they open PinDialog. |
| **EventForm** | Sheet titled "Add plan" or "Edit plan". **Who, set:** PersonBadge `chip` + link button "Change" on one row. **Who, none:** fieldset with legend "Who", Radio rows (dot + name), and an `sm` secondary "I'm new here" with `UserPlus`. **Edit mode:** chip only, without "Change". Then Plan, Place, From/To (§6.2) and Notes. **Quick chips** (COULD): `sm` secondary pills "+1 day", "Weekend", "+1 week" under the dates. **Footer:** "Save plan", primary `lg`, full width. Sticky in the sheet below 768px; at 768px and up it ends the panel. Loading per §6.1. **Server or network error:** ErrorBanner at the top of the body, scrolled into view. |
| **PinDialog** | Dialog (§5.4). Contents: PersonBadge `chip`; title "Enter {name}'s PIN" (`--text-xl`/700); PinInput; Checkbox "Remember me on this device" (checked); primary `lg` "Continue", full width; ghost "Cancel" below. **Wrong PIN:** field error "Wrong PIN. {n} tries left before a short lock."; the input clears and keeps focus. **Lockout:** PinInput disabled; warning box (§6.7) "Too many tries. Try again in {m} min or ask the admin to reset your PIN."; Continue disabled. **Loading:** Continue shows loading. |
| **PinInput** | Height `--pin-input-h`, width 100% with max 240px, centred. `--text-2xl`/600, tabular, `letter-spacing: 0.35em`, `text-align: center`, masked, `--radius-md`. Other states as TextField. In PersonForm it is full width and left-aligned. |
| **ConfirmDialog** | Dialog. `AlertTriangle` 24px in `--color-danger`, then the title (`--text-xl`/700, e.g. `Delete "Ski trip" (12–16 Oct 2026)?`), then "This can't be undone." (`--text-base` muted). Buttons: secondary "Keep it" (receives initial focus as the safe default) and danger "Delete plan" or "Delete person". Stacked below 400px, otherwise in a right-aligned row. Loading on the danger button. |
| **PeoplePage** | Page in `--content-narrow`, padding-top `--page-pad-top`. `<h1>` "People" (`--text-2xl`). "Add person" (primary, `UserPlus`): full width under the title below 768px, right-aligned in the title row at 768px and up. **List card:** `--color-surface`, 1px `--color-border`, `--radius-lg`, overflow hidden. **Rows:** min height 64px, padding `12px 16px`, 1px dividers. Line 1: dot `--dot-lg` + name (`--text-base`/600) + "You" badge (`--color-chip`, `--text-xs`/700, 20px tall, `--radius-full`, padding `0 8px`). Line 2: "3 upcoming plans" (`--text-sm` muted). Actions on the right: "This is me" (`sm` secondary, hidden on your own row) and "Edit" (`sm` ghost, `Pencil`). Below 480px the actions wrap to a third line. Under the card: link button "Forget me on this device" (only while acting). **Loading:** 5 skeleton rows. **Empty:** EmptyState block "No people yet. Add yourself first." + "Add person". **Error:** ErrorBanner. |
| **PersonForm** | Sheet "Add person" or "Edit person". Fields: Name TextField (`autocapitalize="words"`, `autocomplete="off"`), ColorSwatchPicker, PIN and Confirm PIN (PinInput, full-width variant; the BRIEF help text sits under PIN), Checkbox "Remember me on this device". Footer: primary `lg` "Save person". Errors: "That name is taken.", "PINs don't match.", "Use 4–6 digits." |
| **ColorSwatchPicker** | `fieldset` with legend "Color", a radio group. Grid of 3 columns below 480px and 4 columns at 480px and up, 8px gap. **Tile:** a `<label>`, min 88×76px, `--radius-md`, padding 8px, centred column with the swatch (`--swatch-size`, `background: var(--bar); box-shadow: inset 0 0 0 2px var(--dot)`), 6px gap, then the label (`--text-xs`): the colour name, or for a taken colour a 12px `User` icon + the owner's name. **Hover:** tile overlay. **Focus-visible** (on the visually hidden radio): ring around the tile. **Selected:** swatch gets `box-shadow: inset 0 0 0 2px var(--dot), 0 0 0 2px var(--color-surface-raised), 0 0 0 4px var(--color-text)` and a centred 20px `Check` in `var(--on-bar)`; the label goes to weight 600. **Taken** (fewer than 12 used): the radio is `disabled`; the swatch shows the owner's initial (12px/700 in `--on-bar`); the label is muted; `cursor: not-allowed`; accessible name "Blue, taken by Klára". **All 12 taken:** every tile is enabled, labels still show owners, and a hint above reads "All colors are in use, so pick any. Names keep everyone apart." |
| **AdminPage** | **Signed out:** a card like the gate (§6.6), titled "Admin", with the field "Admin passcode" and the button "Enter admin mode", and the same error, lockout and loading states. **Signed in:** `<h1>` "Admin" + `<h2>` "People" (`--text-lg`) + a list card like PeoplePage. Row actions: "Reset PIN" (`sm` secondary, `KeyRound`) and "Delete person" (`sm` danger-ghost, `Trash2`). "Download backup (JSON)" (COULD) is a secondary button with `Download`, under the list. **Reset PIN dialog:** title "Reset {name}'s PIN", two PinInputs ("New PIN", "Confirm new PIN"), primary "Reset PIN", toast "PIN reset for {name}". |
| **NotFound** | Centred column in `--content-narrow`, `padding-top: 20dvh`. App mark at 48px, 24px gap, title "This page wandered off." (fluid, §2.2), 16px gap, primary `lg` link button "Back to the calendar". The app header still renders when authenticated. |

### 6.6 PasscodeGate

- **Page:** `--color-bg`, `min-height: 100dvh`, centred with `display: grid; place-items: center`, padding 24px.
- **Card:** `--gate-card-w`, `--color-surface`, 1px `--color-border`, `--radius-lg`, `--shadow-2`. Padding is `32px 24px`, and `40px 32px` at 768px and up.
- **Content** (left-aligned):
  1. App mark at 48px, then a 20px gap.
  2. The title "Friends Plans" (fluid), then a 4px gap.
  3. The tagline "Who's away, and when." in `--text-base` muted, then a 32px gap.
  4. The "Group passcode" field, then a 20px gap.
  5. A primary `lg` "Open calendar" button, full width.
- **States:**
  - **Wrong passcode:** a field error with the brief's copy.
  - **Lockout:** the warning box. The field and button are disabled.
  - **Submitting:** the button shows loading.
  - **Session check pending:** the static loading shell (§6.8). Don't show the card, so logged-in users never see the gate flash.

### 6.7 Feedback

| Component | Spec |
|---|---|
| **ToastRegion / Toast** | **Region:** fixed, centred horizontally. `bottom: calc(88px + env(safe-area-inset-bottom))` below 768px (above the FAB); `calc(24px + env(safe-area-inset-bottom))` at 768px and up. Width `min(420px, 100vw - 24px)`, 8px stack gap, at most 3 visible, `aria-live="polite"`, `--z-toast`. **Toast:** `--color-inverse-surface`, `--color-on-inverse`, `--text-sm`/500, `--radius-md`, padding `12px 16px`, `--shadow-2`. Icon 20px: `CheckCircle2` in `--color-toast-success` or `AlertCircle` in `--color-toast-danger`. **Optional action:** a text button in `--color-on-inverse`, weight 600, underlined, with a 44px hit area. **Timing:** auto-dismiss after 4s (6s for errors with an action); the timer pauses on hover and on focus-within. |
| **ErrorBanner** | `role="alert"`, `--color-danger-bg`, 1px border `color-mix(in srgb, var(--color-danger) 40%, transparent)`, `--radius-md`, padding `12px 16px`. Contents: `AlertTriangle` 20px in `--color-danger` + message (`--text-sm`, `--color-text`) + `sm` secondary "Try again" (`RotateCw`), which shows loading while it retries. |
| **EmptyState: card** (empty month, overlay per §5.2) | `--color-surface-raised`, 1px `--color-border`, `--radius-lg`, `--shadow-2`, padding 16px, centred column. `CalendarPlus` 24px muted, 8px gap, "No plans this month yet. Add the first one!" (`--text-sm`, `--color-text`, centred), 12px gap, `sm` primary "Add plan". |
| **EmptyState: block** (inside lists and sheets) | Centred column, padding `32px 16px`. Icon 32px muted, 12px gap, message (`--text-base`, `--color-text`), optional action button 16px below. |
| **Warning box** (lockouts) | `--color-warning-bg`, `--radius-md`, padding 12px, `Clock` 16px in `--color-warning` + text (`--text-sm`, `--color-text`). `role="status"`. |

### 6.8 Static loading shell (in `index.html`, styled by the main CSS bundle)

- A header bar of `--header-h` containing the 24px mark and "Friends Plans" (17px/700).
- A `--toolbar-h` blank bar.
- A grid of 5 week rows × `--cal-week-h` in `--color-surface`, with `--color-border` lines.
- **No shimmer.** It is static, so it costs nothing before JS runs.
- Its dimensions match the real calendar, so React swapping it in causes no shift.
- `<noscript>`: "Friends Plans needs JavaScript to run." (`--text-base`, centred).

### 6.9 PersonBadge variants

| Variant | Spec |
|---|---|
| `inline` | Dot `--dot-sm`, 6px gap, name. Inherits the font size |
| `chip` | 32px tall, `--color-chip`, `--radius-full`, padding `0 12px 0 10px`. Dot `--dot-sm`, 8px gap, name in `--text-sm`/600 |
| `row` | Dot `--dot-md`, 10px gap, name in `--text-base`/600 |

Every variant shows the name, and the dot is `aria-hidden`.

---

## 7. Motion

### 7.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 80ms | Press scale |
| `--duration-fast` | 150ms | Exits; reduced-motion fades |
| `--duration-base` | 200ms | Dialog and toast enter; sheet exit; backdrop |
| `--duration-slow` | 280ms | Sheet and panel enter |
| `--duration-highlight` | 1600ms | Post-save bar highlight |
| `--duration-shimmer` | 1400ms | Skeleton shimmer loop |
| `--duration-spin` | 800ms | Spinner rotation |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Press, generic |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Arriving elements |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving elements |

### 7.2 What animates (transform and opacity only, BRIEF §5.12)

| Element | Enter | Exit |
|---|---|---|
| Bottom sheet | `translateY(100%)` → 0, `--duration-slow` `--ease-enter`. Backdrop opacity 0 → 1, `--duration-base` | `translateY(100%)`, `--duration-base` `--ease-exit` |
| Side panel | `translateX(100%)` → 0, same timings | Mirror |
| Dialog | opacity 0 → 1 with `scale(0.97)` → 1, `--duration-base` `--ease-enter` | opacity → 0, `--duration-fast` |
| Toast | opacity 0 → 1 with `translateY(12px)` → 0, `--duration-base` `--ease-enter` | opacity → 0, `--duration-fast` |
| Button, IconButton, FAB, chip press | `scale(0.98)` (FAB and IconButton `0.96`), `--duration-instant` `--ease-standard` | Back to 1 |
| Post-save highlight | The `::after` ring's opacity: 0 → 1 (0–15%) → 0.3 (40%) → 1 (65%) → 0 (100%) over `--duration-highlight` | — |
| Skeleton shimmer | `::after` `translateX(-100%)` → `translateX(250%)`, `--duration-shimmer` linear, infinite | Removed instantly when data arrives |
| Spinner | `rotate(360deg)`, `--duration-spin` linear, infinite | — |

**Implementation:**
- Enter animations: `@keyframes` on `dialog[open]`, or `@starting-style`.
- Exit animations are optional polish. If you build them, set `data-closing`, wait for `animationend`, then call `close()`. If you don't, close instantly, which is acceptable.
- Esc and Back must never be delayed by more than `--duration-base`.

### 7.3 What never animates

- **Month changes** (Prev, Next, Today and the view switch): instant swap, with no slide or cross-fade.
- **Data:** bars, lanes, row heights and "+N" never animate when data loads or refetches. They appear in place without a fade.
- **Colours** on hover, focus or theme change are instant. Never put a `transition` on `color`, `background-color`, `border-color` or `box-shadow`.
- **Scrolling:** the timeline's scroll to today and focus scrolling use `behavior: 'auto'`.
- **Layout properties** (`width`, `height`, `top`, `left`, `grid-*`, `margin`): never animated.
- **No decoration motion:** no parallax, no auto-playing decoration, no bouncing FAB.

### 7.4 `prefers-reduced-motion: reduce`

- **Sheets, panels, dialogs and toasts:** opacity-only fades at `--duration-fast`, with no translate or scale.
- **Press feedback:** no scale, only the pressed overlay.
- **Skeleton:** shimmer off; blocks are static `--color-skeleton`.
- **Post-save highlight:** a static ring, shown for `--duration-highlight` and then removed. No pulsing.
- **Spinner:** keeps rotating, slowed to 1600ms per turn. It is an essential status indicator, and the slower speed reduces vestibular load.
- `html { scroll-behavior: auto; }`.
- Write `@media (prefers-reduced-motion: reduce)` overrides next to each animation. **Do not** use a global `animation-duration: 0.01ms !important` reset: it breaks `animationend`-based closing and the timing of the highlight.

---

## 8. Imagery

### 8.1 Style

- **No photography, illustration, video or generated artwork.** BRIEF and SPEC need none, and ASSETS.md records this. `public/assets/` contains only `.gitkeep`.
- Visual interest comes from the person colours on bars, the typography and the whitespace.
- **Icons** are `lucide-react` line icons only.
  - Stroke 2 with round caps (the lucide defaults). Sizes `--icon-sm`, `--icon-md` and `--icon-lg`. Colour `currentColor`.
  - Import each icon individually so tree-shaking works.
  - Icons used: Plus, ChevronLeft, ChevronRight, X, Menu, Filter, Users, User, UserPlus, UserX, ShieldCheck, Lock, KeyRound, Pencil, Trash2, MapPin, CalendarDays, CalendarPlus, Clock, Sun, EyeOff, Check, CheckCircle2, AlertCircle, AlertTriangle, RotateCw, Download.

### 8.2 Aspect ratios and treatment

Not applicable: there are no raster or video media. The only graphics are the app mark (1:1) and icons (1:1).

### 8.3 App mark and favicon (hand-written SVG: code, not a generated asset)

The mark is a rounded square with three staggered "plan bars", echoing overlapping plans.

```
viewBox="0 0 32 32"
rect  x=0  y=0  width=32 height=32  rx=8     fill: #1A1C20 in favicon.svg | var(--color-mark-bg) inline
rect  x=6  y=8  width=20 height=4.5 rx=2.25  fill #F59A2E   (c2 Orange)
rect  x=6  y=14 width=12 height=4.5 rx=2.25  fill #5CB8F0   (c5 Sky)
rect  x=12 y=20 width=14 height=4.5 rx=2.25  fill #E98AC4   (c4 Pink)
```

- **`public/favicon.svg`:** fixed hex values as above. Link it with `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`.
- **Inline `AppMark` component:**
  - Same geometry, with the square filled `var(--color-mark-bg)` so it reads in dark mode.
  - Sizes: 24px in the header, 48px on the gate and NotFound.
  - `aria-hidden="true"`; the parent link or heading carries the name.
- **`theme-color`:**
  - `<meta name="theme-color" content="#F6F5F2" media="(prefers-color-scheme: light)">`
  - `<meta name="theme-color" content="#111317" media="(prefers-color-scheme: dark)">`

### 8.4 Alt-text and accessible-name guidance

- **Decorative graphics:** icons and the mark are `aria-hidden="true"`.
- **Icon-only buttons** always have an `aria-label`. It names the action in sentence case: "Add plan", "Previous month", "Next day", "Close", "Menu".
- **Person dots** are always decorative, because the name sits next to them.
- **Swatches** take their name from the radio label ("Blue, taken by Klára").
- **No `alt` attributes** are needed because there are no `<img>` elements. If one is ever added, its alt text describes its function, not its appearance.

---

## 9. Copy additions (designer)

The brief's copy is used as written. This design adds:

| Context | Copy |
|---|---|
| Header mark link `aria-label` | "Friends Plans, this month's calendar" |
| Sheet close button | "Close" |
| DayDetail navigation | "Previous day" / "Next day" |
| PersonFilter title | "Show people" |
| All colours taken | "All colors are in use, so pick any. Names keep everyone apart." |
| Plan missing in a sheet | "This plan no longer exists." |
| noscript | "Friends Plans needs JavaScript to run." |
| PersonForm errors | "That name is taken." / "PINs don't match." / "Use 4–6 digits." |
| People empty | "No people yet. Add yourself first." |
| Compact filter label | "3/10", with `aria-label` "Filter people: 3 of 10" |

UI copy uses US "color", matching the brief. This document uses "colour" in prose only.

---

## 10. Paste-ready CSS

### 10.1 `src/styles/tokens.css`

```css
:root {
  /* Type */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif;
  --text-xs: 0.75rem;   --leading-xs: 1rem;
  --text-bar: 12px;     --leading-bar: 18px;
  --text-sm: 0.875rem;  --leading-sm: 1.25rem;
  --text-base: 1rem;    --leading-base: 1.5rem;
  --text-lg: 1.125rem;  --leading-lg: 1.625rem;
  --text-xl: 1.25rem;   --leading-xl: 1.75rem;
  --text-2xl: 1.5rem;   --leading-2xl: 2rem;
  --text-3xl: 1.875rem; --leading-3xl: 2.25rem;
  --text-4xl: 2.25rem;  --leading-4xl: 2.5rem;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  --tracking-tight: -0.02em; --tracking-snug: -0.01em; --tracking-wide: 0.01em;

  /* Spacing */
  --space-0: 0; --space-px: 1px; --space-0-5: 2px; --space-1: 4px; --space-1-5: 6px;
  --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-10: 40px; --space-12: 48px; --space-16: 64px; --space-20: 80px;

  /* Radii */
  --radius-xs: 4px; --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 9999px;

  /* Sizes */
  --tap-min: 44px; --control-h-sm: 36px; --control-h: 44px; --control-h-lg: 52px;
  --input-h: 48px; --pin-input-h: 56px; --fab-size: 56px; --checkbox-size: 22px;
  --dot-sm: 10px; --dot-md: 12px; --dot-lg: 14px; --swatch-size: 36px;
  --icon-sm: 16px; --icon-md: 20px; --icon-lg: 24px; --icon-stroke: 2;

  /* Layout: base (<768px) */
  --container-max: 1280px; --content-narrow: 100%;
  --page-gutter: 12px; --cal-gutter: 4px;
  --page-pad-top: 12px; --page-pad-bottom: calc(88px + env(safe-area-inset-bottom));
  --header-h: 52px; --toolbar-h: 48px; --admin-banner-h: 40px;
  --sheet-pad: 16px; --sheet-panel-w: 420px; --sheet-max-h: calc(100dvh - 48px);
  --dialog-w: min(400px, 100vw - 32px); --gate-card-w: min(400px, 100vw - 24px);
  --stack-gap: 20px;

  /* Calendar: base */
  --cal-weekday-h: 24px; --cal-date-row-h: 24px; --cal-lanes: 3;
  --cal-bar-h: 18px; --cal-lane-gap: 2px; --cal-lane-pitch: 20px; --cal-row-pad-bottom: 4px;
  --cal-week-h: 88px; --cal-bar-inset: 2px; --cal-bar-radius: 4px; --cal-bar-arrow: 5px;
  --cal-bar-pad: 5px; --cal-bar-pad-cont: 9px;
  --cal-date-size: 12px; --cal-today-size: 20px; --cal-date-inset: 4px;

  /* Timeline */
  --tl-name-w: 96px; --tl-col-min: 36px; --tl-head-h: 48px; --tl-away-h: 32px;
  --tl-row-pad: 8px; --tl-bar-h: 28px; --tl-lane-gap: 4px; --tl-row-h: 44px;
  --tl-bar-inset: 2px; --tl-bar-radius: 6px; --tl-bar-arrow: 6px;
  --tl-bar-pad: 6px; --tl-bar-pad-cont: 10px;

  /* Motion */
  --duration-instant: 80ms; --duration-fast: 150ms; --duration-base: 200ms; --duration-slow: 280ms;
  --duration-highlight: 1600ms; --duration-shimmer: 1400ms; --duration-spin: 800ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* Z */
  --z-cell-bg: 0; --z-bars: 1; --z-cells: 2; --z-sticky-col: 3; --z-sticky-head: 4; --z-sticky-corner: 5;
  --z-header: 20; --z-fab: 30; --z-toast: 50;

  /* Person ink (both themes) */
  --person-ink: #121417;
}

@media (min-width: 768px) {
  :root {
    --content-narrow: 640px; --page-gutter: 24px; --cal-gutter: 24px; --page-pad-top: 16px;
    --header-h: 60px; --toolbar-h: 56px; --sheet-pad: 24px; --sheet-max-h: 100dvh;
    --dialog-w: 400px; --gate-card-w: 400px; --stack-gap: 24px;
    --cal-weekday-h: 32px; --cal-date-row-h: 28px; --cal-lanes: 4; --cal-row-pad-bottom: 6px;
    --cal-week-h: 114px; --cal-bar-pad: 6px; --cal-bar-pad-cont: 10px;
    --cal-date-size: 13px; --cal-today-size: 24px; --cal-date-inset: 6px;
    --tl-name-w: 160px; --tl-bar-pad: 8px; --tl-bar-pad-cont: 12px;
  }
}
@media (min-width: 1200px) {
  :root {
    --page-gutter: 32px; --cal-gutter: 32px; --page-pad-top: 24px;
    --page-pad-bottom: calc(104px + env(safe-area-inset-bottom));
    --cal-lanes: 6; --cal-week-h: 154px; --cal-bar-inset: 3px; --cal-bar-arrow: 6px; --cal-bar-pad-cont: 11px;
  }
}

/* Light theme: the default, and the no-JS fallback */
:root, :root[data-theme="light"] {
  color-scheme: light;
  --color-bg: #F6F5F2;
  --color-surface: #FFFFFF;
  --color-surface-raised: #FFFFFF;
  --color-surface-sunken: #EEECE7;
  --color-surface-weekend: #F7F5F0;
  --color-input-bg: #FFFFFF;
  --color-text: #1A1C20;
  --color-text-muted: #5E6168;
  --color-border: #E2DFD8;
  --color-border-week: #CFCBC2;
  --color-border-strong: #858891;
  --color-primary: #1A1C20;
  --color-primary-hover: #33363C;
  --color-on-primary: #FFFFFF;
  --color-accent: #2457C5;
  --color-accent-subtle: #E6ECFA;
  --color-today-bg: #EEF2FC;
  --color-focus: #2457C5;
  --color-chip: #ECE9E2;
  --color-hover: #1A1C200A;
  --color-pressed: #1A1C2014;
  --color-scrim: #14161A73;
  --color-inverse-surface: #24272C;
  --color-on-inverse: #FFFFFF;
  --color-success: #1E7A46;
  --color-success-bg: #E6F4EC;
  --color-warning: #8A5A00;
  --color-warning-bg: #FDF1D6;
  --color-danger: #B42318;
  --color-danger-bg: #FDECEA;
  --color-danger-solid: #B42318;
  --color-danger-solid-hover: #961B12;
  --color-on-danger: #FFFFFF;
  --color-toast-success: #5CC98A;
  --color-toast-danger: #FF8A80;
  --color-disabled-bg: #ECE9E2;
  --color-disabled-text: #8C8F96;
  --color-skeleton: #E9E6E0;
  --color-shimmer: #FFFFFF99;
  --color-mark-bg: #1A1C20;
  --color-away-1: #EFEAE0;
  --color-away-2: #E3DACB;
  --color-away-3: #D3C6B0;
  --bar-edge: #0000001A;
  --sticky-shadow: #00000026;
  --shadow-1: 0 1px 2px #1A1C2014;
  --shadow-2: 0 4px 16px #1A1C201F;
  --shadow-3: 0 12px 40px #1A1C2033;
  --shadow-fab: 0 6px 20px #1A1C2047;

  --person-c1-bar: #2160C4;  --person-c1-on-bar: #FFFFFF;            --person-c1-dot: #2160C4;
  --person-c2-bar: #F59A2E;  --person-c2-on-bar: var(--person-ink);  --person-c2-dot: #C46A0A;
  --person-c3-bar: #0B7A5B;  --person-c3-on-bar: #FFFFFF;            --person-c3-dot: #0B7A5B;
  --person-c4-bar: #E98AC4;  --person-c4-on-bar: var(--person-ink);  --person-c4-dot: #C04A92;
  --person-c5-bar: #5CB8F0;  --person-c5-on-bar: var(--person-ink);  --person-c5-dot: #2589C8;
  --person-c6-bar: #C8372D;  --person-c6-on-bar: #FFFFFF;            --person-c6-dot: #C8372D;
  --person-c7-bar: #F2D03A;  --person-c7-on-bar: var(--person-ink);  --person-c7-dot: #9C7A00;
  --person-c8-bar: #6A38B0;  --person-c8-on-bar: #FFFFFF;            --person-c8-dot: #6A38B0;
  --person-c9-bar: #4FD8C4;  --person-c9-on-bar: var(--person-ink);  --person-c9-dot: #138F80;
  --person-c10-bar: #7A4E25; --person-c10-on-bar: #FFFFFF;           --person-c10-dot: #7A4E25;
  --person-c11-bar: #A6D84A; --person-c11-on-bar: var(--person-ink); --person-c11-dot: #5E8A12;
  --person-c12-bar: #4D5B70; --person-c12-on-bar: #FFFFFF;           --person-c12-dot: #4D5B70;
}

/* Dark theme. theme-init.js always sets data-theme before first paint. */
:root[data-theme="dark"] {
  color-scheme: dark;
  --color-bg: #111317;
  --color-surface: #1A1D23;
  --color-surface-raised: #22262D;
  --color-surface-sunken: #0C0E11;
  --color-surface-weekend: #16191E;
  --color-input-bg: #15181C;
  --color-text: #ECEDEF;
  --color-text-muted: #A3A7AF;
  --color-border: #2E323A;
  --color-border-week: #3A3F48;
  --color-border-strong: #737882;
  --color-primary: #ECEDEF;
  --color-primary-hover: #D5D7DB;
  --color-on-primary: #111317;
  --color-accent: #8AB4F8;
  --color-accent-subtle: #1F2A44;
  --color-today-bg: #1C2740;
  --color-focus: #8AB4F8;
  --color-chip: #2C3038;
  --color-hover: #ECEDEF0F;
  --color-pressed: #ECEDEF1F;
  --color-scrim: #000000A6;
  --color-inverse-surface: #ECEDEF;
  --color-on-inverse: #111317;
  --color-success: #5CC98A;
  --color-success-bg: #12301F;
  --color-warning: #F2C26B;
  --color-warning-bg: #33270F;
  --color-danger: #FF8A80;
  --color-danger-bg: #3A1715;
  --color-danger-solid: #C4302B;
  --color-danger-solid-hover: #A82520;
  --color-on-danger: #FFFFFF;
  --color-toast-success: #1E7A46;
  --color-toast-danger: #B42318;
  --color-disabled-bg: #262A31;
  --color-disabled-text: #6E737C;
  --color-skeleton: #262A31;
  --color-shimmer: #FFFFFF0F;
  --color-mark-bg: #2C3038;
  --color-away-1: #1F2228;
  --color-away-2: #2A2E36;
  --color-away-3: #3A3F49;
  --bar-edge: #00000000;
  --sticky-shadow: #00000080;
  --shadow-1: 0 1px 2px #00000080;
  --shadow-2: 0 4px 16px #00000080;
  --shadow-3: 0 12px 40px #00000099;
  --shadow-fab: 0 6px 20px #00000099;

  --person-c1-bar: #2F6BD0;  --person-c1-on-bar: #FFFFFF;            --person-c1-dot: #6A9BEA;
  --person-c2-bar: #F59A2E;  --person-c2-on-bar: var(--person-ink);  --person-c2-dot: #F59A2E;
  --person-c3-bar: #13805F;  --person-c3-on-bar: #FFFFFF;            --person-c3-dot: #3DB88E;
  --person-c4-bar: #E98AC4;  --person-c4-on-bar: var(--person-ink);  --person-c4-dot: #E98AC4;
  --person-c5-bar: #5CB8F0;  --person-c5-on-bar: var(--person-ink);  --person-c5-dot: #5CB8F0;
  --person-c6-bar: #C93D33;  --person-c6-on-bar: #FFFFFF;            --person-c6-dot: #EE6F64;
  --person-c7-bar: #DDBE36;  --person-c7-on-bar: var(--person-ink);  --person-c7-dot: #DDBE36;
  --person-c8-bar: #8352D6;  --person-c8-on-bar: #FFFFFF;            --person-c8-dot: #A783EE;
  --person-c9-bar: #45C4B2;  --person-c9-on-bar: var(--person-ink);  --person-c9-dot: #45C4B2;
  --person-c10-bar: #976231; --person-c10-on-bar: #FFFFFF;           --person-c10-dot: #C99560;
  --person-c11-bar: #96C443; --person-c11-on-bar: var(--person-ink); --person-c11-dot: #96C443;
  --person-c12-bar: #5C6B82; --person-c12-on-bar: #FFFFFF;           --person-c12-dot: #93A1B8;
}

/* No-JS fallback: repeat the whole [data-theme="dark"] block inside
   @media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } } */
```

### 10.2 `src/styles/person-colors.css`

```css
[data-color="c1"]  { --bar: var(--person-c1-bar);  --on-bar: var(--person-c1-on-bar);  --dot: var(--person-c1-dot); }
[data-color="c2"]  { --bar: var(--person-c2-bar);  --on-bar: var(--person-c2-on-bar);  --dot: var(--person-c2-dot); }
[data-color="c3"]  { --bar: var(--person-c3-bar);  --on-bar: var(--person-c3-on-bar);  --dot: var(--person-c3-dot); }
[data-color="c4"]  { --bar: var(--person-c4-bar);  --on-bar: var(--person-c4-on-bar);  --dot: var(--person-c4-dot); }
[data-color="c5"]  { --bar: var(--person-c5-bar);  --on-bar: var(--person-c5-on-bar);  --dot: var(--person-c5-dot); }
[data-color="c6"]  { --bar: var(--person-c6-bar);  --on-bar: var(--person-c6-on-bar);  --dot: var(--person-c6-dot); }
[data-color="c7"]  { --bar: var(--person-c7-bar);  --on-bar: var(--person-c7-on-bar);  --dot: var(--person-c7-dot); }
[data-color="c8"]  { --bar: var(--person-c8-bar);  --on-bar: var(--person-c8-on-bar);  --dot: var(--person-c8-dot); }
[data-color="c9"]  { --bar: var(--person-c9-bar);  --on-bar: var(--person-c9-on-bar);  --dot: var(--person-c9-dot); }
[data-color="c10"] { --bar: var(--person-c10-bar); --on-bar: var(--person-c10-on-bar); --dot: var(--person-c10-dot); }
[data-color="c11"] { --bar: var(--person-c11-bar); --on-bar: var(--person-c11-on-bar); --dot: var(--person-c11-dot); }
[data-color="c12"] { --bar: var(--person-c12-bar); --on-bar: var(--person-c12-on-bar); --dot: var(--person-c12-dot); }
```

Shared dot rendering, in a component module or `global.css`:

```css
.personDot {
  inline-size: var(--dot-size, var(--dot-md));
  block-size: var(--dot-size, var(--dot-md));
  border-radius: var(--radius-full);
  background: var(--bar);
  box-shadow: inset 0 0 0 2px var(--dot);
  flex: none;
}
```
