import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, useColors } from '@/theme';

type Variant = keyof typeof typography;
type Tone = 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'onPrimary';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  children?: ReactNode;
}

/**
 * Text mit Design-Tokens. Schriftgrößen skalieren mit der Systemeinstellung
 * (allowFontScaling ist Standard), begrenzt auf das 2-Fache, damit Layouts nutzbar bleiben.
 */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const colors = useColors();
  const color = {
    default: colors.text,
    secondary: colors.textSecondary,
    accent: colors.accentText,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    onPrimary: colors.onPrimary,
  }[tone];
  const isHeading = variant === 'display' || variant === 'title' || variant === 'heading';
  return (
    <RNText
      maxFontSizeMultiplier={2}
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[typography[variant], { color }, style]}
      {...rest}
    />
  );
}
