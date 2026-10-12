import { serve } from '@hono/node-server';

import { createApp } from './app';
import { loadConfig } from './config';
import { consoleLogger } from './logger';
import { supabaseTokenVerifier } from './supabase';

const config = loadConfig();
const app = createApp({
  verifyToken: supabaseTokenVerifier(config),
  logger: consoleLogger,
  corsOrigins: config.CORS_ORIGINS,
});

serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  consoleLogger.log('info', 'api_started', { port: info.port, env: config.NODE_ENV });
});
