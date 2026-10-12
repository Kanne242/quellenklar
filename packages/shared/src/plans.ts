/**
 * Tarife und Kontingente.
 *
 * Diese Werte sind nur die Standardkonfiguration. Maßgeblich ist die serverseitige
 * Tabelle `plan_config` (siehe Migration), damit Preise und Limits ohne App-Update
 * änderbar sind. Preise inkl. USt.; im Store wird der lokalisierte Preis angezeigt.
 *
 * Wichtig: Kein KI-Kontingent wird als „unbegrenzt“ bezeichnet.
 */

export type PlanId = 'free' | 'pro' | 'business';

export interface PlanLimits {
  /** `null` = keine feste Obergrenze (faire technische Nutzung). Gilt nicht für KI. */
  maxActiveProjects: number | null;
  /** `null` = keine feste Obergrenze (faire technische Nutzung). */
  monthlyDocxExports: number | null;
  /** Immer eine konkrete Zahl. */
  monthlyFullReviews: number;
  maxAttachmentBytes: number;
  sourceAndAttachmentManagement: boolean;
  customBranding: boolean;
  extendedTemplates: boolean;
  priorityProcessing: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyEur: number;
  priceYearlyEur: number | null;
  limits: PlanLimits;
}

const MB = 1024 * 1024;

export const DEFAULT_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Kostenlos',
    priceMonthlyEur: 0,
    priceYearlyEur: null,
    limits: {
      maxActiveProjects: 1,
      monthlyDocxExports: 2,
      monthlyFullReviews: 1,
      maxAttachmentBytes: 10 * MB,
      sourceAndAttachmentManagement: true,
      customBranding: false,
      extendedTemplates: false,
      priorityProcessing: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyEur: 7.99,
    priceYearlyEur: 69.99,
    limits: {
      maxActiveProjects: null,
      monthlyDocxExports: null,
      monthlyFullReviews: 20,
      maxAttachmentBytes: 25 * MB,
      sourceAndAttachmentManagement: true,
      customBranding: false,
      extendedTemplates: false,
      priorityProcessing: false,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthlyEur: 14.99,
    priceYearlyEur: 139.99,
    limits: {
      maxActiveProjects: null,
      monthlyDocxExports: null,
      monthlyFullReviews: 60,
      maxAttachmentBytes: 100 * MB,
      sourceAndAttachmentManagement: true,
      customBranding: true,
      extendedTemplates: true,
      priorityProcessing: true,
    },
  },
};

export const REVIEW_ADDON = {
  id: 'reviews_10',
  name: 'Zusatzpaket',
  reviews: 10,
  priceEur: 4.99,
} as const;

/**
 * Obergrenze für „faire technische Nutzung“ – schützt vor Missbrauch, wird Nutzern nicht als
 * Kontingent angezeigt. Serverseitig konfigurierbar.
 */
export const FAIR_USE = {
  maxActiveProjects: 500,
  monthlyDocxExports: 1000,
} as const;

export type QuotaKind = 'active_projects' | 'docx_exports' | 'full_reviews';

export interface QuotaState {
  plan: PlanId;
  activeProjects: number;
  docxExportsThisPeriod: number;
  fullReviewsThisPeriod: number;
  /** Gekaufte, noch nicht verbrauchte Zusatzprüfungen (verfallen nicht mit dem Monat). */
  addonReviewsRemaining: number;
}

export type QuotaDecision =
  | { allowed: true; usesAddon?: boolean; remaining: number | null }
  | { allowed: false; reason: string };

export function checkQuota(
  kind: QuotaKind,
  state: QuotaState,
  plans: Record<PlanId, PlanDefinition> = DEFAULT_PLANS,
): QuotaDecision {
  const limits = plans[state.plan].limits;

  switch (kind) {
    case 'active_projects': {
      const limit = limits.maxActiveProjects ?? FAIR_USE.maxActiveProjects;
      if (state.activeProjects >= limit) {
        return {
          allowed: false,
          reason:
            limits.maxActiveProjects === null
              ? 'Die Obergrenze für faire Nutzung ist erreicht. Bitte archiviere ältere Projekte.'
              : `Im Tarif „${plans[state.plan].name}“ ist ${limit} aktives Projekt enthalten. Archiviere ein Projekt oder wechsle den Tarif.`,
        };
      }
      return {
        allowed: true,
        remaining:
          limits.maxActiveProjects === null
            ? null
            : limits.maxActiveProjects - state.activeProjects - 1,
      };
    }
    case 'docx_exports': {
      const limit = limits.monthlyDocxExports ?? FAIR_USE.monthlyDocxExports;
      if (state.docxExportsThisPeriod >= limit) {
        return {
          allowed: false,
          reason:
            limits.monthlyDocxExports === null
              ? 'Die Obergrenze für faire Nutzung ist für diesen Monat erreicht.'
              : `Dein Kontingent von ${limit} DOCX-Exporten ist für diesen Monat aufgebraucht.`,
        };
      }
      return {
        allowed: true,
        remaining:
          limits.monthlyDocxExports === null
            ? null
            : limits.monthlyDocxExports - state.docxExportsThisPeriod - 1,
      };
    }
    case 'full_reviews': {
      const monthlyLeft = limits.monthlyFullReviews - state.fullReviewsThisPeriod;
      if (monthlyLeft > 0) {
        return { allowed: true, remaining: monthlyLeft - 1 + state.addonReviewsRemaining };
      }
      if (state.addonReviewsRemaining > 0) {
        return { allowed: true, usesAddon: true, remaining: state.addonReviewsRemaining - 1 };
      }
      return {
        allowed: false,
        reason:
          'Dein KI-Prüfkontingent ist für diesen Monat aufgebraucht. Du kannst ein Zusatzpaket kaufen oder bis zum Rücksetzdatum warten.',
      };
    }
  }
}

/** Erster Tag des nächsten Abrechnungsmonats (UTC), an dem Monatskontingente zurückgesetzt werden. */
export function nextQuotaReset(periodStart: Date): Date {
  return new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1));
}
