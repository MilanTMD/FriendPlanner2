# BRIEF: Friends Plans Calendar

- **Version:** 1.0, 2026-10-08, written by the architect.
- **Source of requirements:** `SPEC.md` at the workspace root. Everything in it is a requirement unless marked "suggested". Where this brief decides something SPEC.md leaves open, the decision and the reason are recorded here.
- **Build target:** `./friends-planner/` relative to the workspace root (`c:\Users\milan\Desktop\Friends planner`). **New build:** no existing site, no live URL, no existing code. The directory does not exist yet.
- **Prior docs:** `docs-agents/REVIEW-LOG.md` exists with a heading only (no rounds yet). There is no DESIGN.md or ASSETS.md yet, so there is nothing to reconcile.
- **Paths** in this brief are relative to `friends-planner/` unless stated otherwise.

**Conventions**
- **MUST**: required for the definition of done.
- **SHOULD**: expected. Skipping one needs a stated reason in the builder report.
- **COULD**: optional. Do it only after every MUST and SHOULD is done.
- **"plan" vs "event":** the UI says **"plan"** and code, API and data say **"event"**. They are the same thing, and user-visible routes use `/plans/...`.
- **Deployment to production is out of scope.** The team stops at "ready to deploy" and reports.
- **No image or video assets are needed.** ASSETS.md should say so. The favicon is a hand-written SVG and icons come from an npm icon package, so nothing has to be generated.

---

## 1. Goals

| # | Goal | How it is measured (verifiable) |
|---|------|---------------------------------|
| G1 | **Add a plan from a phone in under 20 seconds.** | At 375px, a returning user (identity remembered on the device) goes from the calendar to a saved plan in **at most 6 interactions**: tap "Add plan", type the plan name, type the place, set "From", set "To" (pre-filled with "From", so only changed for multi-day plans), tap "Save".<br>No PIN prompt for a remembered identity. Focus lands in the plan-name field on open. "From" is pre-filled with today, or with the tapped day when opened from day detail.<br>An e2e test asserts this interaction budget. |
| G2 | **See at a glance who is away when, and where plans overlap.** | The current month renders at 375px with **no horizontal page scroll**. Every plan is reachable from the month grid (as a bar or a "+N" indicator), from day detail and from the timeline.<br>Overlapping bars never visually intersect: e2e compares bounding boxes. Each person has one consistent color in every view. |
| G3 | **Zero date bugs** (off-by-one, timezone shift, inclusive end). | Date unit tests pass under 4 process time zones. E2E date tests pass with the browser in UTC+14 and UTC-11.<br>Month-boundary, year-boundary and single-day cases are covered (§7.2). |
| G4 | **Self-serve and safe.** | Friends add, edit and delete their own plans with no admin involvement. Every permission rule is enforced server-side, and the permission-matrix tests (§7.2) pass 100%.<br>PINs are stored only as salted scrypt hashes. Zero secrets in the repo (auditor). |
| G5 | **Quality bars.** | Lighthouse (mobile and desktop presets, every audited page in §7.4): performance at least 90, accessibility at least 95, best practices at least 95, SEO at least 95.<br>axe: zero serious or critical violations. Initial JS no more than 120 KB gzipped. Zero console errors on page load.<br>Critic `APPROVED` (every score at least 8). |
| G6 | **Ready to deploy, not deployed.** | `npm run build` passes and a production build serves locally via `netlify serve`. The README documents deployment, env vars and admin usage (§7.3). |

## 2. Target audience

**Primary: the friend group (about 10 people).**
- **Scale target:** smooth for up to 30 people and 5,000 plans.
- **Who they are:** non-technical, no accounts, low tolerance for friction. *Assumption:* mostly Czech-based (the workspace owner uses a `.cz` address and Europe/Prague time) and comfortable with an English UI.
- **Typical moments:**
  - "Who's around this weekend?" (a quick glance)
  - Adding a trip right after booking it (speed matters)
  - Planning a meetup by finding days when most people are home (overlaps; the timeline view)
  - Checking where someone will be (place)
- **Devices:** *Assumption:* about 80% phones (iOS Safari, Android Chrome) at 360–430px in portrait, often one-handed and on variable mobile connections. Desktop or laptop at about 1440px is occasional, for planning. Tablets at 768px are rare but supported.
- **Accessibility needs:** color must never be the only cue (names appear on bars). Large touch targets. Readable at small sizes. Dark mode at night (system preference). Keyboard-operable on desktop. Target WCAG 2.2 AA.

**Secondary: the admin (the group organizer who holds `ADMIN_PASSCODE`).**
- Resets forgotten PINs, fixes or deletes wrong plans, and removes duplicate or test people.
- Uses a phone or desktop occasionally.

**Tertiary: the maintainer who deploys the app.**
- Reads the README, connects the repo to Netlify and sets env vars.

## 3. Content inventory

**Existing content:** none. This is a new build, there is no site to crawl, and SPEC.md is the only source.

| Existing page or section | Status | Keep / rewrite / drop |
|---|---|---|
| (none) | N/A | N/A |

**Content to create (all new; the builder writes it in the tone "friendly, clean, calm, not corporate"):**

| Context | Copy (use as written unless the designer refines the wording) |
|---|---|
| App name | **Friends Plans** |
| Gate | Title "Friends Plans", tagline "Who's away, and when.", field label "Group passcode", button "Open calendar" |
| Gate: wrong passcode | "That passcode didn't work. Check with the group and try again." |
| Any lockout | "Too many tries. Try again in {m} min." For PIN lockouts, add: "or ask the admin to reset your PIN." |
| Primary action | "Add plan" |
| Plan form labels | "Who", "Plan" (placeholder "e.g. Ski trip"), "Place" (placeholder "e.g. Prague"), "From", "To (last day)", "Notes (optional)", button "Save plan" |
| PIN prompt | Title "Enter {name}'s PIN", checkbox "Remember me on this device", button "Continue" |
| PIN help (person creation) | "4–6 digits. You'll need it to change or delete your plans. Forgot it? The admin can reset it." |
| Wrong PIN | "Wrong PIN. {n} tries left before a short lock." |
| Delete confirmation | "Delete "{title}" ({range})? This can't be undone." Buttons "Delete plan" / "Keep it" |
| Day detail, nobody away | "Everyone's around." |
| Month with no plans | "No plans this month yet. Add the first one!" |
| Admin banner | "Admin mode: you can edit or delete any plan." Button "Exit admin mode" |
| Not found | "This page wandered off." Link "Back to the calendar" |
| Network error | "Couldn't reach the server. Check your connection." Button "Try again" |

**Metadata (MUST):**
- `<html lang="en">` and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- `<meta name="theme-color">` with a light and a dark variant, using the `media` attribute.
- Default `<title>`: "Friends Plans: who's away when". Per-route titles, for example:
  - "October 2026 · Calendar · Friends Plans"
  - "October 2026 · Timeline · Friends Plans"
  - "Mon 12 Oct 2026 · Friends Plans"
  - "People · Friends Plans"
  - "Admin · Friends Plans"
- `<meta name="description" content="A private calendar for our friend group: see who's away when, and add your plans in seconds.">`
- Open Graph: `og:title`, `og:description`, `og:type=website`, `og:site_name`. **No `og:image`** because there are no image assets.
- `robots.txt` allows crawling except `/api/` (see §8, Q9 on `noindex`).

**Demo data (local review only, never shipped):** `scripts/seed.ts` creates 10 fictional friends and about 25 plans relative to the current month (§5.10).

---

## 4. Page and component plan

### 4.1 App shell (MUST)

Every authenticated view renders inside `AppShell`:

- **Header** (sticky top). Contains:
  - App name (links to the calendar for the current month)
  - `ViewSwitch` segmented control: **Calendar | Timeline**. It keeps the selected month.
  - `ActingAsChip`: color dot and name of the person this device acts as. Tapping it opens the person picker. If no person is set it reads "Who are you?".
  - Menu button that opens `MenuSheet`
- **MonthToolbar** (on the calendar and timeline):
  - Month title (for example "October 2026")
  - Previous and next icon buttons (`aria-label` "Previous month" / "Next month")
  - "Today" button (goes to the current month and highlights today)
  - `FilterButton` showing "All" or "3 of 10"
- **Fab** "Add plan":
  - Fixed bottom-right and respects `env(safe-area-inset-bottom)`.
  - At least 56×56px with a visible text label at 768px and wider. Icon only below that, with `aria-label` "Add plan".
  - Shown on the calendar, the timeline and day detail.
- **AdminBanner:** shown on every view while an admin session is active.
- **ToastRegion:** `aria-live="polite"`.
- **MenuSheet** items:
  - People
  - Admin
  - Theme: System / Light / Dark radio
  - "Forget me on this device" (shown only when acting as someone)
  - "Lock calendar" (logs out of everything and returns to the gate)

**Layout rules:**
- No horizontal page scroll at any width from 320px to 1920px.
- Container max-width comes from DESIGN.md (about 1280px).
- Day detail, plan detail, the plan form and the person form open as a **bottom sheet below 768px** and as a **right-side panel (about 420px) at 768px and wider**, over the last calendar or timeline view.

### 4.2 Routes (MUST)

Router: `wouter` (§5.2).

**Routing rules:**
- Every user-visible state has a URL, so the Android and browser back buttons close sheets.
- Any route, when there is no group session, renders `PasscodeGate`. After a successful login the app stays on the originally requested URL.
- Invalid month or date params, and unknown paths, render `NotFound`.

| Route | View | Rendered as |
|---|---|---|
| `/` | Redirect (replace) to `/calendar/{current YYYY-MM}` | N/A |
| `/calendar/:month` (`YYYY-MM`) | `CalendarView` | Page |
| `/timeline/:month` (`YYYY-MM`) | `TimelineView` | Page |
| `/day/:date` (`YYYY-MM-DD`) | `DayDetail` | Sheet over the last view. On a direct load, over `/calendar/{month of date}` |
| `/plans/new?date=YYYY-MM-DD` | `EventForm` (create). `date` pre-fills "From"; if absent, today | Sheet |
| `/plans/:id` | `EventDetail` | Sheet |
| `/plans/:id/edit` | `EventForm` (edit) | Sheet |
| `/people` | `PeoplePage` | Page |
| `/people/new` | `PersonForm` (create) | Sheet over `/people`, or over the plan form when launched from "I'm new here" |
| `/people/:id/edit` | `PersonForm` (edit name and color) | Sheet |
| `/admin` | `AdminPage` (login form or panel) | Page |
| `*` | `NotFound` | Page |

**Closing a sheet:**
- If the previous history entry belongs to the app, close with `history.back()`.
- Otherwise navigate to the last calendar or timeline route. Keep it in the `lastViewPath` app state, defaulting to the current month's calendar.
- Esc and the close button do the same thing.

### 4.3 Views and their sections

#### PasscodeGate (MUST)
- **Layout:** centered card with app name, tagline, password field (`type="password"`, `autocomplete="current-password"`, label "Group passcode") and submit button.
- **States:** inline error, lockout message with minutes remaining, and a loading state on submit.
- **On load:** calls `GET /api/session`, which always returns 200 (§5.6) to avoid console errors. Shows a neutral loading shell meanwhile.

