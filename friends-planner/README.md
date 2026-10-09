# Friends Plans

A small private calendar for a group of friends (about 10 people). Everyone adds their own plans (trips, holidays, going home) and sees at a glance who is away when and where plans overlap. Adding a plan from a phone takes a few taps.

- **Calendar view:** a Monday-first month grid. Multi-day plans are continuous colored bars, split per week row, with arrowed edges where a plan continues into the next week or month. Overlaps stack in lanes and never touch. "+N" shows hidden plans on a day.
- **Timeline view:** people as rows, days as columns, plus an "Away" row that counts how many people are away each day.
- **Day detail:** tap a day to see who is away, where, and who is around.
- **Filter by person**, light / dark / system theme, mobile first (no service worker).
- **Self-serve and safe:** a group passcode opens the site, each person has a personal PIN for their own plans, and an admin passcode can fix anything. All permission checks happen on the server.
- **Stack:** Vite + React + TypeScript, one Netlify Function (`/api/*`), Netlify Blobs for storage. No external database.

Dates are `YYYY-MM-DD` strings everywhere (never timestamps), and the end date of a plan is inclusive.

## Prerequisites

- **Node.js 24** (see `.nvmrc`; `engines` allows `>=22.13`).
- The Netlify CLI is run on demand by the npm scripts (`npx netlify-cli@27`). Installing it globally is optional and starts faster: `npm i -g netlify-cli`.

## Run locally

```bash
npm install
cp .env.example .env     # on Windows PowerShell: Copy-Item .env.example .env
# edit .env if you like; the placeholder values work locally
npm run dev
```

Open **http://localhost:8888**. Always use 8888, not Vite's 5173: the API and the Blobs sandbox only work through `netlify dev`. The first start downloads the Netlify CLI, which can take a minute or two.

Load demo data (10 fictional friends, about 25 plans around the current month):

```bash
npm run seed            # replaces everything; demo PIN for every person is 1234
npm run seed -- --empty # deletes everything and creates nothing
```

The seed script uses only the public API and refuses any host other than `localhost` / `127.0.0.1`. Both modes (normal and `--empty`) **also clear all throttle/lock state first**: the group-passcode and admin-passcode counters (per IP) and every person's PIN counter, by deleting the `throttle` folders of the local Blobs sandboxes (`.netlify/blobs-serve` for `netlify dev`, `.netlify/preview-blobs` for the production preview). So a test run that exercises lockouts cannot lock out the next run: run `npm run seed` (or `npm run seed -- --empty`) between runs. To seed the production preview instead, add `--base-url http://localhost:8889`.

Local credentials (from `.env.example`, local only): group passcode `change-me-group`, admin passcode `change-me-admin-passcode`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | `netlify dev`: app, API and local Blobs at http://localhost:8888 |
| `npm run dev:vite` | Vite on 5173. Started by `netlify dev`; do not use it directly |
| `npm run build` | Type-check (app, server, tool configs), then `vite build` into `dist/` |
| `npm run typecheck` | `tsc` for `src/` + `shared/`, `netlify/` + `shared/` + `scripts/`, and the tool configs. Never includes `tests/` |
| `npm run typecheck:tests` | `tsc` for `tests/` and the code under test |
| `npm run lint` | ESLint (includes jsx-a11y and the calendar-date rules) |
| `npm test` | Unit tests, then end-to-end tests |
| `npm run test:unit` | Vitest (`tests/unit/**`) |
| `npm run test:unit:tz` | Vitest four times, with `TZ` set to Europe/Prague, America/Los_Angeles, Pacific/Kiritimati and Pacific/Pago_Pago |
| `npm run test:e2e` | Playwright against `netlify dev` (starts it if it is not already running) |
| `npm run test:e2e:install` | Installs the Chromium used by Playwright (once) |
| `npm run seed` | Demo data (localhost only) |
| `npm run serve:prod` | Builds, then serves the production build plus the API at http://localhost:8889, **next to** `netlify dev` (see "Production preview and Lighthouse"). Use `npm run serve:prod -- --port 9000` for another port |
| `npm run check` | lint, typecheck, typecheck:tests, test:unit:tz |

