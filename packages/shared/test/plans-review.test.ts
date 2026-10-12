import { describe, expect, it } from 'vitest';

import { checkQuota, DEFAULT_PLANS, nextQuotaReset, type QuotaState } from '../src/plans';
import { parseReviewResult, type ReviewResult } from '../src/review';

const base: QuotaState = {
  plan: 'free',
  activeProjects: 0,
  docxExportsThisPeriod: 0,
  fullReviewsThisPeriod: 0,
  addonReviewsRemaining: 0,
};

describe('Tarif- und Kontingentgrenzen', () => {
  it('erlaubt im kostenlosen Tarif genau ein aktives Projekt', () => {
    expect(checkQuota('active_projects', base).allowed).toBe(true);
    expect(checkQuota('active_projects', { ...base, activeProjects: 1 }).allowed).toBe(false);
  });

  it('erlaubt im kostenlosen Tarif zwei Exporte pro Monat', () => {
    expect(checkQuota('docx_exports', { ...base, docxExportsThisPeriod: 1 })).toEqual({
      allowed: true,
      remaining: 0,
    });
    expect(checkQuota('docx_exports', { ...base, docxExportsThisPeriod: 2 }).allowed).toBe(false);
  });

  it('nutzt nach dem Monatskontingent das Zusatzpaket', () => {
    const state = {
      ...base,
      plan: 'pro' as const,
      fullReviewsThisPeriod: 20,
      addonReviewsRemaining: 10,
    };
    expect(checkQuota('full_reviews', state)).toEqual({
      allowed: true,
      usesAddon: true,
      remaining: 9,
    });
    expect(checkQuota('full_reviews', { ...state, addonReviewsRemaining: 0 }).allowed).toBe(false);
  });

  it('hat für jeden Tarif ein konkretes KI-Kontingent', () => {
    for (const plan of Object.values(DEFAULT_PLANS)) {
      expect(Number.isFinite(plan.limits.monthlyFullReviews)).toBe(true);
      expect(plan.limits.monthlyFullReviews).toBeGreaterThan(0);
    }
    expect(DEFAULT_PLANS.pro.limits.monthlyFullReviews).toBe(20);
    expect(DEFAULT_PLANS.business.limits.monthlyFullReviews).toBe(60);
  });

  it('greift auch bei Pro auf die Fair-Use-Grenze', () => {
    expect(
      checkQuota('docx_exports', { ...base, plan: 'pro', docxExportsThisPeriod: 1000 }).allowed,
    ).toBe(false);
  });

  it('berechnet das Rücksetzdatum inkl. Jahreswechsel', () => {
    expect(nextQuotaReset(new Date(Date.UTC(2026, 11, 15))).toISOString()).toBe(
      '2027-01-01T00:00:00.000Z',
    );
  });
});

const validResult: ReviewResult = {
  correctedSections: [{ sectionId: 's1', heading: 'Einleitung', body: 'Text.' }],
  correctedTableRows: [],
  summary: 'Zwei Sprachfehler korrigiert.',
  sourceMappings: [{ rowId: 'r1', sourceIds: ['Q01'], attachmentIds: [], status: 'ok' }],
  openChecks: [
    { target: { kind: 'table_row', id: 'r2' }, description: 'Datum fehlt', severity: 'warning' },
  ],
  changes: [
    {
      id: 'c1',
      category: 'language_fix',
      target: { kind: 'section', id: 's1', field: 'body' },
      original: 'Text .',
      proposed: 'Text.',
      reason: 'Leerzeichen vor Punkt',
      isContentChange: false,
    },
  ],
  qualityReport: {
    languagePassed: true,
    sourceIdsComplete: false,
    sourceReferencesConsistent: true,
    attachmentReferencesComplete: true,
    datesConsistent: true,
    readyForExport: false,
  },
};

describe('KI-Antwortschema', () => {
  it('akzeptiert eine gültige Antwort', () => {
    const outcome = parseReviewResult(JSON.stringify(validResult));
    expect(outcome.ok).toBe(true);
  });

  it('meldet ungültiges JSON', () => {
    const outcome = parseReviewResult('{"summary": ');
    expect(outcome).toMatchObject({ ok: false, error: 'invalid_json' });
  });

  it('lehnt fehlende Pflichtfelder ab', () => {
    const { qualityReport: _omit, ...rest } = validResult;
    expect(parseReviewResult(JSON.stringify(rest))).toMatchObject({
      ok: false,
      error: 'schema_mismatch',
    });
  });

  it('lehnt zusätzliche, unbekannte Felder ab', () => {
    const outcome = parseReviewResult(JSON.stringify({ ...validResult, inventedFacts: ['x'] }));
    expect(outcome).toMatchObject({ ok: false, error: 'schema_mismatch' });
  });

  it('lehnt erfundene ID-Formate ab', () => {
    const bad = {
      ...validResult,
      sourceMappings: [{ rowId: 'r1', sourceIds: ['Quelle 1'], attachmentIds: [], status: 'ok' }],
    };
    expect(parseReviewResult(JSON.stringify(bad)).ok).toBe(false);
  });
});