#### CalendarView (MUST): month grid
- **Weeks start on Monday.** Weekday header row reads M T W T F S S, with full names as `abbr` / accessible labels.
- **Rows:** the grid shows only weeks that touch the month (4–6 rows). Days from adjacent months are visually muted but still tappable and still show bars, so month-boundary plans read as continuous.
- **Day cells:** each `DayCell` is a `<button>` covering the whole cell and opens `/day/:date`.
  - Accessible name: "Monday 12 October 2026, 3 people away" (or "nobody away").
  - Today is highlighted. Weekend columns are subtly shaded.
- **Plan bars:** multi-day plans render as continuous bars, using the layout in §4.5.
  - A bar is split per week row. Segments that continue from the previous week or month, or into the next, have a flat or arrowed edge instead of a rounded one.
  - Bar fill is the person's color.
- **Bar labels:**
  - Below 768px: the person's name.
  - At 768px and wider: "{name} · {plan title}".
  - Truncate with an ellipsis. Repeat the label at the start of every segment.
  - The person's name must be visible on every segment at least 2 days wide. A 1-day segment shows the name truncated.
- **Lane caps by width:**

  | Width | Max lanes per week row |
  |---|---|
  | Below 768px | 3 |
  | 768–1199px | 4 |
  | 1200px and up | 6 |

  Hidden plans on a day show as a "+N" indicator in that cell. Tapping the cell opens day detail, which lists everything.
  Row heights are fixed per breakpoint, so loading data causes no layout shift.
- **Accessibility:** the bar layer is `aria-hidden="true"`. The accessible path to plan details is day cell, then day detail, then plan.
- **Keyboard (SHOULD):** arrow keys move focus between days (roving tabindex), Enter opens the day, and Tab leaves the grid.
- **States:**
  - Loading: the grid renders immediately from date math, with a subtle shimmer until the data arrives.
  - Empty month: the empty-state copy as a banner above the grid. The grid stays visible.
  - Error: `ErrorBanner` with "Try again".
- **COULD:** horizontal swipe to change month.

#### TimelineView (MUST; the spec marks it "strongly preferred")
- **Grid:** people as rows, every day of the selected month as columns, and a bar per plan.
- **Scrolling:** the grid scrolls horizontally **inside its own container** with momentum scrolling. The page itself never scrolls horizontally.
- **Sticky parts:**
  - Left column (person color dot and name; about 96px on mobile, about 160px on desktop)
  - Header row (weekday initial and day number). Header cells are buttons that open `/day/:date`.
- **Column width:** about 36px below 768px and at least 36px on desktop. At 1440px a 31-day month must fit without scrolling.
- **Auto-scroll:** if the month contains today, scroll on load so today is visible (about 2 columns from the left edge).
- **Rows:**
  - Every person in the active filter appears, **including people with no plans this month** (that shows who is free), sorted by name.
  - If one person's own plans overlap, the row grows extra lanes.
- **Bars:**
  - Each bar is a `<button>`, at least 24px tall, that opens `/plans/:id`.
  - Label: the plan title (truncated).
  - `aria-label`: "{name}: {title}, {place}, {range}".
  - Plans extending beyond the month are clipped, with continuation edges as in the calendar.
- **Highlights:** today column highlighted and weekends shaded.
- **SHOULD:** an "Away" summary row under the header showing the number of distinct people away per day. This is the clearest overlap signal.
- **States:** loading, "No people yet" (button "Add person"), and error.

#### DayDetail (MUST)
- **Heading:** full date, for example "Monday 12 October 2026". Previous-day and next-day arrow buttons.
- **Summary:** "3 people away".
- **List of plans covering the day,** sorted by person name. Each `EventListItem` shows:
  - Person color dot and name
  - Plan title
  - Place (with a map-pin icon)
  - Range and position (for example "12–16 Oct · day 2 of 5")
  - First 2 lines of the notes
  - The item is a button that opens `/plans/:id`.
- **SHOULD:** an "Around" section listing people with no plan that day (respects the filter).
- **Filter note:** if the person filter hides plans on this day, show "2 plans hidden by filter" with a "Show all" button.
- **Action:** button "Add plan on this day" opens `/plans/new?date={date}`.
- **Empty:** "Everyone's around."

#### EventDetail (MUST)
- **Shows:** owner (color and name), title, place, formatted range and duration ("5 days" / "1 day"), and notes as plain text with line breaks preserved. Notes are **never rendered as HTML**.
- **Edit and Delete buttons** appear on **every** plan.
  - When the device is not acting as the owner and admin mode is off, the buttons show a lock hint: "{owner}'s PIN needed".
- **Delete** opens `ConfirmDialog`. On success, close the sheet and show the toast "Plan deleted".

#### EventForm: create and edit (MUST)

**Field order:**

1. **Who.** Depends on state:
   - **Acting person set (or admin):** `PersonBadge` with a "Change" link.
   - **No acting person:** an inline radio list of people (color and name) plus an "I'm new here" button.
     - Choosing someone other than the acting person opens `PinDialog`. Admins skip the PIN.
     - "I'm new here" opens `/people/new`, then returns to the form with the new person acting.
   - **Edit mode:** the owner is fixed and cannot change.
2. **Plan:** text, autofocus, `enterkeyhint="next"`, 1–80 characters.
3. **Place:** text, 1–80 characters. **COULD:** a `<datalist>` of this person's previous places.
4. **From:** native `<input type="date">`.
5. **To (last day):** native `<input type="date">`.
   - Defaults to "From".
   - When "From" changes and "To" is earlier, set "To" to "From".
   - `min` is bound to "From".
6. **Notes (optional):** `textarea`, up to 1,000 characters.

**Save and errors:**
- The Save button is sticky at the bottom of the sheet on mobile.
- Validate on submit, with inline field errors from the shared validators (§5.3).
- Server `fields` errors map onto the inputs.
- Show a loading state on Save and disable double submits.
- After saving: close the sheet, show the toast "Plan added" or "Plan saved", and briefly highlight the plan's bars.
- **No optimistic updates.** Wait for the server, then refetch.
- **COULD:** quick end-date chips ("+1 day", "Weekend", "+1 week").

**Permission flow:**
- If the API answers `PIN_REQUIRED`, open `PinDialog` for the relevant person, then retry the request automatically on success.

#### PinDialog (MUST)

Opened from three places: choosing a person, editing or deleting someone else's plan, and "This is me" on the people page.

- **Contents:**
  - Person badge and the title "Enter {name}'s PIN"
  - `PinInput`: `inputmode="numeric"`, `pattern="[0-9]*"`, `autocomplete="off"`, masked, 4–6 digits
  - Checkbox "Remember me on this device", checked by default
  - Continue button
- **On success:** the device now acts as that person (toast "You're now acting as {name}") and the pending action continues.
- **Errors:**
  - Wrong PIN: show the remaining attempts.
  - Lockout: minutes remaining, plus "ask the admin to reset your PIN".

#### PeoplePage, `/people` (MUST)
- **List:** each person's color swatch and name, a "You" badge for the acting person, and the count of upcoming plans.
- **Per person:**
  - "This is me" opens `PinDialog`.
  - "Edit" is shown for your own entry, or for anyone in admin mode.
- **Actions:**
  - Button "Add person" opens `/people/new`.
  - Link "Forget me on this device" clears the person session.

#### PersonForm, create and edit (MUST for create, SHOULD for edit)

**Create:**
- **Name:** 1–40 characters, unique (case-insensitive).
- **Color:** `ColorSwatchPicker`, a radio group of the 12 palette colors.
  - Taken colors are marked and labelled with the owner's name.
  - The first unused color is pre-selected.
  - Duplicates are allowed only after all 12 are taken (see §4.8).
- **PIN** and **Confirm PIN:** `PinInput`, `autocomplete="new-password"`, with the help text.
- **"Remember me on this device"** checkbox.
- **On success:** the device acts as the new person.

**Edit:** name and color only. Changing a PIN is admin reset only (COULD: owner self-change with the current PIN).

#### AdminPage, `/admin` (MUST)
- **No admin session:** an "Admin passcode" form (same states as the gate).
- **Admin session:** `AdminBanner`, then a **People** list. Each row has:
  - "Reset PIN": a dialog with the new PIN and confirmation.
  - "Delete person": `ConfirmDialog` with "Delete {name} and their {n} plans? This can't be undone."
- **Admin mode across the app:** while active, Edit and Delete on any plan work without a PIN, and the plan form's "Who" lists all people without asking for PINs.
- **Exit:** "Exit admin mode" ends the admin session only.
- **COULD:** "Download backup (JSON)" via `GET /api/admin/export`.

#### NotFound (MUST)
- Friendly message and a link back to the calendar. Also used for malformed `:month` and `:date` params.

### 4.4 Key flows (each is an e2e test; see §7.2)

1. **First visit:** any URL, then the gate, then the passcode. The app stays on the requested URL and the session is remembered for 180 days.
2. **Add plan, remembered device:**
   - FAB opens the form with "Who" already set.
   - Fill in Plan, Place, From and To, then Save.
   - The bar appears in the calendar, timeline and day detail.
3. **Add plan, new device, existing person:**
   - FAB opens the form. Pick yourself under "Who" and enter your PIN, which is now remembered.
   - Fill in the fields and Save.
4. **Add plan, new person:**
   - FAB opens the form. Choose "I'm new here", then enter name, color, PIN and confirm PIN.
   - Back in the form, fill in the fields and Save.
5. **Edit or delete your own plan:**
   - From a day or plan, open Edit (or Delete), change it, and save (or confirm).
   - No PIN is asked for on a remembered device.
6. **Edit someone else's plan:**
   - Edit opens the PIN dialog for the owner. A wrong PIN shows an error and leaves the plan unchanged. A correct PIN switches acting to the owner and the edit proceeds.
   - The API also rejects direct calls (403).
7. **Admin override:**
   - Log in at `/admin`, then edit and delete anyone's plan without a PIN.
   - Reset a person's PIN; this clears their lockout and signs out their remembered devices.
   - Delete a person, which removes their plans.
   - Exit admin mode.
8. **Switch identity:** Menu (or the ActingAsChip), then "This is me" or a person in the picker, then the PIN.
9. **Logout:** Menu, then "Lock calendar". All cookies are cleared and the gate shows.

### 4.5 Rendering algorithms (MUST; pure functions in `src/lib/layout.ts`, unit-tested)

**`buildMonthWeeks(month)`**
- Returns the Monday-start weeks (arrays of 7 `ISODate`s) covering the month. This comes from `shared/dates.ts`.

**`layoutWeek(weekDays, events, maxLanes)`**
- Returns `{ segments, hiddenCountByDay }`.
- Takes only events overlapping the week: `start <= weekEnd && end >= weekStart`.
- Clips each event to the week, giving `segStart = max(start, weekStart)` and `segEnd = min(end, weekEnd)`.
- **Sort order:** `startDate` ascending, then inclusive length descending, then person name (`Intl.Collator`), then `id`.
- **Lane assignment:** greedy first-fit, so a segment takes the lowest lane whose last occupied column is before its start column.
- **Segment fields:** `{ eventId, personId, colorId, startCol (0–6), span, lane, segStart, segEnd, continuesBefore: start < weekStart, continuesAfter: end > weekEnd }`.
- **Hidden plans:** segments with `lane >= maxLanes` are hidden. `hiddenCountByDay[date]` counts the hidden events covering that day.