## Production preview and Lighthouse

`netlify dev` runs the Vite dev server (unminified, no compression), so its performance scores are not representative. **Run Lighthouse against the production build:**

```bash
npm run serve:prod        # builds, then serves http://localhost:8889 (leave netlify dev running on 8888)
npm run seed -- --base-url http://localhost:8889    # demo data for the preview (own data store)
```

`scripts/serve-prod.ts` serves `dist/` and the same API code as the Netlify Function on a separate port: it applies the SPA fallback (`/index.html`, status 200), the security headers from `netlify.toml`, immutable caching for the hashed `static-*` files, Brotli/gzip compression (as Netlify's CDN does), and the CSP `<meta>` tag from the build. Data lives in a local Blobs server in `.netlify/preview-blobs/` (real ETag and conditional-write semantics), separate from the dev server's data. Stop it with Ctrl+C.

Why not `netlify serve`? It shares `.netlify/functions-serve` with `netlify dev`, so running both at once breaks the dev server's API, and on Windows it cannot serve nested static files (403).

Authenticated Lighthouse run (calendar, timeline, day, people, admin pages):

```bash
curl -s -i -H "Content-Type: application/json" -d "{\"passcode\":\"change-me-group\"}" http://localhost:8889/api/session
# copy the fp_session=... value, then:
npx lighthouse http://localhost:8889/calendar/2026-10 --extra-headers "{\"Cookie\":\"fp_session=<value>\"}" --view
```

Use the mobile (default) and `--preset=desktop` runs, and state that the production preview on port 8889 was used.

## Testing

1. `npm run test:e2e:install` once.
2. `npm run test:unit`, `npm run test:unit:tz` and `npm run test:e2e`.

Conventions for end-to-end tests: every test person is named `e2e-<run id>-...` and purged before and after the run; plans go into far-future months (2031 and later) so they never collide with the seed data; never trigger the group or admin passcode lockouts (all local requests share one IP), and test PIN lockouts only on a throwaway `e2e-` person. Playwright runs five projects (375, 768 and 1440 px, plus `@tz` tests in UTC+14 and UTC-11).

## Deploy to Netlify

This project is **ready to deploy**; nothing has been deployed. The repo root is the workspace root and the app lives in `friends-planner/`.

### Option A: connect the repository (recommended)

1. In Netlify choose **Add new site > Import an existing project** and connect the Git repository.
2. Set **Base directory** to `friends-planner`. The build command (`npm run build`) and publish directory (`dist`) come from `netlify.toml`.
3. Set the **production branch to `master`** (Site configuration > Build & deploy > Branches and deploy contexts). Other branches and pull requests become branch deploys and deploy previews.
4. Set the environment variables below **before the first deploy**.

### Option B: Netlify CLI

From `friends-planner/`:

```bash
netlify login
netlify init                 # or: netlify link (to use an existing site)
netlify deploy --build       # draft deploy to check
netlify deploy --build --prod
```

### Environment variables

Set these in the Netlify dashboard: **Site configuration > Environment variables** (scope: at least **Functions**). **Redeploy after changing them.**

| Variable | Purpose | Rules |
|---|---|---|
| `GROUP_PASSCODE` | Shared passcode needed to see anything | At least 8 characters in production |
| `ADMIN_PASSCODE` | Admin override | At least 12 characters, different from `GROUP_PASSCODE` |
| `SESSION_SECRET` | Secret for signing cookies and hashing IPs | At least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

If a variable is missing or invalid, every API route except `/api/health` answers `500 MISCONFIGURED` (the log names the variable, never its value). In the `production` context the placeholder values from `.env.example` are refused.

## How passcodes and PINs work

- **Group passcode:** opens the site on a device for **180 days**. Nothing is visible without it.
- **Personal PIN (4-6 digits):** set when a person is created. It is asked **once per device** to act as that person (with "Remember me on this device" it is remembered for **90 days**, otherwise for 12 hours). A person can add, edit and delete only their own plans.
- **Admin:** go to `/admin` and enter `ADMIN_PASSCODE`. The admin session lasts **12 hours** and shows an "Admin mode" banner. Admin can:
  - edit or delete any plan without a PIN,
  - **reset a forgotten PIN** (this also unlocks a locked person and signs out their remembered devices),
  - delete a person and their plans,
  - download a JSON backup (`/api/admin/export`, never contains PINs).
- **Rotating** `GROUP_PASSCODE` or `ADMIN_PASSCODE` signs everybody out of that scope (the passcodes are part of the cookie signing keys).
- **Lockouts, in plain words:**
  - 5 wrong PINs for one person locks that person's PIN for 15 minutes.
  - 10 wrong group passcodes from one network address locks that address for 15 minutes; 5 wrong admin passcodes does the same for the admin form.
  - If someone keeps guessing after a lock ends, the next lock is twice as long (15 min, 30 min, 1 h, 2 h ... up to 24 h). A correct entry resets the counter, and so does an admin PIN reset.

## Data

- Stored in the Netlify Blobs store **`friends-planner`** (production). Deploy previews and branch deploys use their own stores (`friends-planner-<context>`), and local development uses `friends-planner-dev`, so test data can never touch production.
- Two documents: `people` (contains PIN hashes: keep it private) and `events`, written with ETag-conditional writes and retries so two people saving at the same moment do not overwrite each other. Rate-limit counters live under `throttle/...`.
- **Backup:** `netlify blobs:get friends-planner events` and `netlify blobs:get friends-planner people`, or use the admin "Download backup (JSON)" button.
- Dates are stored exactly as `YYYY-MM-DD`; the end date is inclusive; the server never converts them through a time zone.

## Security notes

- PINs are hashed with Node's `crypto.scrypt` (N=16384, r=8, p=1, 16-byte random salt) and are never stored, logged or returned. No API response contains PIN material.
- Cookies (`fp_session`, `fp_person`, `fp_admin`) are signed (HMAC-SHA256), `HttpOnly`, `SameSite` (Strict for admin) and `Secure` over HTTPS. Mutations require `Content-Type: application/json`, and requests with a foreign `Origin` are rejected.
- Secrets live only in environment variables. `.env` is git-ignored; only `.env.example` (placeholders) is committed.
- CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy` are set (`netlify.toml` and a build-time `<meta>` tag).
- **Accepted residual risk:** if the Blobs data ever leaked, a 4-6 digit PIN could be brute-forced offline. Blobs are only reachable through the site's own function, and PINs protect only calendar edits.
- The site is not marked `noindex` (that would fail the Lighthouse SEO audit); crawlers only ever see the passcode screen.

## Troubleshooting

- **Port 8888 or 5173 already in use:** stop the other process (or the previous `netlify dev`) and start again. Vite is started with `--strictPort`, so it will not silently move to another port.
- **API returns 404 / the app shows errors on 5173:** you opened Vite directly. Use http://localhost:8888.
- **`500 MISCONFIGURED`:** a variable in `.env` (locally) or in the Netlify dashboard (deployed) is missing or invalid. Check the server log for the variable name.
- **Reset local data:** `npm run seed -- --empty` (while the dev server runs), or stop the server and delete the `.netlify/` folder.
- **Local-development notes:**
  - `netlify dev` (CLI 27) re-sends every 403/404 response from a function to the function again with `.html` / `/index.html` appended, and returns the last attempt. `netlify/functions/api.ts` neutralises this in dev only (it replays the first response and does not run the handler twice); production Netlify does not behave this way.
  - The local Blobs sandbox returns ETags on writes and in `list()` results but not on reads, and its conditional write is not atomic. The store layer works around the first point; under a burst of simultaneous writes the sandbox can still lose an update, which production Blobs does not.
