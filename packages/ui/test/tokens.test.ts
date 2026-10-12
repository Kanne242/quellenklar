import { describe, expect, it } from 'vitest';

import { contrastRatio } from '../src/contrast';
import { brand, darkColors, lightColors, type ColorScheme } from '../src/tokens';

const AA = 4.5;

function textPairs(c: ColorScheme): Array<[string, string, string]> {
  return [
    ['text/background', c.text, c.background],
    ['text/surface', c.text, c.surface],
    ['textSecondary/surface', c.textSecondary, c.surface],
    ['textSecondary/background', c.textSecondary, c.background],
    ['onPrimary/primary', c.onPrimary, c.primary],
    ['accentText/surface', c.accentText, c.surface],
    ['accentText/background', c.accentText, c.background],
    ['success/successSurface', c.success, c.successSurface],
    ['warning/warningSurface', c.warning, c.warningSurface],
    ['error/errorSurface', c.error, c.errorSurface],
    ['error/surface', c.error, c.surface],
    ['tabInactive/surface', c.tabInactive, c.surface],
  ];
}

describe('Barrierearme Kontraste (WCAG AA)', () => {
  for (const [name, scheme] of [
    ['hell', lightColors],
    ['dunkel', darkColors],
  ] as const) {
    for (const [pair, fg, bg] of textPairs(scheme)) {
      it(`${name}: ${pair} ≥ 4,5:1`, () => {
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  it('verwendet die Markenfarben im hellen Modus unverändert', () => {
    expect(lightColors.primary).toBe(brand.primary);
    expect(lightColors.accent).toBe(brand.accent);
    expect(lightColors.background).toBe(brand.backgroundLight);
    expect(lightColors.text).toBe(brand.textDark);
  });

  it('berechnet bekannte Referenzwerte korrekt', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
