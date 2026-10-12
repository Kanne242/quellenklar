import { describe, expect, it } from 'vitest';

import {
  A4,
  cmToTwips,
  DOCUMENT_PARTS,
  marginsTwips,
  pageSizeTwips,
  ptToHalfPoints,
  TYPOGRAPHY,
  usableWidthTwips,
} from '../src/layout';

describe('Seitenlayout DIN A4', () => {
  it('rechnet cm korrekt in Twips um', () => {
    expect(cmToTwips(2.54)).toBe(1440);
    expect(cmToTwips(2.5)).toBe(1417);
    expect(cmToTwips(2.0)).toBe(1134);
    expect(cmToTwips(1.8)).toBe(1020);
    expect(cmToTwips(1.5)).toBe(850);
  });

  it('hat die A4-Maße 11906 × 16838 Twips', () => {
    expect(A4).toEqual({ widthTwips: 11906, heightTwips: 16838 });
  });

  it('tauscht im Querformat Breite und Höhe', () => {
    expect(pageSizeTwips('landscape')).toEqual({ width: 16838, height: 11906 });
  });

  it('verwendet die Ränder aus der Spezifikation', () => {
    expect(marginsTwips('portrait')).toEqual({ left: 1417, right: 1134, top: 1134, bottom: 1134 });
    expect(marginsTwips('landscape')).toEqual({ left: 850, right: 850, top: 1020, bottom: 1020 });
  });

  it('bietet im Querformat deutlich mehr Tabellenbreite', () => {
    expect(usableWidthTwips('portrait')).toBe(9355);
    expect(usableWidthTwips('landscape')).toBe(15138);
  });

  it('setzt Tabellenschrift nie unter 9 pt', () => {
    expect(TYPOGRAPHY.tableMinPt).toBeGreaterThanOrEqual(9);
    expect(ptToHalfPoints(TYPOGRAPHY.sourcesPt)).toBe(19);
  });

  it('hält die verbindliche Reihenfolge der Dokumentteile ein', () => {
    expect(DOCUMENT_PARTS.map((p) => p.key)).toEqual([
      'cover',
      'info',
      'toc',
      'introduction',
      'mainTable',
      'summary',
      'sources',
      'attachmentIndex',
      'attachments',
      'openChecks',
    ]);
    expect(DOCUMENT_PARTS.find((p) => p.key === 'mainTable')?.orientation).toBe('landscape');
  });
});
