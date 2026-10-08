import type { Config, Context } from '@netlify/functions';
import { createBlobsStore } from '../lib/store';
import { handleApiRequest } from '../lib/router';

export default async (req: Request, context: Context): Promise<Response> => {
  const deployContext = context.deploy?.context || process.env.CONTEXT || 'dev';
  return handleApiRequest(req, {
    store: createBlobsStore(deployContext),
    env: { ...process.env, CONTEXT: deployContext },
    ip: context.ip,
    now: () => Date.now(),
  });
};

export const config: Config = { path: '/api/*' };
