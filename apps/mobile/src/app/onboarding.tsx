import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/app-logo';
import { Button } from '@/components/button';
import { Card, ComingSoonBadge, layoutStyles, Screen } from '@/components/layout';
import { Text } from '@/components/text';
import { useAppStore } from '@/store/app-store';
import { radius, spacing, useColors } from '@/theme';

interface Page {
  title: string;
  lead: string;
  points: Array<{ title: string; text: string }>;
}

const PAGES: Page[] = [
  {
    title: 'Strukturieren und belegen',
    lead: 'QuellenKlar führt dich Schritt für Schritt zu einem sauberen Dokument – ohne leere Seite.',
    points: [
      {
        title: 'Strukturieren',
        text: 'Inhalte, Tabellen und Anlagen in einem geführten Ablauf erfassen.',
      },
      {
        title: 'Belegen',
        text: 'Jede Zeile mit Quellen verknüpfen – mit stabilen IDs wie Q01, Q02.',
      },
    ],
  },
  {
    title: 'Prüfen und exportieren',
    lead: 'Am Ende steht eine vollständig bearbeitbare Word-Datei (.docx).',
    points: [
      {
        title: 'Prüfen',
        text: 'Sprache, Konsistenz und Quellen prüfen. Unklares wird als „PRÜFEN“ markiert, nie erfunden.',
      },
      {
        title: 'Exportieren',
        text: 'DOCX mit Inhaltsverzeichnis, Seitenzahlen und Quellenverzeichnis.',
      },
    ],
  },
  {
    title: 'Deine Daten bleiben deine',
    lead: 'Datenschutz ist kein Zusatz, sondern Grundlage.',
    points: [
      { title: 'Auf deinem Gerät', text: 'Entwürfe werden automatisch lokal gespeichert.' },
      {
        title: 'KI nur mit Zustimmung',
        text: 'Inhalte und Anlagen gehen nur nach deiner ausdrücklichen Einwilligung an die KI-Prüfung.',
      },
      { title: 'Jederzeit löschbar', text: 'Projekte und Konto lassen sich vollständig löschen.' },
    ],
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const colors = useColors();
  const page = PAGES[index] ?? PAGES[0]!;
  const isLast = index === PAGES.length - 1;

  const finish = () => {
    completeOnboarding();
    router.replace('/');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={layoutStyles.rowBetween}>
        <AppLogo size={40} />
        {!isLast ? (
          <Button label="Überspringen" variant="ghost" onPress={finish} testID="onboarding-skip" />
        ) : null}
      </View>

      <View style={styles.header}>
        <Text
          variant="caption"
          tone="secondary"
          accessibilityLabel={`Seite ${index + 1} von ${PAGES.length}`}
        >
          {index + 1} / {PAGES.length}
        </Text>
        <Text variant="display">{page.title}</Text>
        <Text tone="secondary">{page.lead}</Text>
      </View>

      <View style={layoutStyles.stack}>
        {page.points.map((point) => (
          <Card key={point.title}>
            <Text variant="heading">{point.title}</Text>
            <Text tone="secondary">{point.text}</Text>
          </Card>
        ))}
      </View>

      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {PAGES.map((p, i) => (
          <View
            key={p.title}
            style={[styles.dot, { backgroundColor: i === index ? colors.accent : colors.border }]}
          />
        ))}
      </View>

      {isLast ? (
        <View style={layoutStyles.stack}>
          <Button label="Ohne Konto starten" onPress={finish} testID="onboarding-start" />
          <View style={[layoutStyles.rowBetween, styles.authHint]}>
            <Text variant="caption" tone="secondary" style={styles.flex}>
              Anmeldung per E-Mail und mit Apple
            </Text>
            <ComingSoonBadge />
          </View>
        </View>
      ) : (
        <View style={layoutStyles.row}>
          {index > 0 ? (
            <View style={styles.flex}>
              <Button label="Zurück" variant="secondary" onPress={() => setIndex(index - 1)} />
            </View>
          ) : null}
          <View style={styles.flex}>
            <Button label="Weiter" onPress={() => setIndex(index + 1)} testID="onboarding-next" />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, marginTop: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  flex: { flex: 1 },
  authHint: { paddingHorizontal: spacing.xs },
});
