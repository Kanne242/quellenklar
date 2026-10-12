/**
 * Design-Tokens von QuellenKlar.
 * Markenfarben laut Spezifikation; abgeleitete Töne sind so gewählt, dass Text auf ihnen
 * mindestens WCAG AA (4,5:1) erreicht – siehe test/tokens.test.ts.
 */

export const brand = {
  primary: '#102A43',
  accent: '#159E9C',
  backgroundLight: '#F5F7FA',
  textDark: '#172B4D',
  success: '#2E8B57',
  warning: '#C77D00',
  error: '#B42318',
} as const;

export interface ColorScheme {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textSecondary: string;
  /** Hintergrund für primäre Schaltflächen. */
  primary: string;
  onPrimary: string;
  /** Akzent für Flächen, Icons, Fortschritt (nicht für Fließtext auf hellem Grund). */
  accent: string;
  /** Akzent, der als Textfarbe auf `background`/`surface` lesbar ist. */
  accentText: string;
  success: string;
  warning: string;
  error: string;
  /** Hintergrundtöne für Status-Hinweise. */
  successSurface: string;
  warningSurface: string;
  errorSurface: string;
  tabInactive: string;
  shadow: string;
}

export const lightColors: ColorScheme = {
  background: brand.backgroundLight,
  surface: '#FFFFFF',
  surfaceMuted: '#EAEEF3',
  border: '#D5DCE4',
  text: brand.textDark,
  textSecondary: '#4A5A70',
  primary: brand.primary,
  onPrimary: '#FFFFFF',
  accent: brand.accent,
  accentText: '#0B7472',
  success: '#21704A',
  warning: '#8F5A00',
  error: brand.error,
  successSurface: '#E5F3EB',
  warningSurface: '#FBF0DC',
  errorSurface: '#FBE7E5',
  tabInactive: '#5B6B80',
  shadow: '#102A43',
};

export const darkColors: ColorScheme = {
  background: '#0B1622',
  surface: '#132232',
  surfaceMuted: '#1B2D40',
  border: '#2A3E54',
  text: '#E8EEF5',
  textSecondary: '#A9B7C7',
  primary: '#2BB8B5',
  onPrimary: '#06141F',
  accent: '#2BB8B5',
  accentText: '#4FD0CD',
  success: '#5CC48B',
  warning: '#F0B04A',
  error: '#F2867B',
  successSurface: '#12301F',
  warningSurface: '#33270F',
  errorSurface: '#3A1714',
  tabInactive: '#8A9AAD',
  shadow: '#000000',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

/** Schriftgrößen in pt; die App skaliert sie über die Systemeinstellung (Dynamic Type). */
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

/** Mindestgröße für Touch-Ziele (Apple HIG 44 pt, Material 48 dp). */
export const MIN_TOUCH_TARGET = 48;
