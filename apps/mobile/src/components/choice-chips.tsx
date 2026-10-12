import { MIN_TOUCH_TARGET } from '@quellenklar/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme';

import { Text } from './text';

export interface Choice<T extends string> {
  value: T;
  label: string;
}

/** Einfachauswahl als Chips – mit Screenreader-Rolle „radio“. */
export function ChoiceChips<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: ReadonlyArray<Choice<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.wrapper} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text variant="label">{label}</Text>
      <View style={styles.chips}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              onPress={() => onChange(choice.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={choice.label}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text variant="label" style={{ color: selected ? colors.onPrimary : colors.text }}>
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
