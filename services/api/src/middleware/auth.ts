import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Prüft ein Supabase-Zugriffstoken und liefert den Nutzer – oder `null`, wenn ungültig. */
export type TokenVerifier = (accessToken: string) => Promise<AuthUser | null>;

export type AuthVariables = { user: AuthUser; accessToken: string };

export function requireAuth(verify: TokenVerifier) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const header = c.req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match?.[1]) {
      throw new HTTPException(401, { message: 'Bitte melde dich an, um fortzufahren.' });
    }
    const user = await verify(match[1]);
    if (!user) {
      throw new HTTPException(401, {
        message: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
      });
    }
    c.set('user', user);
    c.set('accessToken', match[1]);
    await next();
  });
}
