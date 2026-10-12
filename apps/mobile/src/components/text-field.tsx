import { MIN_TOUCH_TARGET } from '@quellenklar/ui';
import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useColors } from '@/theme';

import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, style, ...rest },
  ref,
) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textSecondary}
        maxFontSizeMultiplier={2}
        style={[
          styles.input,
          typography.body,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" tone="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
