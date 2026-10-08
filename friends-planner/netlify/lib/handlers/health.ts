import { json } from '../http';

export function health(): Response {
  return json({ ok: true });
}
