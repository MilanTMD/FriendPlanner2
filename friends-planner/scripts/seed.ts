/**
 * Loads fictional demo data through the PUBLIC API, so it cannot corrupt the storage format.
 *
 *   npm run seed            replace everything with 10 demo friends and about 25 plans
 *   npm run seed -- --empty delete everything and create nothing
 *
 * LOCAL ONLY: refuses any host other than localhost / 127.0.0.1. The demo PIN for everybody is 1234.
 */
import { existsSync } from 'node:fs';
import { addDays, lastOfMonth, todayLocal, toMonthKey, weekdayIndexMon0 } from '../shared/dates';
import type { ISODate, Person, PersonColorId } from '../shared/types';

if (existsSync('.env')) process.loadEnvFile('.env');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8888';
const DEMO_PIN = '1234';
const emptyOnly = process.argv.includes('--empty');

const host = new URL(BASE_URL).hostname;
if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error(`Refusing to seed "${host}". The seed script only runs against localhost or 127.0.0.1.`);
  process.exit(1);
}

const groupPasscode = process.env.GROUP_PASSCODE;
const adminPasscode = process.env.ADMIN_PASSCODE;
if (!groupPasscode || !adminPasscode) {
  console.error('GROUP_PASSCODE and ADMIN_PASSCODE must be set (copy .env.example to .env).');
  process.exit(1);
}

const cookies = new Map<string, string>();

async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const cookieHeader = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ');
  const response = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  for (const line of response.headers.getSetCookie()) {
    const [pair] = line.split(';');
    const idx = pair?.indexOf('=') ?? -1;
    if (pair && idx > 0) cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message = (data as { error?: { message?: string } } | null)?.error?.message ?? response.statusText;
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }
  return data as T;
}

const FRIENDS: { name: string; colorId: PersonColorId }[] = [
  { name: 'Klára', colorId: 'c1' },
  { name: 'Tomáš', colorId: 'c2' },
  { name: 'Jiří', colorId: 'c3' },
  { name: 'Anna', colorId: 'c4' },
  { name: 'Martin', colorId: 'c5' },
  { name: 'Eva', colorId: 'c6' },
  { name: 'Ondřej', colorId: 'c7' },
  { name: 'Petra', colorId: 'c8' },
  { name: 'Lukáš', colorId: 'c9' },
  { name: 'Kateřina', colorId: 'c10' },
];

interface PlanSeed {
  who: string;
  title: string;
  place: string;
  start: ISODate;
  end: ISODate;
  notes?: string;
}

