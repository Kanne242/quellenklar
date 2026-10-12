import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useColors } from '@/theme';

import { Text } from './text';

/** Scrollbarer Bildschirm mit ruhigem Hintergrund und großzügigen Abständen. */
export function Screen({
  children,
  scroll = true,
  edges = ['top'],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}) {
  const colors = useColors();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.screen, { backgroundColor: colors.background }]}>
      {content}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="heading">{title}</Text>
      {subtitle ? (
        <Text variant="caption" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const colors = useColors();
  const palette = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
    accent: { bg: colors.surfaceMuted, fg: colors.accentText },
    success: { bg: colors.successSurface, fg: colors.success },
    warning: { bg: colors.warningSurface, fg: colors.warning },
    error: { bg: colors.errorSurface, fg: colors.error },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text variant="caption" style={{ color: palette.fg, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

/** Kennzeichnung noch nicht verfügbarer Funktionen (Produktregel 10). */
export function ComingSoonBadge() {
  return <Badge label="Demnächst" tone="warning" />;
}

export const layoutStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stack: { gap: spacing.md },
  stackLg: { gap: spacing.xl },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.xl,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: { gap: spacing.xxs },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
