/**
 * Seitenlayout laut Spezifikation (Abschnitt 9/10), umgerechnet in Word-Einheiten.
 * 1 cm = 566,929 Twips (1/20 pt); Word erwartet ganze Zahlen.
 */

export const TWIPS_PER_CM = 1440 / 2.54;

export function cmToTwips(cm: number): number {
  return Math.round(cm * TWIPS_PER_CM);
}

/** Halbpunkte (w:sz) für Schriftgrößen in pt. */
export function ptToHalfPoints(pt: number): number {
  return Math.round(pt * 2);
}

/** DIN A4 in Twips (210 × 297 mm). */
export const A4 = {
  widthTwips: cmToTwips(21),
  heightTwips: cmToTwips(29.7),
} as const;

export type Orientation = 'portrait' | 'landscape';

export interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const MARGINS_CM: Record<Orientation, Margins> = {
  portrait: { left: 2.5, right: 2.0, top: 2.0, bottom: 2.0 },
  landscape: { left: 1.5, right: 1.5, top: 1.8, bottom: 1.8 },
};

export function marginsTwips(orientation: Orientation): Margins {
  const m = MARGINS_CM[orientation];
  return {
    left: cmToTwips(m.left),
    right: cmToTwips(m.right),
    top: cmToTwips(m.top),
    bottom: cmToTwips(m.bottom),
  };
}

export function pageSizeTwips(orientation: Orientation): { width: number; height: number } {
  return orientation === 'portrait'
    ? { width: A4.widthTwips, height: A4.heightTwips }
    : { width: A4.heightTwips, height: A4.widthTwips };
}

/** Nutzbare Satzspiegelbreite – Grundlage für die Spaltenbreitenberechnung der Tabellen. */
export function usableWidthTwips(orientation: Orientation): number {
  const { width } = pageSizeTwips(orientation);
  const m = marginsTwips(orientation);
  return width - m.left - m.right;
}

export const TYPOGRAPHY = {
  fontFamily: 'Aptos',
  fallbackFontFamily: 'Arial',
  bodyPt: 11,
  heading1Pt: 16,
  heading2Pt: 13,
  tableMinPt: 9,
  sourcesPt: 9.5,
  bodyLineSpacing: 1.15,
} as const;

/** Reihenfolge der Dokumentteile (Abschnitt 8) mit Standardausrichtung (Abschnitt 9). */
export const DOCUMENT_PARTS = [
  { key: 'cover', title: 'Deckblatt', orientation: 'portrait' },
  { key: 'info', title: 'Dokumentinformationen und Bearbeitungsstand', orientation: 'portrait' },
  { key: 'toc', title: 'Inhaltsverzeichnis', orientation: 'portrait' },
  { key: 'introduction', title: 'Einleitung und Erläuterungen', orientation: 'portrait' },
  { key: 'mainTable', title: 'Tabellarische Hauptübersicht', orientation: 'landscape' },
  { key: 'summary', title: 'Zusammenfassung und Auswertung', orientation: 'portrait' },
  { key: 'sources', title: 'Quellenverzeichnis', orientation: 'portrait' },
  { key: 'attachmentIndex', title: 'Anlagenverzeichnis', orientation: 'portrait' },
  { key: 'attachments', title: 'Anlagen', orientation: 'portrait' },
  { key: 'openChecks', title: 'Offene Prüfpunkte', orientation: 'portrait' },
] as const satisfies ReadonlyArray<{ key: string; title: string; orientation: Orientation }>;
