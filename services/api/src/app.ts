import { DEFAULT_PLANS, REVIEW_ADDON } from '@quellenklar/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';

import type { Logger } from './logger';
import { requireAuth, type AuthVariables, type TokenVerifier } from './middleware/auth';

export interface AppDeps {
  verifyToken: TokenVerifier;
  logger: Logger;
  corsOrigins?: string[];
  version?: string;
}

/** Einheitliches Fehlerformat: verständliche deutsche Meldung plus maschinenlesbarer Code. */
export interface ApiError {
  error: { code: string; message: string };
}

export function createApp(deps: AppDeps) {
  const app = new Hono<{ Variables: AuthVariables }>();

  app.use('*', secureHeaders());
  if (deps.corsOrigins && deps.corsOrigins.length > 0) {
    app.use(
      '*',
      cors({ origin: deps.corsOrigins, allowHeaders: ['Authorization', 'Content-Type'] }),
    );
  }

  app.use('*', async (c, next) => {
    const started = Date.now();
    await next();
    // Nur Metadaten – niemals Request- oder Response-Inhalte.
    deps.logger.log('info', 'request', {
      method: c.req.method,
      path: c.req.routePath,
      status: c.res.status,
      ms: Date.now() - started,
    });
  });

  app.get('/health', (c) => c.json({ status: 'ok', version: deps.version ?? '0.1.0' }));

  /** Öffentliche Tarifübersicht. In Phase 5 aus der Tabelle `plan_config` statt Standardwerten. */
  app.get('/v1/plans', (c) => c.json({ plans: Object.values(DEFAULT_PLANS), addon: REVIEW_ADDON }));

  const authed = new Hono<{ Variables: AuthVariables }>();
  authed.use('*', requireAuth(deps.verifyToken));
  authed.get('/me', (c) => {
    const user = c.get('user');
    return c.json({ id: user.id, email: user.email });
  });
  app.route('/v1', authed);

  app.notFound((c) =>
    c.json<ApiError>(
      { error: { code: 'not_found', message: 'Diese Adresse gibt es nicht.' } },
      404,
    ),
  );

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json<ApiError>(
        {
          error: { code: err.status === 401 ? 'unauthorized' : 'http_error', message: err.message },
        },
        err.status,
      );
    }
    deps.logger.log('error', 'unhandled_error', { name: err.name, message: err.message });
    return c.json<ApiError>(
      {
        error: {
          code: 'internal_error',
          message:
            'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es in einem Moment erneut.',
        },
      },
      500,
    );
  });

  return app;
}
