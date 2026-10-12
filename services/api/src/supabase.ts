import { createClient } from '@supabase/supabase-js';

import type { AppConfig } from './config';
import type { TokenVerifier } from './middleware/auth';

/** Verifiziert Zugriffstokens über Supabase Auth (serverseitig, ohne Service-Role-Key). */
export function supabaseTokenVerifier(config: AppConfig): TokenVerifier {
  const client = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return async (accessToken) => {
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  };
}