function buildPlans(): PlanSeed[] {
  const today = todayLocal();
  const month = toMonthKey(today);
  const first = `${month}-01`;
  const last = lastOfMonth(month);
  const dayOf = (n: number): ISODate => {
    const wanted = addDays(first, n - 1);
    return wanted > last ? last : wanted;
  };

  // The first Saturday from the 8th onwards, so there is always a full weekend inside the month.
  let saturday = dayOf(8);
  while (weekdayIndexMon0(saturday) !== 5) saturday = addDays(saturday, 1);
  const sunday = addDays(saturday, 1);
  const friday = addDays(saturday, -1);
  const monday = addDays(saturday, 2);

  // A Wednesday in the middle of the month for the week-boundary plan.
  let wednesday = dayOf(15);
  while (weekdayIndexMon0(wednesday) !== 2) wednesday = addDays(wednesday, 1);

  const longNotes = [
    'Train leaves at 7:42 from the main station, platform 3.',
    'Remember to bring: ski pass, helmet, thermal socks, charger and the big blue backpack.',
    'We booked the chalet from Friday evening. Dinner is at 19:00 on Saturday, vegetarian option for Anna.',
    'Return trip is flexible, so if anyone wants to stay an extra day, tell Klára before Thursday.',
  ].join('\n');

  return [
    // A busy weekend: at least four people away at once.
    { who: 'Klára', title: 'Ski weekend', place: 'Harrachov', start: friday, end: monday, notes: longNotes },
    { who: 'Tomáš', title: 'Cabin trip', place: 'Beskydy', start: saturday, end: sunday },
    { who: 'Anna', title: 'Wedding', place: 'Brno', start: saturday, end: sunday, notes: 'Dress code: smart casual.' },
    { who: 'Martin', title: 'Concert', place: 'Vienna', start: friday, end: saturday },
    { who: 'Eva', title: 'Visiting family', place: 'Ostrava', start: saturday, end: addDays(sunday, 1) },

    // Crosses the end of the month into the next one.
    { who: 'Jiří', title: 'Road trip', place: 'Slovenia', start: addDays(last, -2), end: addDays(last, 3) },

    // Crosses a week boundary (Wednesday to the next Tuesday).
    { who: 'Petra', title: 'Home for a week', place: 'Plzeň', start: wednesday, end: addDays(wednesday, 6) },

    // A two-week trip.
    { who: 'Ondřej', title: 'Interrail', place: 'Italy and Croatia', start: dayOf(2), end: dayOf(15), notes: 'Phone roaming is expensive, message on WhatsApp.' },

    // Single-day plans.
    { who: 'Lukáš', title: 'Dentist', place: 'Prague', start: dayOf(5), end: dayOf(5) },
    { who: 'Kateřina', title: 'Exam', place: 'Charles University', start: dayOf(12), end: dayOf(12) },
    { who: 'Tomáš', title: 'Gig', place: 'Lucerna', start: dayOf(19), end: dayOf(19) },
    { who: 'Anna', title: 'Birthday dinner', place: 'Home', start: dayOf(22), end: dayOf(22) },

    // One person with two back-to-back plans.
    { who: 'Eva', title: 'Work conference', place: 'Berlin', start: dayOf(24), end: dayOf(26) },
    { who: 'Eva', title: 'City break', place: 'Berlin', start: dayOf(27), end: dayOf(29) },

    // More everyday variety.
    { who: 'Klára', title: 'Hiking', place: 'Krkonoše', start: dayOf(2), end: dayOf(4) },
    { who: 'Martin', title: 'Work trip', place: 'London', start: dayOf(9), end: dayOf(11) },
    { who: 'Jiří', title: 'Home', place: 'Olomouc', start: dayOf(16), end: dayOf(18) },
    { who: 'Petra', title: 'Festival', place: 'Hradec Králové', start: dayOf(4), end: dayOf(6) },
    { who: 'Lukáš', title: 'Climbing camp', place: 'Adršpach', start: dayOf(20), end: dayOf(23) },
    { who: 'Kateřina', title: 'Spa weekend', place: 'Karlovy Vary', start: dayOf(26), end: dayOf(28) },
    { who: 'Ondřej', title: 'Board games night', place: 'Prague', start: dayOf(21), end: dayOf(21) },
    { who: 'Martin', title: 'Cycling', place: 'Moravian wine trail', start: dayOf(30), end: addDays(last, 1) },
    { who: 'Tomáš', title: 'Business trip', place: 'Munich', start: dayOf(13), end: dayOf(14) },
    { who: 'Anna', title: 'Yoga retreat', place: 'Sumava', start: dayOf(10), end: dayOf(12) },
    { who: 'Petra', title: 'Moving day', place: 'Prague', start: dayOf(28), end: dayOf(28) },
  ];
}

async function main(): Promise<void> {
  console.log(`Seeding ${BASE_URL} ...`);
  await api('POST', '/session', { passcode: groupPasscode });
  await api('POST', '/admin/session', { passcode: adminPasscode });

  const existing = await api<{ people: Person[] }>('GET', '/people');
  for (const person of existing.people) await api('DELETE', `/people/${person.id}`);
  console.log(`Deleted ${existing.people.length} existing people (and their plans).`);

  if (emptyOnly) {
    console.log('Done: everything deleted, nothing created (--empty).');
    return;
  }

  const idByName = new Map<string, string>();
  for (const friend of FRIENDS) {
    const { person } = await api<{ person: Person }>('POST', '/people', {
      name: friend.name,
      colorId: friend.colorId,
      pin: DEMO_PIN,
      remember: false,
    });
    idByName.set(friend.name, person.id);
  }
  // Creating a person sets a person cookie; plans are created with the admin session instead.
  cookies.delete('fp_person');

  const plans = buildPlans();
  for (const plan of plans) {
    const personId = idByName.get(plan.who);
    if (!personId) throw new Error(`Unknown demo person ${plan.who}`);
    await api('POST', '/events', {
      personId,
      title: plan.title,
      place: plan.place,
      startDate: plan.start,
      endDate: plan.end,
      notes: plan.notes ?? '',
    });
  }

  await api('DELETE', '/admin/session');
  console.log(`Created ${FRIENDS.length} people and ${plans.length} plans. Everyone's demo PIN is ${DEMO_PIN} (local only).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
