import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { redact, silentLogger } from '../src/logger';

const app = createApp({
  logger: silentLogger,
  verifyToken: async (token) =>
    token === 'gueltig' ? { id: 'user-1', email: 'test@example.org' } : null,
});

describe('API', () => {
  it('meldet den Zustand', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });

  it('liefert die Tarife ohne „unbegrenzt“ bei KI-Prüfungen', async () => {
    const res = await app.request('/v1/plans');
    const body = (await res.json()) as { plans: Array<{ limits: { monthlyFullReviews: number } }> };
    expect(body.plans).toHaveLength(3);
    for (const plan of body.plans) expect(typeof plan.limits.monthlyFullReviews).toBe('number');
  });

  it('verlangt eine Anmeldung', async () => {
    const res = await app.request('/v1/me');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: { code: 'unauthorized', message: 'Bitte melde dich an, um fortzufahren.' },
    });
  });

  it('lehnt ungültige Tokens ab', async () => {
    const res = await app.request('/v1/me', { headers: { Authorization: 'Bearer falsch' } });
    expect(res.status).toBe(401);
  });

  it('gibt den angemeldeten Nutzer zurück', async () => {
    const res = await app.request('/v1/me', { headers: { Authorization: 'Bearer gueltig' } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'user-1', email: 'test@example.org' });
  });

  it('antwortet auf unbekannte Pfade auf Deutsch', async () => {
    const res = await app.request('/gibt-es-nicht');
    expect(res.status).toBe(404);
  });

  it('setzt Sicherheits-Header', async () => {
    const res = await app.request('/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('Konfiguration', () => {
  it('meldet fehlende Pflichtwerte verständlich', () => {
    expect(() => loadConfig({})).toThrow(/Ungültige Server-Konfiguration/);
  });

  it('übernimmt gültige Werte', () => {
    const config = loadConfig({
      SUPABASE_URL: 'https://beispiel.supabase.co',
      SUPABASE_ANON_KEY: 'anon',
      CORS_ORIGINS: 'http://localhost:8081, https://app.example.org',
    });
    expect(config.PORT).toBe(8787);
    expect(config.CORS_ORIGINS).toEqual(['http://localhost:8081', 'https://app.example.org']);
  });
});

describe('Log-Schutz', () => {
  it('entfernt Inhalte und Geheimnisse aus Logdaten', () => {
    expect(
      redact({
        path: '/v1/review',
        authorization: 'Bearer x',
        content: 'Vertraulich',
        nested: { apiKey: 'k' },
      }),
    ).toEqual({
      path: '/v1/review',
      authorization: '[entfernt]',
      content: '[entfernt]',
      nested: { apiKey: '[entfernt]' },
    });
  });

  it('kürzt lange Zeichenketten', () => {
    expect(String(redact('x'.repeat(500)))).toContain('[gekürzt]');
  });
});
