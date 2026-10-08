/** Environment validation. Logs only variable NAMES, never values. */
import { ApiError } from './http';

export interface AppConfig {
  groupPasscode: string;
  adminPasscode: string;
  sessionSecret: string;
  deployContext: string;
}

export const PLACEHOLDERS: readonly string[] = [
  'change-me-group',
  'change-me-admin-passcode',
  'replace-with-at-least-32-random-characters',
];

export function deployContextOf(env: Record<string, string | undefined>): string {
  return env.CONTEXT || 'dev';
}

/** Returns the names of invalid variables (empty when the config is valid). */
export function invalidVariables(env: Record<string, string | undefined>): string[] {
  const bad: string[] = [];
  const group = env.GROUP_PASSCODE ?? '';
  const admin = env.ADMIN_PASSCODE ?? '';
  const secret = env.SESSION_SECRET ?? '';
  const production = deployContextOf(env) === 'production';

  if (!group) bad.push('GROUP_PASSCODE');
  if (!admin) bad.push('ADMIN_PASSCODE');
  if (secret.length < 32) bad.push('SESSION_SECRET');
  if (group && admin && group === admin) bad.push('ADMIN_PASSCODE');

  if (production) {
    if (group && group.length < 8) bad.push('GROUP_PASSCODE');
    if (admin && admin.length < 12) bad.push('ADMIN_PASSCODE');
    if (group && PLACEHOLDERS.includes(group)) bad.push('GROUP_PASSCODE');
    if (admin && PLACEHOLDERS.includes(admin)) bad.push('ADMIN_PASSCODE');
    if (secret && PLACEHOLDERS.includes(secret)) bad.push('SESSION_SECRET');
  }
  return [...new Set(bad)];
}

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const bad = invalidVariables(env);
  if (bad.length > 0) {
    console.error(`[config] invalid or missing environment variables: ${bad.join(', ')}`);
    throw new ApiError(500, 'MISCONFIGURED', 'The server is not configured correctly.');
  }
  return {
    groupPasscode: env.GROUP_PASSCODE as string,
    adminPasscode: env.ADMIN_PASSCODE as string,
    sessionSecret: env.SESSION_SECRET as string,
    deployContext: deployContextOf(env),
  };
}