**`layoutTimelineRow(personEvents, rangeStart, rangeEnd)`**
- Same clipping and greedy lanes within one person's row.

**`awayCountByDay(events, days)`**
- Counts **distinct** `personId`s covering each day, after the filter.

Bars are positioned with CSS grid (`grid-column: {startCol+1} / span {span}`, with the row set by lane) as inline style properties. This is allowed by the CSP because React sets styles through the CSSOM (§5.8).

### 4.6 Shared components (MUST unless marked)

Each component has its own folder with `Component.tsx` and `Component.module.css`.

| Component | Purpose |
|---|---|
| `AppShell`, `Header`, `MonthToolbar`, `ViewSwitch`, `Fab`, `MenuSheet` | Global chrome (§4.1) |
| `Sheet` | Native `<dialog>` with `showModal()`: focus trap, Esc to close, focus returns to the trigger. Bottom sheet below 768px, side panel at 768px and wider |
| `ConfirmDialog` | Destructive confirmation built on `Sheet` or a centered `<dialog>` |
| `PinDialog`, `PinInput` | PIN entry (§4.3) |
| `PersonBadge` | Color dot and name. Variants: inline, chip, row |
| `ColorSwatchPicker` | Radio group of the 12 person colors, with "taken by" labels |
| `ActingAsChip` | Current device identity |
| `PersonFilter` | Sheet with a checkbox per person, "All" and "None". `FilterButton` shows the count |
| `EventBar` | One bar segment (calendar or timeline variant) with continuation edges |
| `EventListItem` | Row used in day detail |
| `DayCell`, `WeekRow`, `MonthGrid` | Calendar internals |
| `TimelineGrid`, `TimelineRow`, `AwayRow` (SHOULD) | Timeline internals |
| `Button`, `IconButton`, `TextField`, `DateField`, `TextArea`, `Checkbox`, `SegmentedControl` | Form primitives with label, hint, error and disabled states |
| `Toast` / `ToastRegion`, `ErrorBanner`, `EmptyState`, `Spinner`, `Skeleton` | Feedback |
| `AdminBanner` | Admin mode indicator |
| `Icon` | Thin wrapper over `lucide-react` icons. Size and stroke come from tokens, and icons are `aria-hidden` unless standalone |

### 4.7 Test hooks contract (MUST; QA relies on these exactly)

Prefer roles and accessible names in tests. The data attributes below are the stable contract for geometry and date assertions:

| Element | Attributes |
|---|---|
| Month grid root | `data-testid="month-grid"`, `data-month="YYYY-MM"` |
| Day cell button | `data-testid="day-cell"`, `data-date="YYYY-MM-DD"`, `data-outside-month="true|false"`, `data-today="true|false"`, `data-hidden-count="N"` |
| Calendar bar segment | `data-testid="event-bar"`, `data-event-id`, `data-person-id`, `data-seg-start`, `data-seg-end`, `data-lane`, `data-continues-before="true|false"`, `data-continues-after="true|false"` |
| Timeline root / row / bar | `data-testid="timeline"` / `"timeline-row"` with `data-person-id` / `"timeline-bar"` with `data-event-id`, `data-seg-start`, `data-seg-end` |
| Timeline scroll container | `data-testid="timeline-scroll"` |
| Day detail item | `data-testid="day-event"`, `data-event-id` |
| Acting-as chip | `data-testid="acting-as"`, `data-person-id` (empty when none) |
| Admin banner | `data-testid="admin-banner"` |
| `<html>` | `data-theme="light|dark"` (resolved theme) |

"Today" must come only from `todayLocal()` (§5.4) so Playwright's `page.clock` controls it.

### 4.8 Person colors (decision)

- **Palette:** 12 colors with IDs `c1`–`c12`, defined in `shared/colors.ts`. **Store the ID, never a hex value**, so the designer can tune hues and dark-mode variants without migrating data.
- **Designer delivers, for each ID and each theme:**
  - `--person-cN-bar`: bar fill
  - `--person-cN-on-bar`: bar text, at least 4.5:1 on the bar fill
  - `--person-cN-dot`: swatch or dot, at least 3:1 against the surface
- **Ordering:** palette order maximizes distinctness for the first 6–8 entries.
- **Applying colors:** components set `data-color="cN"`. `src/styles/person-colors.css` maps `[data-color="cN"]` to local `--bar`, `--on-bar` and `--dot` variables.
- **Allocation:** the picker pre-selects the first unused color. When all 12 are taken (13 or more people), duplicates are allowed and the picker labels who already uses each color.
- **Why names are mandatory:** 12 hues cannot all be told apart reliably by people with color-vision deficiencies. **Name text on bars, dots and lists is the guaranteed differentiator** (WCAG 1.4.1).

---

## 5. Tech stack decision

### 5.1 Summary

Versions were checked on the npm registry on 2026-10-08. Pin with `^` (caret) except where noted, and commit `package-lock.json`.

| Concern | Choice | Version |
|---|---|---|
| Runtime | Node.js 24 LTS: local (machine has v24.11.1) and Netlify (`NODE_VERSION = "24"`; the functions runtime follows the build version) | `.nvmrc` = `24`; `engines.node` = `">=22.13"` |
| Frontend | Vite + React + TypeScript | `vite ^8.3`, `@vitejs/plugin-react ^6.1`, `react ^19.3`, `react-dom ^19.3` |
| TypeScript | **`typescript ~6.0.3`, not 7.x** (TS 7, the native port, breaks typescript-eslint; see §5.2) | `~6.0.3` |
| Router | `wouter` | `^3.13` |
| Icons | `lucide-react` (tree-shaken, no other dependencies) | latest |
| Styling | CSS Modules + global CSS custom properties (design tokens). No CSS framework | built into Vite |
| Fonts | Self-hosted woff2 bundled by Vite (for example an `@fontsource-variable/*` package), or a system stack, per DESIGN.md. **No third-party font CDN** (CSP, performance, and the EU/GDPR issue with Google Fonts) | N/A |
| Backend | Netlify Functions v2 (TypeScript): **one** function, `netlify/functions/api.ts`, with `config.path = "/api/*"` and an internal router | `@netlify/functions ^6.0` (types) |
| Storage | Netlify Blobs, site-wide store, **strong consistency** | `@netlify/blobs ^11.1.3` |
| Local dev | Netlify CLI `netlify dev` (Vite proxied on 8888, functions, local Blobs sandbox, `.env` injection) | `netlify-cli@27` run via `npx` (§5.10) |
| Lint | ESLint flat config: `eslint ^9.39` (**not 10**; see §5.2), `@eslint/js ^9`, `typescript-eslint ^8.71`, `eslint-plugin-react-hooks ^7.1`, `eslint-plugin-react-refresh ^0.5`, `eslint-plugin-jsx-a11y` latest, `globals` | as listed |
| Unit and component tests | Vitest; jsdom for component tests | `vitest ^5.0`, `jsdom ^30`, `@testing-library/react ^16.3`, `@testing-library/user-event ^14.6`, `@testing-library/jest-dom ^7` |
| E2E | Playwright test runner; axe | `@playwright/test ^1.64`, `@axe-core/playwright ^4.13` |
| Scripts | `tsx` (seed script), `cross-env` (TZ matrix on Windows) | `tsx ^4.23`, `cross-env ^10.1` |
| Types | `@types/node ^24`, `@types/react ^19`, `@types/react-dom ^19` | as listed |
| Hosting | Netlify (static `dist/` + Functions + Blobs). Not deployed by the team | N/A |

**Not used, and why:**
- **FullCalendar:** see §5.2.
- **date-fns, dayjs, Luxon:** they work on local-time `Date` objects by default, which is exactly the bug class SPEC.md warns about. Pure string and UTC helpers are smaller and safer.
- **zod:** the validators are few and shared between client and server, so hand-written validators avoid about 10+ KB of client JS.
- **TanStack Query or Redux:** the data set is tiny and loaded once, so React context plus a fetch hook is enough.
- **Tailwind:** DESIGN.md tokens map directly onto CSS variables, and CSS Modules keep components scoped with no extra tooling.

### 5.2 Key decisions and rationale

1. **Keep Vite + React + TypeScript (do not go lighter).**
   - SPEC.md allows something lighter only with a justification, and none applies.
   - React 19 plus react-dom is about 60 KB gzipped, which fits the 120 KB initial-JS budget alongside the app (about 35–45 KB).
   - Lighthouse at 90 or above is realistic for a small SPA with a static loading shell.
   - React has the best testing-library support and is the most predictable for the builder.
   - **Fallback lever** if the budget is missed: alias `react`/`react-dom` to `preact/compat`. Do not do this pre-emptively.

2. **Hand-built month grid and timeline, not FullCalendar.**
   - **Exclusive end dates:** FullCalendar treats all-day `end` as exclusive (the day after). Every read and write would need a +1/-1 conversion, which is the off-by-one bug class SPEC.md flags. Our model is inclusive throughout.
   - **The timeline would be hand-built anyway:** the "resource timeline" view in FullCalendar is a premium (paid) plugin. Hand-building both views lets them share one tested date module and one lane-packing algorithm.
   - **Mobile month view:** at 375px the columns are about 50px. FullCalendar's day-grid stacking and "+more" popovers are hard to make readable, touch-friendly and themeable (light and dark person colors) without overriding many internal classes.
   - **Bundle and control:** FullCalendar adds tens of KB gzipped. A hand-built grid is a few KB, and we control semantics, test hooks (§4.7) and CLS.
   - **Risk:** more custom code. **Mitigation:** the layout is pure functions with exhaustive unit tests (§7.2).

3. **`wouter` over React Router.**
   - About 2 KB, with hooks-based routes and real `<a href>` links (crawlable, which helps the Lighthouse SEO "links are crawlable" audit).
   - Covers the dozen routes we need. React Router's data APIs are unnecessary here.

4. **One API function with an internal router.**
   - A low-traffic app suffers mostly from cold starts. One function means one warm instance serves every endpoint, and the auth, store and config code is shared.
   - Handlers are plain `(req, ctx, deps) => Promise<Response>` functions, unit-testable with an in-memory store (§5.11).

5. **Session mechanism: signed, HttpOnly cookies.**
   - Stateless HMAC-signed tokens, no server session store (details in §5.8).
   - The passcode is never stored client-side and JavaScript cannot read the tokens.

6. **PIN once per device ("acting as").**
   - Verifying a PIN issues a person-session cookie (90 days if "remember", otherwise a browser-session cookie). Edits and deletes of that person's plans then need no PIN on that device.
   - This meets SPEC.md's "editing or deleting requires their PIN" (the PIN is proven server-side, once per device) and keeps adding a plan under 20 seconds.
   - **Creating** a plan for a person also requires being that person (or admin). SPEC.md does not forbid this, and it prevents impersonation. Flagged as Q2.

7. **Blobs layout: one document per collection, with optimistic concurrency.**
   - `people` and `events` are single JSON documents, read with strong consistency and written with `onlyIfMatch` (ETag) plus retry (§5.5).
   - At this scale (about 300 bytes per event), 5,000 events is about 1.5 MB, so one read serves the whole calendar.
   - Per-event keys would need N reads per page load. Per-person documents would need a lookup to find an event's owner.

