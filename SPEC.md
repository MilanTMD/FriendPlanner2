# SPEC: Friends Plans Calendar (new build, not an existing site)

This folder contains no existing site. Treat this as a new build: the architect writes BRIEF.md from this spec instead of analyzing a current site. Everything below is a requirement unless marked "suggested".

## Purpose

A small private web app for a group of about 10 friends. Each person adds their plans (trips, vacations, going home, etc.). Everyone can see at a glance who is away when and where plans overlap. It must be fast and easy to add a plan from a phone in under 20 seconds.

## Data per event

- Person name (the event owner)
- Event name (e.g. "Ski trip")
- Place (free text)
- Date range: start date and end date, inclusive, date-only (no times)
- Notes (optional, free text)

Store dates as `YYYY-MM-DD` strings and treat them as calendar dates, never as timestamps. Off-by-one and timezone shifts are a known bug class here; QA must test this explicitly, including events crossing month boundaries and single-day events.

## Views

1. **Calendar view (primary):** a month grid where multi-day events render as continuous colored bars spanning their days. Each person has a consistent color. Overlapping events stack cleanly and stay readable. Include previous/next month navigation and a "today" button.
2. **Timeline view (suggested, strongly preferred):** people as rows, days as columns, bars for each event. This is the clearest way to see overlaps across the whole group.
3. **Day detail:** tapping a day shows who is away that day and where.
4. **Filter by person** (suggested).

The calendar must work well on a phone (most usage will be mobile). Avoid horizontal page scroll. A horizontally scrollable timeline inside its own container is fine.

## Editing and ownership: fully self-serve

- Anyone in the group can add events directly on the site.
- **Each person can edit and delete only their own events.**
- No email accounts or signup. Use a lightweight scheme suited to a friend group:
  - **Group passcode** (env var `GROUP_PASSCODE`) required to view the site at all. Store it in a session after entry.
  - **Personal PIN:** the first time someone creates a person profile (name + color), they set a 4–6 digit PIN. Editing or deleting that person's events requires their PIN. Hash PINs server-side (e.g. Node `crypto.scrypt` with salt). Never store or return them in plain text.
  - **Admin passcode** (env var `ADMIN_PASSCODE`) can edit or delete any event and reset a person's PIN, for when someone forgets theirs.
  - Basic protection against PIN brute-forcing (e.g. throttle after repeated failures).
- All permission checks happen server-side, not just in the UI.

## Tech stack (required)

- Hosted on **Netlify**.
- Frontend: Vite + React + TypeScript (or lighter, if the architect justifies it).
- Backend: **Netlify Functions** (TypeScript) as a small JSON API.
- Storage: **Netlify Blobs**. No external database.
- A calendar library such as FullCalendar (day grid) is acceptable if it handles spanning multi-day bars well on mobile. Otherwise build the grid by hand. The architect decides and records why in BRIEF.md.
- Secrets only via environment variables. Provide `.env.example`. Nothing secret committed.

## Local development and testing

- Use the Netlify CLI (`netlify dev`) so functions and Blobs work locally. QA and the critic should run against that local server.
- QA must cover at least: entering the group passcode; creating a person with a PIN; adding, editing, and deleting an event; being blocked from editing someone else's event with a wrong PIN; admin override; overlapping events rendering correctly; month-boundary and single-day events; mobile width (~375px) and desktop.

## Design direction

Friendly, clean, and calm. This is a tool for friends, not a corporate dashboard. Readability of overlapping bars and person colors is the top visual priority. Colors must stay distinguishable for 10+ people and pass contrast checks. Dark mode is suggested.
**No image or video assets are needed.** The designer should keep ASSETS.md empty or minimal so there is no manual asset-generation step.

## Out of scope

Email notifications, real user accounts, chat or comments, recurring events, time-of-day scheduling.

## Final deliverable

- Working app passing the review loop.
- README with: how to run locally, how to deploy to Netlify (connect repo or `netlify deploy`), which env vars to set in the Netlify dashboard, and how the admin passcode works.
- Do not deploy to production yourselves. Stop at "ready to deploy" and report.
