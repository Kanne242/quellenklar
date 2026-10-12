import { MIN_TOUCH_TARGET } from '@quellenklar/ui';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    danger: { bg: colors.errorSurface, fg: colors.error, border: colors.errorSurface },
    ghost: { bg: 'transparent', fg: colors.accentText, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !inactive && styles.pressed,
        inactive && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={palette.fg} /> : null}
        <Text variant="label" style={{ color: palette.fg }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