8. **ESLint 9 and TypeScript 6.0.** Checked against the registry:
   - `typescript-eslint@8.71` declares the peer `typescript >=4.8.4 <6.1.0`, so TS 7.x (current `latest`) and 6.1+ would break linting.
   - `eslint-plugin-jsx-a11y` declares peer `eslint` up to `^9`.
   - Pin `typescript ~6.0.3` and `eslint ^9.39`.
   - **TS 6 rules:**
     - Set every compiler option explicitly, including `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`, `skipLibCheck: true` and an explicit `types` array per tsconfig.
     - Do not use `baseUrl` or legacy `moduleResolution` values.
     - **Use relative imports only, with no path aliases.** Vite, Netlify's function bundler and `tsx` must all resolve the imports.

### 5.3 Data model (MUST; `shared/types.ts`)

```ts
export type ISODate = string;            // 'YYYY-MM-DD' calendar date, never a timestamp
export type PersonColorId = 'c1'|'c2'|'c3'|'c4'|'c5'|'c6'|'c7'|'c8'|'c9'|'c10'|'c11'|'c12';

export interface Person {                // public DTO – the ONLY person shape the API returns
  id: string;                            // crypto.randomUUID()
  name: string;
  colorId: PersonColorId;
  createdAt: string;                     // ISO instant; audit metadata only
}
export interface StoredPerson extends Person {   // server-only, never serialized to clients
  pinHash: string;                       // 'scrypt$16384$8$1$<saltB64url>$<hashB64url>'
  pinChangedAt: string;                  // ISO instant
}
export interface PlanEvent {
  id: string;                            // crypto.randomUUID()
  personId: string;                      // owner; immutable after creation
  title: string;
  place: string;
  startDate: ISODate;                    // inclusive
  endDate: ISODate;                      // inclusive (single-day: endDate === startDate)
  notes: string;                         // '' when empty
  createdAt: string;                     // ISO instant; audit metadata only
  updatedAt: string;                     // ISO instant; audit metadata only
}
```

`createdAt` and `updatedAt` are **audit metadata only**. They are never used for calendar placement, sorting by day, or overlap.

**Validation (`shared/validation.ts`, used by the client form and the server):**

| Field | Rule |
|---|---|
| `name` | Trim and collapse inner whitespace. 1–40 characters. Unique, compared with `toLocaleLowerCase('en')` (accents are significant, so "Klára" and "Klara" are different people). Maximum 50 people |
| `colorId` | One of `c1`–`c12`. Duplicates are allowed |
| `pin` | `/^\d{4,6}$/` |
| `title` | Trim. 1–80 characters |
| `place` | Trim. 1–80 characters. **Required** (SPEC.md marks only notes as optional; see Q4) |
| `notes` | Trim the end. 0–1,000 characters. Newlines allowed |
| `startDate`, `endDate` | `isValidISODate`, year 2000–2100, `startDate <= endDate`, inclusive span at most 366 days |
| Request body | JSON only, at most 16 KB. Unknown fields ignored. On update, a `personId` different from the stored owner returns 400 |
| Totals | At most 5,000 events in the store, otherwise 400 `VALIDATION` "Storage limit reached" |

Validators return `{ ok: true, value } | { ok: false, fields: Record<string, string> }`, with human-readable messages.

### 5.4 Date handling rules (MUST; `shared/dates.ts` is the only place that touches `Date` for calendar logic)

1. **Representation:** calendar dates are `YYYY-MM-DD` strings everywhere: storage, API, URL params, React state, props and test fixtures. Months are `YYYY-MM`.
2. **Inclusive ranges:** `endDate` is the last day of the plan.
   - Length is `diffDays(start, end) + 1`.
   - A single-day plan has `startDate === endDate`.
   - A plan covers `day` if `startDate <= day && day <= endDate`.
   - Two plans overlap if `aStart <= bEnd && bStart <= aEnd`.
   - Valid `YYYY-MM-DD` strings compare correctly as plain strings.
3. **Never use these for calendar dates:**
   - `new Date('YYYY-MM-DD')` or `Date.parse` (parsed as UTC midnight, which shows as the previous day west of UTC)
   - The local getters `getDate`, `getMonth`, `getFullYear`, `getDay`
   - `toISOString().slice(0, 10)` (converts to UTC, which gives the wrong day near midnight east of UTC)
4. **Arithmetic:** build dates only with `Date.UTC(y, m - 1, d)` and read them only with `getUTC*`, inside `shared/dates.ts`. Alternatively use pure integer day-number arithmetic.
5. **"Today"** is the user's **local** calendar date. `todayLocal(now = new Date())` is the **only** function that reads local getters.
6. **Formatting:** use `Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' })` on a UTC-midnight `Date` built from the parts.
   - Range formats:
     - Same month: "12–16 Oct 2026"
     - Across months: "30 Jan – 2 Feb 2031"
     - Across years: "30 Dec 2030 – 2 Jan 2031"
     - Single day: "Sat 15 Mar 2031"
   - Duration: "1 day" / "N days". Position: "day 2 of 5".
7. **Native date inputs** already yield `YYYY-MM-DD`. Pass the value straight through, without converting via `Date`.
8. **Server behaviour:** the server validates date strings and stores them **exactly** as validated. It never re-formats them or attaches a time zone.
9. **Required exports:** `isValidISODate`, `parseISODate`, `toISODate`, `addDays`, `diffDays`, `compareISODate`, `daysInclusive`, `eachDay`, `weekdayIndexMon0`, `startOfWeekMon`, `toMonthKey`, `parseMonthKey`, `isValidMonthKey`, `addMonths`, `firstOfMonth`, `lastOfMonth`, `daysInMonth`, `buildMonthWeeks`, `todayLocal`, `coversDay`, `overlaps`, `formatDate`, `formatRange`, `formatDuration`.
10. **Lint enforcement** (ESLint `no-restricted-syntax` / `no-restricted-properties`):
    - In `src/**` and `shared/**`, **except** `shared/dates.ts`, ban: `new Date(...)`, `Date.parse`, `.getDate`, `.getMonth`, `.getFullYear`, `.getDay`, `.toISOString`.
    - `netlify/**` may use `Date.now()` and `new Date().toISOString()` for audit timestamps and token expiry only.

### 5.5 Netlify Blobs layout and concurrency (MUST)

- **Store:** site-wide `getStore({ name, consistency: 'strong' })`.
  - Strong consistency is required. The default eventual consistency can hide a just-saved plan for up to 60 seconds.
  - The store name comes from the deploy context so that deploy previews and branch deploys never touch production data:
    - `production` uses `friends-planner`
    - Any other context uses `friends-planner-{context}`, for example `friends-planner-deploy-preview` or `friends-planner-dev`
    - Fall back to `dev` if the context is unavailable
  - **Region:** leave the default (Netlify's default site-wide region, `us-east-2`, which matches the default functions region). Do not pass `region` (see Q8).

- **Keys:**

  | Key | Value |
  |---|---|
  | `people` | `{ schemaVersion: 1, people: StoredPerson[] }` |
  | `events` | `{ schemaVersion: 1, events: PlanEvent[] }` |
  | `throttle/pin/{personId}` | `ThrottleState` |
  | `throttle/group/{ipHash}` | `ThrottleState` |
  | `throttle/admin/{ipHash}` | `ThrottleState` |

  - `ThrottleState = { failures: number; lockLevel: number; lockedUntil: number /* epoch ms */; updatedAt: number }`.
  - `ipHash` is the first 32 hex characters of `sha256(SESSION_SECRET + '|' + ip)`, where `ip` is `context.ip`. Raw IPs are never stored.

- **`updateJSON(key, initial, mutate)` helper:**
  - Up to 5 attempts.
  - Each attempt calls `getWithMetadata(key, { type: 'json', consistency: 'strong' })`.
    - Missing document: `setJSON(key, mutate(initial), { onlyIfNew: true })`.
    - Otherwise: `setJSON(key, mutate(data), { onlyIfMatch: etag })`.
  - If `modified === false`, wait with jittered backoff (20–120 ms) and retry.
  - After 5 failures, respond 409 `CONFLICT`.
  - `mutate` may throw typed errors (validation, `NAME_TAKEN`, not found). These abort without writing.
  - Verified: @netlify/blobs 11.1.3 exposes `onlyIfMatch`/`onlyIfNew` returning `{ modified, etag }`. Its local server answers `If-Match` mismatches with 412, and netlify-cli 27.11.2 depends on `@netlify/blobs ^11.1.3`. The builder must still confirm conditional writes work under `netlify dev`.
- **Cascades:** deleting a person removes their events first, then the person. These are two writes and are not atomic, which is acceptable: an orphan person with no events can simply be deleted again.
- **Reads:** `GET /api/events` reads the single `events` document.
- **Testability:** `netlify/lib/store.ts` exports:
  - A `KeyValueStore` interface (`getWithMetadata`, `setJSON` with conditions, `delete`)
  - `createBlobsStore(deployContext)`
  - `createMemoryStore()`, which implements identical ETag and `onlyIfMatch`/`onlyIfNew` semantics for unit tests

### 5.6 API endpoints (MUST)

**Conventions for every endpoint:**
- JSON in and out. `Cache-Control: no-store` on every response.
- **Mutations:** require `Content-Type: application/json`, otherwise 415.
- **Error envelope:** `{ "error": { "code", "message", "fields"?, "remainingAttempts"?, "retryAfterSeconds"? } }`. The client branches on `error.code`, not only on the HTTP status.
- **Unknown routes:** `/api/*` paths that match nothing return JSON 404. A wrong method returns 405.
- **Cookies:** "fp_session req." means the endpoint requires a valid group session cookie (§5.8), otherwise 401 `UNAUTHENTICATED`.

| Method and path | Auth | Request body | Success | Notable errors |
|---|---|---|---|---|
| `GET /api/health` | none | N/A | 200 `{ ok: true }` (no other info) | N/A |
| `GET /api/session` | none | N/A | **always 200** `{ authenticated, admin, person: Person \| null }` | N/A |
| `POST /api/session` | none (group-passcode throttle) | `{ passcode }` | 200 (same shape) + sets `fp_session` | 401 `PASSCODE_INVALID` `{remainingAttempts}`; 429 `LOCKED` |
| `DELETE /api/session` | none | N/A | 204; clears `fp_session`, `fp_person`, `fp_admin` | N/A |
| `DELETE /api/session/person` | fp_session req. | N/A | 204; clears `fp_person` ("Forget me on this device") | N/A |
| `GET /api/people` | fp_session req. | N/A | 200 `{ people: Person[] }`, sorted by name | N/A |
| `POST /api/people` | fp_session req. | `{ name, colorId, pin, remember }` | 201 `{ person }` + sets `fp_person` | 400 `VALIDATION`; 409 `NAME_TAKEN` |
| `PATCH /api/people/:id` | fp_session + (person session for `:id` **or** admin) | `{ name?, colorId? }` | 200 `{ person }` | 403 `PIN_REQUIRED`; 404; 409 `NAME_TAKEN` |
| `DELETE /api/people/:id` | fp_session + **admin** | N/A | 204 (cascades the person's events and their PIN throttle) | 403 `FORBIDDEN`; 404 |
| `POST /api/people/:id/verify-pin` | fp_session req. (per-person PIN throttle) | `{ pin, remember }` | 200 `{ person }` + sets `fp_person` | 403 `PIN_INVALID` `{remainingAttempts}`; 429 `LOCKED` `{retryAfterSeconds}`; 404 |
| `POST /api/people/:id/reset-pin` | fp_session + **admin** | `{ newPin }` | 204. Clears that person's throttle. Changing the hash invalidates their device tokens | 400; 403 `FORBIDDEN`; 404 |
| `GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD` | fp_session req. | N/A | 200 `{ events: PlanEvent[] }`. `from`/`to` are optional and filter by overlap. Sorted by `startDate` ascending, then `endDate` descending, then `id` | 400 for invalid dates |
| `POST /api/events` | fp_session + (person session for `body.personId` **or** admin) | `{ personId, title, place, startDate, endDate, notes }` | 201 `{ event }` | 400 `VALIDATION`; 403 `PIN_REQUIRED`; 404 (unknown person) |
| `PUT /api/events/:id` | fp_session + (person session for the **stored** owner **or** admin) | `{ title, place, startDate, endDate, notes }` | 200 `{ event }` | 400; 403 `PIN_REQUIRED`; 404; 409 `CONFLICT` |
| `DELETE /api/events/:id` | same as PUT | N/A | 204 | 403 `PIN_REQUIRED`; 404 |
| `POST /api/admin/session` | fp_session req. (admin-passcode throttle) | `{ passcode }` | 200 `{ admin: true }` + sets `fp_admin` | 401 `PASSCODE_INVALID`; 429 `LOCKED` |
| `DELETE /api/admin/session` | none | N/A | 204; clears `fp_admin` | N/A |
| `GET /api/admin/export` (COULD) | fp_session + admin | N/A | 200 JSON download `{ people: Person[], events }`, **without PIN hashes** | 403 |

**HTTP status and error code catalogue:**

| Status | Codes |
|---|---|
| 400 | `VALIDATION`, `BAD_REQUEST` (malformed JSON) |
| 401 | `UNAUTHENTICATED` (no or invalid group session), `PASSCODE_INVALID` |
| 403 | `PIN_REQUIRED`, `PIN_INVALID`, `FORBIDDEN` (admin only) |
| 404 | `NOT_FOUND` |
| 405 | `METHOD_NOT_ALLOWED` |
| 409 | `NAME_TAKEN`, `CONFLICT` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` |
| 429 | `LOCKED`, with a `Retry-After` header |
| 500 | `MISCONFIGURED`, `INTERNAL` |

**Client behaviour on errors:**
- On `UNAUTHENTICATED`: drop the cached data and show the gate, keeping the current URL.
- On `PIN_REQUIRED`: open `PinDialog`, then retry.

### 5.7 Server-side permission rules (MUST; enforced only in `netlify/lib/auth.ts` and the handlers, never trusted from the UI)

1. Every `/api/*` route except `GET /api/health`, `GET|POST|DELETE /api/session` and `DELETE /api/admin/session` requires a valid `fp_session`. Otherwise respond 401 `UNAUTHENTICATED`.
2. `canActFor(personId)` is true if either:
   - the admin session is valid, **or**
   - `fp_person` is valid **and** its `pid === personId` **and** its PIN fingerprint matches the person's current `pinHash` (§5.8).
3. **Event updates and deletes** check `canActFor(storedEvent.personId)`, using the owner from **storage**, never from the request. **Event creation** checks `canActFor(body.personId)`. A failed check returns 403 `PIN_REQUIRED`.
4. **Admin-only endpoints** (`DELETE /api/people/:id`, `reset-pin`, `export`) require a valid `fp_admin` session. Otherwise 403 `FORBIDDEN`.
5. `personId` is immutable. There is no endpoint that transfers a plan to another person.
6. **Outgoing data:** the only route to output is the `toPersonDTO(stored)` mapper. No response ever contains `pinHash`, `pinChangedAt`, a salt or a PIN. Unit tests assert this recursively for every endpoint.
7. **PIN checks** happen only in `verify-pin`, behind the throttle. Mutations never accept a PIN in the body.

### 5.8 Security (MUST)

**Environment variables** (validated by `netlify/lib/config.ts` on every request; the parsed result is cached per instance):

| Var | Purpose | Rule |
|---|---|---|
| `GROUP_PASSCODE` | Shared passcode needed to view anything | At least 8 characters in production |
| `ADMIN_PASSCODE` | Admin override (edit or delete any plan, reset PINs, delete people) | At least 12 characters in production. Must differ from `GROUP_PASSCODE` |
| `SESSION_SECRET` | HMAC key for cookies and IP hashing | At least 32 characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

- **Invalid or missing config:** every endpoint except `/api/health` returns 500 `MISCONFIGURED`. The server logs the **name** of the bad variable, never its value.
- **Production placeholders:** in the `production` context, refuse the `.env.example` placeholder values.
- **`.env.example`:** committed, with comments and the placeholder values below:
  ```
  GROUP_PASSCODE=change-me-group
  ADMIN_PASSCODE=change-me-admin-passcode
  SESSION_SECRET=replace-with-at-least-32-random-characters
  ```
- **Local `.env`:** the builder creates it locally (gitignored) with these same placeholder values, so the review agents can use them (§7.4).
- **Nothing secret is committed.** `.gitignore` covers `.env`, `.env.*` (except `.env.example`), `.netlify/`, `node_modules/`, `dist/`, `coverage/`, `test-results/`, `playwright-report/` and `blob-report/`.

**Session tokens (`netlify/lib/crypto.ts` + `auth.ts`):**
- **Format:** `v1.<payloadB64url>.<sigB64url>`, where `sig = HMAC-SHA256(scopeKey, "v1." + payloadB64url)`. Verify with `timingSafeEqual`, then check `scope` and `exp`.
- **Scope keys:**
  - `kGroup = HMAC(SESSION_SECRET, "group|" + GROUP_PASSCODE)`
  - `kAdmin = HMAC(SESSION_SECRET, "admin|" + ADMIN_PASSCODE)`
  - `kPerson = HMAC(SESSION_SECRET, "person")`
  - Because the passcodes are part of the keys, **rotating a passcode instantly invalidates every session of that scope**. A low-entropy passcode is never the HMAC key on its own, so a stolen cookie cannot be used to brute-force a passcode offline.
- **Payloads:**
  - group: `{ scope: 'group', iat, exp: iat + 180 days }`
  - admin: `{ scope: 'admin', iat, exp: iat + 12 hours }`
  - person: `{ scope: 'person', pid, pfp, iat, exp }`
    - `pfp` is the first 16 hex characters of `sha256(pinHash)`, so a PIN reset invalidates remembered devices.
    - `exp` is 90 days with "remember", otherwise 12 hours.
- **Cookies:** `fp_session`, `fp_person`, `fp_admin`.
  - All are `HttpOnly; Path=/`.
  - `SameSite=Lax` for `fp_session` and `fp_person`; `SameSite=Strict` for `fp_admin`.
  - `Secure` **only when the request is HTTPS** (check `x-forwarded-proto` or the URL protocol), so `http://localhost:8888` works in every browser.
  - `Max-Age` matches `exp`. When "remember" is off, `fp_person` gets no `Max-Age` (a browser-session cookie).
  - Set them with explicit `Set-Cookie` headers from `netlify/lib/http.ts` (not `context.cookies`), so handlers stay testable with plain `Request`/`Response`.
- **Passcode comparison:** `timingSafeEqual(sha256(input), sha256(expected))`.

**PIN hashing:**
- Node `crypto.scrypt` (promisified) with a 16-byte random salt and `N=16384, r=8, p=1`, `keylen 32`.
- Stored as `scrypt$16384$8$1$<salt>$<hash>` (base64url). Verify by parsing the parameters from the stored string and comparing with `timingSafeEqual`.
- PINs are never logged, stored, returned or echoed.
- **Residual risk (accepted):** if the Blobs data ever leaked, a 4–6 digit PIN could be brute-forced offline. Blobs are only reachable through the site's own functions, and PINs protect only calendar edits. A server-side pepper was rejected as an operational footgun for a friend group (rotating it would break every PIN).

**Brute-force throttling (`netlify/lib/throttle.ts`; pure state functions with an injected clock, persisted in Blobs):**

| Target | Key | Threshold | Lock |
|---|---|---|---|
| PIN | per person (`throttle/pin/{personId}`) | 5 consecutive failures | 15 min |
| Group passcode | per IP hash | 10 consecutive failures | 15 min |
| Admin passcode | per IP hash | 5 consecutive failures | 15 min |

- **Repeat lockouts:** any failure after a lock expires (with no success in between) locks again with doubled duration (15 min, 30 min, 1 h, 2 h ... capped at 24 h). This caps PIN guessing at roughly 40 attempts per month per person.
- **Resetting the counter:**
  - A successful attempt resets that key.
  - An admin `reset-pin` deletes `throttle/pin/{personId}`.
- **Checks:**
  - Check the lock **before** running scrypt.
  - While locked, respond 429 `LOCKED` with `Retry-After` and `retryAfterSeconds`, without evaluating the PIN.
  - On a failure, return `remainingAttempts` before the next lock.
- **Throttle writes** use `updateJSON`. A race may let 1–2 extra attempts through, which is acceptable.
- Netlify's built-in `config.rateLimit` is **not** relied on (plan-dependent and not enforced by `netlify dev`).

**Other protections:**
- **CSRF:** `SameSite` cookies, mutations that require `application/json` (which forces a CORS preflight that we never allow), and no CORS headers.
- **SHOULD:** reject mutations whose `Origin` header is present and whose host differs from the request's `Host` / `X-Forwarded-Host`. Verify this works under `netlify dev` before enabling it.
- **Output:** React escapes everything. Do not use `dangerouslySetInnerHTML`. Notes render as text with `white-space: pre-wrap`.
- **Logging:** never log request bodies, cookies, PINs or passcodes. Log only error codes and request IDs.

**Security headers:**
- `netlify.toml` sets these headers on `/*` (MUST):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: same-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **CSP (SHOULD, build only):** a small Vite plugin (`apply: 'build'`, `transformIndexHtml`) injects
  `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'">`.
  - It is build-only because Vite's dev server injects `<style>` tags that a strict CSP would block.
  - React inline `style` props are applied through the CSSOM, which CSP allows.
  - The theme bootstrap script is an external file (`/theme-init.js`) so `script-src 'self'` holds.
  - Verify zero CSP violations under `netlify serve`.

### 5.9 Netlify configuration and hosting assumptions

**`netlify.toml`** (in `friends-planner/`, MUST):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"

[functions]
  directory = "netlify/functions"

[dev]
  framework = "#custom"
  command = "npm run dev:vite"
  targetPort = 5173
  port = 8888
  autoLaunch = false

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "same-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Config notes:**
- **Hashed build output:** Vite `build.assetsDir = "static"`, so hashed bundles live in `dist/static/` and get immutable caching. This keeps `/assets/` free for the team's (empty) `public/assets/` convention.
- **API routing:**
  - `netlify/functions/api.ts` exports `config = { path: "/api/*" }`.
  - Netlify docs state that a function with a `path` runs for matching requests regardless of static files. The builder must still verify in `netlify dev` that `/api/session` returns JSON and is not rewritten to `index.html` by the SPA rule.

**Hosting assumptions:**
- Netlify free tier (Functions and Blobs are included). Netlify's own site password protection is a paid feature and is **not** used: the passcode is implemented in the app.
- The repo root is the workspace root and the app lives in `friends-planner/`. When connecting the repo, set **Base directory = `friends-planner`**.
- **Site-wide Blobs are shared across deploy contexts** on Netlify. This is why the store name includes the deploy context (§5.5).
- **No deploy is performed by the team.**

### 5.10 Local development (MUST)

- **Prerequisites:** Node 24. The Netlify CLI runs on demand via `npx --yes netlify-cli@27 …` from the npm scripts.
  - **Why it is not a devDependency:** it keeps about 1,000 transitive packages out of `package-lock.json` and out of the auditor's `npm audit` gate.
  - The README also offers `npm i -g netlify-cli` for faster starts.
  - Local `netlify dev` does not require linking a Netlify site; Blobs use a local sandbox store.

- **`package.json` (`"type": "module"`) scripts (MUST, exactly these names):**

  | Script | Command |
  |---|---|
  | `dev` | `npx --yes netlify-cli@27 dev` (app, API and Blobs at **http://localhost:8888**) |
  | `dev:vite` | `vite --port 5173 --strictPort` (started by netlify dev; never used directly) |
  | `build` | `npm run typecheck && vite build` |
  | `typecheck` | `tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.server.json --noEmit && tsc -p tsconfig.node.json --noEmit` (application code only; never includes `tests/`) |
  | `typecheck:tests` | `tsc -p tsconfig.test.json --noEmit` (QA's tests; not part of `build`) |
  | `lint` | `eslint .` |
  | `test` | `npm run test:unit && npm run test:e2e` |
  | `test:unit` | `vitest run` |
  | `test:unit:tz` | `cross-env TZ=Europe/Prague vitest run && cross-env TZ=America/Los_Angeles vitest run && cross-env TZ=Pacific/Kiritimati vitest run && cross-env TZ=Pacific/Pago_Pago vitest run` |
  | `test:e2e` | `playwright test` |
  | `test:e2e:install` | `playwright install chromium` |
  | `seed` | `tsx scripts/seed.ts` |
  | `serve:prod` | `npx --yes netlify-cli@27 serve` (production build plus functions, locally) |
  | `check` | `npm run lint && npm run typecheck && npm run typecheck:tests && npm run test:unit:tz` |

  All scripts must work in Windows PowerShell and Git Bash: no `rm -rf`, no inline `VAR=x` assignments (use `cross-env`), and no bash-only syntax.

- **`scripts/seed.ts` (MUST):**
  - **Target and environment:** reads `BASE_URL` (default `http://localhost:8888`) and **refuses any host other than `localhost` or `127.0.0.1`**. Loads `.env` via `process.loadEnvFile()`.
  - **Steps:**
    1. Logs in with the group and admin passcodes through the API.
    2. Deletes every person, which cascades their events.
    3. Creates 10 demo people (unique colors `c1`–`c10`, all with PIN `1234`, documented as local-only).
    4. Creates about 25 plans relative to the **current month**. They must include:
       - At least 4 people away on the same weekend (overlap stress)
       - A plan crossing the end of the current month into the next
       - A plan crossing a week boundary
       - At least 3 single-day plans
       - A 2-week trip
       - One person with two back-to-back plans
       - At least one plan with long notes
  - Prints a summary.
  - `--empty` deletes everything and creates nothing.
  - It uses only public API endpoints, so it cannot corrupt the storage format.

- **Static loading shell:** `index.html` contains one inside `#root` (app name and a neutral skeleton, styled by the main CSS bundle). This gives a fast FCP; React replaces it on mount. Include a `<noscript>` message.

- **Theme bootstrap:**
  - `public/theme-init.js` (classic script, loaded synchronously in `<head>`) reads `localStorage['fp.theme']` (`system|light|dark`) and sets `data-theme` on `<html>` before first paint. This prevents a flash of the wrong theme.
  - `ThemeContext` keeps it in sync, and listens to `prefers-color-scheme` when the setting is `system`.

### 5.11 Test tooling the builder MUST set up (QA writes the tests; the builder never edits `tests/`)

**Install:** every test dependency listed in §5.1. QA cannot install packages.

**`vitest.config.ts` (root):**
- `test.include: ['tests/unit/**/*.test.{ts,tsx}']`, `environment: 'node'`. Component test files opt in with `// @vitest-environment jsdom`.
- `setupFiles` includes `tests/unit/setup.ts` **only if that file exists** (`existsSync`).
- `restoreMocks: true`.

**`playwright.config.ts` (root):**
- **Environment:** load `.env` if present via `process.loadEnvFile('.env')`.
- **General settings:**
  - `testDir: 'tests/e2e'`
  - `fullyParallel: false`, `workers: 1` (shared local store)
  - `retries: 0`
  - `reporter: [['list'], ['html', { open: 'never' }]]`
  - `globalSetup: 'tests/e2e/global-setup.ts'` **only if the file exists**
- **`use`:**
  - `baseURL: process.env.BASE_URL ?? 'http://localhost:8888'`
  - `locale: 'en-GB'`, `timezoneId: 'Europe/Prague'`
  - `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`
- **`webServer`:** `{ command: 'npm run dev', url: 'http://localhost:8888/api/health', reuseExistingServer: true, timeout: 180_000 }`.
- **Projects** (all Chromium):

  | Project | Viewport and options | Test selection |
  |---|---|---|
  | `mobile-375` | 375×812, `isMobile: true`, `hasTouch: true`, `deviceScaleFactor: 2` | `grepInvert: /@tz/` |
  | `tablet-768` | 768×1024 | `grepInvert: /@tz/` |
  | `desktop-1440` | 1440×900 | `grepInvert: /@tz/` |
  | `tz-plus14` | 375×812, `timezoneId: 'Pacific/Kiritimati'` | `grep: /@tz/` |
  | `tz-minus11` | 1440×900, `timezoneId: 'Pacific/Pago_Pago'` | `grep: /@tz/` |

**Server testability:**
- `netlify/lib/router.ts` exports `handleApiRequest(req: Request, deps: { store: KeyValueStore; env: Record<string, string|undefined>; ip: string; now: () => number })`. `api.ts` only adapts the Netlify `Context` into `deps`.
- `createMemoryStore()` is exported from `netlify/lib/store.ts`.
- **Type-checking tests:** `tsconfig.test.json` covers `tests/**` plus the code under test. It uses DOM and ES2023 libs, `jsx: "react-jsx"` and `types: ["node"]`; tests import `describe`/`it`/`expect` explicitly (no globals). ESLint also lints `tests/**`.
- **Keep the build independent of tests:** `build` and `typecheck` never include `tests/`, so a typing problem in a QA test cannot block a production build. QA's type errors surface through `typecheck:tests` and `check`.

### 5.12 Performance budget (MUST)

- **JS:** initial route JS at most 120 KB gzipped. `PeoplePage`, `AdminPage`, `PersonForm` and `EventForm` are `React.lazy` chunks. Preload `EventForm` on idle or on FAB pointer-down so it opens instantly.
- **CSS:** at most 25 KB gzipped. **Fonts:** at most 2 woff2 files, `font-display: swap`, the primary one preloaded.
- **Data loading:** after `GET /api/session` reports authenticated, fetch `GET /api/people` and `GET /api/events` **in parallel**.
  - Refetch after every mutation, and on `visibilitychange` to visible (at most once per 30 seconds).
- **No layout shift:** grid row heights are fixed per breakpoint and the skeleton matches the final layout (CLS below 0.05).
- **Motion:** animate only `transform` and `opacity`, and respect `prefers-reduced-motion` (DESIGN.md defines the details).

---

## 6. File structure

```
friends-planner/
├── .env.example                 # committed; placeholders + comments (§5.8)
├── .env                         # local only, gitignored (builder creates from .env.example)
├── .gitignore
├── .nvmrc                       # 24
├── README.md                    # §7.3
├── eslint.config.js             # flat config incl. jsx-a11y and the date rules (§5.4.10)
├── index.html                   # meta tags, loading shell, theme-init.js, module entry
├── netlify.toml                 # §5.9
├── package.json / package-lock.json
├── playwright.config.ts         # §5.11
├── tsconfig.json                # solution file referencing the four below
├── tsconfig.app.json            # src/ + shared/ (DOM libs, types: ["vite/client"])
├── tsconfig.server.json         # netlify/ + shared/ + scripts/ (types: ["node"])
├── tsconfig.node.json           # vite/vitest/playwright config files (types: ["node"])
├── tsconfig.test.json           # tests/ + code under test (DOM + node, jsx) – used by typecheck:tests only
├── vite.config.ts               # react plugin, assetsDir "static", build-only CSP meta plugin
├── vitest.config.ts             # §5.11
├── netlify/
│   ├── functions/
│   │   └── api.ts               # single entry; config.path "/api/*"; adapts Context → deps
│   └── lib/
│       ├── router.ts            # handleApiRequest: method+path dispatch, 404/405, error mapping
│       ├── http.ts              # json(), errorResponse(), readJsonBody() (415/413/400), cookie helpers
│       ├── config.ts            # env validation, MISCONFIGURED
│       ├── crypto.ts            # scrypt hash/verify, HMAC token sign/verify, sha256, ipHash
│       ├── auth.ts              # readSessions(), requireGroup(), requireAdmin(), canActFor()
│       ├── throttle.ts          # pure state transitions + Blobs-backed check/record
│       ├── store.ts             # KeyValueStore, createBlobsStore, createMemoryStore, updateJSON
│       ├── repo.ts              # people/events read+write, toPersonDTO, cascades
│       └── handlers/
│           ├── health.ts
│           ├── session.ts
│           ├── people.ts
│           ├── events.ts
│           └── admin.ts
├── shared/                      # imported by both src/ and netlify/ (relative imports only)
│   ├── types.ts                 # §5.3 + API request/response + error codes
│   ├── dates.ts                 # §5.4 – the ONLY Date-touching calendar module
│   ├── validation.ts            # §5.3
│   └── colors.ts                # PERSON_COLOR_IDS c1..c12, firstUnusedColor()
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # providers + route table (§4.2) + gate wrapper
│   ├── routes.ts                # path builders: calendarPath(month), dayPath(date), …
│   ├── api/
│   │   └── client.ts            # typed fetch wrapper; ApiError with code; JSON headers
│   ├── state/
│   │   ├── SessionContext.tsx   # session/admin/acting person
│   │   ├── DataContext.tsx      # people + events, refetch, mutations
│   │   ├── FilterContext.tsx    # person filter, localStorage 'fp.filter.v1'
│   │   ├── ThemeContext.tsx     # 'fp.theme'
│   │   └── LastViewContext.tsx  # lastViewPath for closing sheets
│   ├── lib/
│   │   ├── layout.ts            # §4.5
│   │   └── useMediaQuery.ts
│   ├── components/              # §4.6 – one folder per component: Name.tsx + Name.module.css
│   │   ├── AppShell/  Header/  MonthToolbar/  ViewSwitch/  Fab/  MenuSheet/
│   │   ├── Sheet/  ConfirmDialog/  PinDialog/  PinInput/
│   │   ├── PersonBadge/  ColorSwatchPicker/  ActingAsChip/  PersonFilter/
│   │   ├── EventBar/  EventListItem/
│   │   ├── Button/  IconButton/  TextField/  DateField/  TextArea/  Checkbox/  SegmentedControl/
│   │   ├── Toast/  ErrorBanner/  EmptyState/  Spinner/  Skeleton/  AdminBanner/  Icon/
│   ├── views/
│   │   ├── PasscodeGate/
│   │   ├── CalendarView/        # CalendarView, MonthGrid, WeekRow, DayCell
│   │   ├── TimelineView/        # TimelineView, TimelineGrid, TimelineRow, AwayRow
│   │   ├── DayDetail/
│   │   ├── EventDetail/
│   │   ├── EventForm/
│   │   ├── PeoplePage/          # PeoplePage, PersonForm
│   │   ├── AdminPage/
│   │   └── NotFound/
│   └── styles/
│       ├── tokens.css           # all DESIGN.md tokens, light + dark ([data-theme])
│       ├── person-colors.css    # [data-color="cN"] → --bar/--on-bar/--dot
│       └── global.css           # reset, base typography, focus-visible, reduced motion
├── public/
│   ├── favicon.svg              # hand-written SVG mark (code, not a generated asset)
│   ├── theme-init.js            # pre-paint theme script (§5.10)
│   ├── robots.txt               # Allow: / ; Disallow: /api/
│   └── assets/
│       └── .gitkeep             # intentionally empty – no image/video assets (ASSETS.md)
├── scripts/
│   └── seed.ts                  # §5.10 – localhost only
└── tests/                       # OWNED BY QA – builder never edits
    ├── unit/                    # *.test.ts / *.test.tsx (Vitest)
    └── e2e/                     # *.spec.ts (Playwright) + helpers
```

---

## 7. Definition of done

### 7.1 Checklist (every item must be verifiable)

**Pages and behaviour**
- [ ] Every route in §4.2 and every MUST view and component in §4.3–4.6 exists and works. Every SHOULD is done or skipped with a reason.
- [ ] Every flow in §4.4 works end-to-end against `netlify dev`.
- [ ] Every test hook in §4.7 is present with the exact attribute names.
- [ ] Calendar: multi-day bars are continuous within a week row, with continuation edges across weeks and months. Consistent person colors. Lane caps and "+N" follow §4.3. Prev, next and Today work.
- [ ] Timeline: rows for every (filtered) person, horizontal scroll inside its container only, today visible on load.
- [ ] Day detail lists who is away and where. The person filter persists across reloads.
- [ ] Light and dark themes both work. The theme persists with no flash.

**Security and data**
- [ ] Every permission rule in §5.7 passes the permission-matrix unit tests, and the e2e blocked-edit and admin-override flows pass.
- [ ] No API response contains PIN material (asserted by tests). `pinHash` uses the scrypt format in §5.8.
- [ ] Throttling behaves as specified (unit tests). A PIN lockout is visible in the UI and is cleared by an admin reset (e2e).
- [ ] `.env.example` is present. `git status` / `git check-ignore` confirm `.env`, `.netlify/`, `dist/`, `node_modules/` and the test report folders are ignored. The auditor finds zero exposed secrets.
- [ ] `npm audit`: zero high or critical vulnerabilities.

**Quality gates**
- [ ] `npm run lint`, `npm run typecheck` and `npm run typecheck:tests`: zero errors (warnings are reported).
- [ ] `npm run build` succeeds. The builder reports initial JS and CSS gzip sizes: JS at most 120 KB, CSS at most 25 KB.
- [ ] `npm run test:unit:tz`: all pass in all 4 time zones. The TZ sanity test proves each zone was actually in effect.
- [ ] `npm run test:e2e`: all pass in all 5 Playwright projects against `netlify dev`.
- [ ] No horizontal page scroll at 375, 768 and 1440px on any route (e2e assertion: `scrollWidth <= innerWidth`).
- [ ] Lighthouse (mobile and desktop) on every page in §7.4: performance at least 90, accessibility at least 95, best practices at least 95, SEO at least 95.
- [ ] axe: zero serious or critical violations on the gate, calendar, timeline, day detail, plan form, plan detail, people and admin views.
- [ ] Zero console errors or warnings on initial load of every route. Under `netlify serve`, zero CSP violations.
- [ ] Reviewer reports zero Critical findings. QA, auditor and reviewer all report `STATUS: PASS`. Critic reports `APPROVED` (all scores at least 8).

**Delivery**
- [ ] README satisfies §7.3.
- [ ] `npm run serve:prod` serves the production build with working API locally ("ready to deploy").
- [ ] **Not deployed.** The final report says "ready to deploy" and lists the remaining manual steps (create the Netlify site, set the env vars).

### 7.2 Testing plan (QA writes; the builder provides the hooks and config from §4.7, §5.11 and §5.10)

**Unit tests (Vitest, `tests/unit/`). Run under TZ = Europe/Prague, America/Los_Angeles, Pacific/Kiritimati (UTC+14) and Pacific/Pago_Pago (UTC-11).**

1. **TZ sanity:** `Intl.DateTimeFormat().resolvedOptions().timeZone === process.env.TZ`. This fails loudly if the TZ matrix silently did not apply, for example on Windows.
2. **`shared/dates.ts`:**
   - Validity: `2028-02-29` is valid; `2026-02-29`, `2026-13-01`, `2026-1-5` and `2026-04-31` are invalid.
   - `addDays` and `diffDays` across month and year boundaries and across the DST dates (EU `2026-03-29` and `2026-10-25`; US `2026-03-08` and `2026-11-01`). Results must be identical in every TZ.
   - `buildMonthWeeks`:
     - A month starting on Monday (`2027-02` gives exactly 4 rows)
     - A month needing 6 rows (`2026-08`)
     - Weeks always Monday to Sunday
   - `todayLocal` with injected instants near midnight. For example, `2026-10-08T22:30:00Z` is `2026-10-09` in Prague but `2026-10-08` in Los Angeles. Build the expected value from the process TZ.
   - `formatRange` for every variant in §5.4.6; `coversDay`; `overlaps` (inclusive edges); single-day spans.
3. **`src/lib/layout.ts`:**
   - Lane packing and ordering.
   - Continuation flags at week and month edges.
   - A single-day plan gives `span 1`.
   - Events entirely before or after the week are excluded.
   - `maxLanes` hiding and `hiddenCountByDay`.
   - `awayCountByDay` counts distinct people.
   - Timeline row lanes.
4. **`shared/validation.ts`:** every rule in §5.3, including whitespace trimming, the length edges, `start > end`, a 367-day span and PIN formats.
5. **`netlify/lib/crypto.ts`:**
   - Hash and verify round-trip. A wrong PIN fails. The same PIN produces different hashes with different salts. The format string is correct.
   - Tokens: valid, tampered, expired and wrong-scope tokens. **Rotating `GROUP_PASSCODE` or `ADMIN_PASSCODE` invalidates existing tokens.** A changed `pinHash` invalidates the person token.
6. **`netlify/lib/throttle.ts`:** thresholds 5/10/5, doubling and the 24-hour cap, reset on success, admin reset clears, `retryAfterSeconds` maths. Use an injected clock.
7. **API handlers** via `handleApiRequest` with `createMemoryStore()`:
   - The full **permission matrix**:

     | Action | No session | Group only | Owner person session | Other person session | Admin |
     |---|---|---|---|---|---|
     | Create plan for X | 401 | 403 `PIN_REQUIRED` | 201 | 403 | 201 |
     | Update X's plan | 401 | 403 | 200 | 403 | 200 |
     | Delete X's plan | 401 | 403 | 204 | 403 | 204 |
     | PATCH person X | 401 | 403 | 200 | 403 | 200 |
     | Reset X's PIN / delete X | 401 | 403 `FORBIDDEN` | 403 | 403 | 204 |

   - Wrong PIN gives 403 `PIN_INVALID` with `remainingAttempts`. The 6th attempt gives 429 with `Retry-After`.
   - Wrong passcodes give 401. `GET /api/session` returns 200 when unauthenticated.
   - `personId` in an update body is ignored or rejected.
   - No response at any depth contains `pinHash`, `pin` or `salt`.
   - 415, 413, 400 and 404/405 behaviour.
   - Concurrency: a conflicting ETag retries and succeeds; persistent conflicts give 409.
   - Cascade delete of a person.
   - `MISCONFIGURED` when env vars are missing.
8. **Components** (jsdom + Testing Library):
   - `EventForm`: an empty submit shows errors; "To" follows "From"; an end date before the start is rejected.
   - `PinInput`: accepts digits only.
   - `MonthGrid`: a fixture renders the expected `data-*` attributes.

**E2E tests (Playwright, `tests/e2e/`).**

*Data and environment:*
- Run against `netlify dev` at http://localhost:8888, in every viewport project unless tagged `@tz`.
- **Data isolation:**
  - Every test person's name starts with `e2e-` plus a run ID.
  - Specs purge `e2e-*` people (through the admin API) in `beforeAll` and `afterAll`.
  - Plans go in far-future months (2031 and later) so they never collide with seed data.
  - Navigate directly via URL, for example `/calendar/2031-01`.
- **Never trigger group or admin passcode lockouts.** In netlify dev every request shares one IP. Any wrong-passcode test must be followed immediately by a successful login (which resets the counter). PIN lockouts are tested only on a throwaway `e2e-` person.

*Specs:*

| Spec | Covers (maps to the SPEC.md QA list) |
|---|---|
| `gate.spec.ts` | **Entering the group passcode.** A wrong passcode shows an error. The correct one shows the calendar. Reload keeps the session. A deep link (`/day/2031-01-15`) survives login. "Lock calendar" returns to the gate. |
| `people.spec.ts` | **Creating a person with a PIN.** Validation (PIN mismatch, 3 digits, letters, duplicate name, empty name). Success sets the acting-as chip. Color picker marks taken colors. "Forget me" works. |
| `plans-crud.spec.ts` | **Adding, editing and deleting a plan.** Bars appear on the correct cells in the calendar, timeline and day detail. Editing dates moves the bars. Cancelling a delete keeps the plan; confirming removes it. Empty and invalid submissions show inline errors. **G1 interaction budget:** at most 6 interactions from FAB to saved plan on a remembered device. |
| `permissions.spec.ts` | **Blocked from editing someone else's plan with a wrong PIN.** Acting as A, open B's plan, Edit, wrong PIN: error shown and the plan unchanged (re-read via the API). The same applies to Delete. A direct API `PUT` with A's cookie returns 403. 5 wrong PINs show the lockout message. |
| `admin.spec.ts` | **Admin override.** A wrong admin passcode once, then the correct one. Edit and delete B's plan without a PIN. Reset the throwaway person's PIN, which clears the lockout, and the new PIN works. Delete a person, which removes their plans. Exiting admin mode brings back PIN prompts. |
| `overlap.spec.ts` | **Overlapping events render correctly.** 5 `e2e-` people each have a plan on 2031-05-13 (Tue) to 2031-05-15 (Thu), all in one week row. Bars on the same days have distinct `data-lane` values and **their bounding boxes do not intersect**. At 375px, 3 lanes are visible and the cells show `data-hidden-count="2"` and a visible "+2". At 1440px all 5 are visible. Day detail lists all 5. Timeline shows 5 rows with a bar each. If `AwayRow` is implemented, it shows 5 on those days. |
| `date-edges.spec.ts` | **Month-boundary and single-day plans.** Weekdays below were verified; rows start on Monday and outside-month cells show bars.<br>(a) **Month boundary inside one week row:** a plan from 2031-01-30 (Thu) to 2031-02-02 (Sun) is **one** continuous segment with no continuation flags in **both** `/calendar/2031-01` and `/calendar/2031-02`. In each view it covers the cells 01-30, 01-31, 02-01 and 02-02, some of which are outside-month cells. Day detail includes it on those 4 days and excludes it on 01-29 and 02-03.<br>(b) **Month boundary across week rows:** a plan from 2031-03-29 (Sat) to 2031-04-02 (Wed). The March view shows two segments: 03-29…03-30 with `continues-after="true"`, then 03-31…04-02 with `continues-before="true"`. The April view, whose first row starts on Mon 03-31, shows 03-31…04-02 with `continues-before="true"`.<br>(c) **Year boundary:** a plan from 2030-12-30 (Mon) to 2031-01-02 (Thu) renders on the correct 4 cells in both `/calendar/2030-12` and `/calendar/2031-01`.<br>(d) **Single day:** a plan on 2031-03-15 (Sat) occupies exactly one cell (`seg-start = seg-end = 2031-03-15`), shows the range label "Sat 15 Mar 2031", and is absent from day detail on the 14th and 16th.<br>The timeline shows (a)–(d) on the same dates. |
| `timezone.spec.ts` `@tz` | **Off-by-one and timezone checks**, run in UTC+14 and UTC-11. Create a single-day plan on 2031-01-01: it renders on Jan 1 only, the edit form shows `2031-01-01` in both fields, and the API JSON has exactly `"2031-01-01"`. A Jan 31 to Feb 1 plan renders correctly in both months. With `page.clock` fixed at **local** 2026-10-09 00:30, "Today" highlights 2026-10-09 (not the 8th or 10th). |
| `navigation.spec.ts` | Prev, next and Today. The view switch keeps the month. The URL reflects state. Browser back closes the day and plan sheets. Esc closes sheets and focus returns to the trigger. An invalid `/calendar/2031-13` or unknown path shows NotFound. An unknown `/api/x` returns JSON 404. |
| `filter.spec.ts` | Choosing a subset of people limits the bars, timeline rows and day detail. The filter persists after reload. "All" resets it. The day detail shows "hidden by filter". |
| `theme.spec.ts` | Toggling light and dark sets `data-theme` and persists. System mode follows `colorScheme` emulation. |
| `layout-a11y.spec.ts` | On every route, at all 3 widths: no horizontal page scroll. The timeline scrolls only inside `timeline-scroll`. axe has zero serious or critical issues. Keyboard: Tab to a day cell, Enter opens it, focus is visible. Zero console errors on load. |

**Manual browser pass (QA, Playwright MCP):** every flow at 375, 768 and 1440px, as described in QA's role.

### 7.3 README requirements (`friends-planner/README.md`, MUST)

1. **What it is:** one paragraph, plus a feature list.
2. **Prerequisites:** Node 24 (`.nvmrc`). Netlify CLI optional globally (`npm i -g netlify-cli`); the scripts use `npx netlify-cli@27`.
3. **Run locally:**
   - `npm install`, then copy `.env.example` to `.env` and edit the values.
   - `npm run dev` serves on http://localhost:8888. Always use 8888, **not** Vite's 5173, because the API and Blobs only work through netlify dev.
   - `npm run seed` loads demo data (localhost only; demo PIN `1234`).
4. **Scripts:** a table of every script in §5.10.
5. **Testing:** `npm run test:e2e:install` once, then `npm run test:unit`, `npm run test:unit:tz` and `npm run test:e2e`. Explain the e2e data conventions (`e2e-` people, far-future months).
6. **Deploy to Netlify** (instructions only; the team does not deploy):
   - **(a) Connect the repo** in the Netlify UI.
     - Set **Base directory `friends-planner`**. Build command and publish directory come from `netlify.toml`.
     - Choose the production branch (see Q11).
   - **(b) CLI:** from `friends-planner/`, run `netlify login`, then `netlify init` (or `netlify link`), `netlify deploy --build` for a draft, and `netlify deploy --build --prod`.
7. **Environment variables to set in the Netlify dashboard** (Site configuration > Environment variables, scope at least "Functions"):
   - `GROUP_PASSCODE`, `ADMIN_PASSCODE` and `SESSION_SECRET`, each with its rules and how to generate the secret.
   - **Redeploy after changing them.**
8. **How the passcodes and PINs work:**
   - The group passcode opens the site for 180 days per device.
   - A personal PIN is set when a person is created. It is needed once per device to act as that person, and is remembered for 90 days.
   - **Admin:** go to `/admin` and enter `ADMIN_PASSCODE`. The session lasts 12 hours.
     - Edit or delete any plan.
     - Reset a forgotten PIN; this also unlocks a locked person and signs out their devices.
     - Delete a person and their plans.
   - **Rotating** `GROUP_PASSCODE` or `ADMIN_PASSCODE` logs everyone out of that scope.
   - Lockout rules in plain words.
9. **Data:**
   - Stored in Netlify Blobs store `friends-planner` (production). Deploy previews and branch deploys use separate stores.
   - **Backup:** `netlify blobs:get friends-planner events` / `people` (the `people` document contains PIN hashes: keep it private), or the admin export if implemented.
   - Dates are stored as `YYYY-MM-DD`, with the end date inclusive.
10. **Security notes:** what is hashed, where secrets live, nothing committed, and the accepted residual risks.
11. **Troubleshooting:**
    - Port 8888 or 5173 already in use.
    - Running on 5173 by mistake (the API gives 404).
    - `MISCONFIGURED` errors (missing env vars).
    - Resetting local data: `npm run seed -- --empty`, or delete `.netlify/` while the server is stopped.

### 7.4 Review-loop operating notes (for the director, QA, auditor and critic)

**Dev server for the review loop:**
- From `friends-planner/`, run `npm run dev` in the background.
- URL: **http://localhost:8888**. Readiness check: `GET /api/health`.
- Then run `npm run seed` so the critic and QA see a populated calendar.

**Local credentials** (placeholders from `.env.example`, local only):

| Credential | Value |
|---|---|
| Group passcode | `change-me-group` |
| Admin passcode | `change-me-admin-passcode` |
| Seeded people PIN | `1234` |

**Pages for Lighthouse and the critic:**
- `/` (gate, unauthenticated)
- `/calendar/{current YYYY-MM}`
- `/timeline/{current YYYY-MM}`
- `/day/{today}`
- `/people`
- `/admin`

The critic should also capture an open plan detail and the plan form, at 375 and 1440px in light and dark.

**Authenticated Lighthouse runs:**
1. Get a cookie:
   ```
   curl -s -i -H "Content-Type: application/json" -d "{\"passcode\":\"change-me-group\"}" http://localhost:8888/api/session
   ```
   and copy the `fp_session=...` value.
2. Run Lighthouse with:
   ```
   --extra-headers "{\"Cookie\":\"fp_session=<value>\"}"
   ```

**Performance scoring:**
- Prefer `npm run serve:prod` (production build plus functions).
- If port 8888 is busy, stop the dev server first or pass a different port to `netlify serve` (check `npx netlify-cli@27 serve --help`).
- State which server was used.

### 7.5 Out of scope

- Email notifications, real user accounts, chat or comments, recurring events, time-of-day scheduling (all from SPEC.md).
- Production deployment.
- Offline mode and service worker.
- Push notifications.
- Localization or multiple languages.
- Image or video assets.
- Importing from or syncing with external calendars (iCal).

---

## 8. Assumptions and open questions

Decisions already taken in this brief are marked **(default)**. The builder proceeds with the default unless the user says otherwise.

**User decisions (confirmed 2026-10-08; these override the table below):**
- Brief confirmed as written.
- Q1: **English** UI (en-GB dates, weeks start Monday). No Czech.
- Q2: **Yes**, adding a plan for a person requires that person's PIN (once per device) or admin.
- Q8: **Keep the default** region (`us-east-2`). No EU residency.
- Q11: **`master` is the production branch** (the current branch). README deploy steps must say to set `master` as the production branch in Netlify. No Netlify site name chosen yet.
- All other questions (Q3–Q7, Q9, Q10, Q12–Q15): proceed with the defaults.

| # | Topic | Assumption / default | Question for the user |
|---|---|---|---|
| Q1 | Language and locale | English UI, en-GB date format ("Mon 12 Oct"), **weeks start Monday** (default) | Should the UI be Czech instead, or as well? |
| Q2 | Adding plans for others | Creating a plan for a person requires being that person (PIN once per device) or admin (default). This prevents impersonation; SPEC.md only explicitly requires the PIN for edit and delete | OK, or should anyone be able to add plans under any name without a PIN? |
| Q3 | Remembered identity | "Remember me on this device" is on by default (90 days). A device acts as **one** person at a time; switching needs the other person's PIN (default) | Do couples or flatmates share a phone often enough to need multi-person devices? |
| Q4 | Place field | **Required** (SPEC.md marks only notes as optional) | Should Place be optional (for example for "exams" or "busy" plans)? |
| Q5 | Limits | Plans at most 366 days long, years 2000–2100, at most 50 people, at most 5,000 plans, notes at most 1,000 characters (default) | Any longer plans needed (for example a semester abroad longer than a year)? |
| Q6 | Visibility | Everyone with the group passcode sees every plan, including places and notes (default) | Should notes be private to the owner? |
| Q7 | Colors | 12 palette colors, unique until exhausted, then duplicates allowed, with names always shown (default) | Will the group exceed 12 people soon? |
| Q8 | Data location | Blobs site-wide store in Netlify's default region (`us-east-2`), matching the default functions region (default) | Is EU data residency (Frankfurt, `eu-central-1`) required? It adds latency unless the functions region is also moved, and it cannot be changed later without migrating data. |
| Q9 | Search indexing | **No `noindex`.** Lighthouse SEO must be at least 95 (the auditor gate) and `noindex` fails that audit. Nothing private is indexable anyway, since crawlers only ever see the passcode gate (default) | Do you prefer `noindex` (and accept an SEO score below 95)? |
| Q10 | Session lengths and lockouts | Group 180 days, person 90 days, admin 12 hours. PIN lock after 5 failures, passcode locks after 10 (group) or 5 (admin) per IP, doubling up to 24 h (default) | OK? |
| Q11 | Netlify account and branch | No Netlify site exists yet; local dev works unlinked. The repo is currently on `master` and the main branch is `main` | Which branch should be production? Do you already have a Netlify team or site name in mind? |
| Q12 | Past plans | Kept forever and browsable by month (default) | Should plans older than N months be hidden or archived? |
| Q13 | Group passcode strength | At least 8 characters is enforced in production (default) | OK to enforce, given friends type it once per device? |
| Q14 | Node version on Netlify | Node 24 for builds and functions, matching local v24.11.1 (default) | N/A (informational) |
| Q15 | Audience device mix | About 80% phone use (assumption, not data) | Any desktop-heavy users we should optimize for? |

**Known risks to watch in round 1:**
- (a) Confirm that `/api/*` is served by the function and not rewritten by the SPA rule under `netlify dev`.
- (b) Confirm that conditional Blobs writes work in the local sandbox.
- (c) Confirm that the `TZ` matrix takes effect on Windows (the sanity test).
- (d) The first `npx netlify-cli@27` run downloads a large package (slow first start).
- (e) The 375px month grid is the hardest visual problem (bar legibility at about 50px columns). The designer should prototype the lane and label sizes first.
