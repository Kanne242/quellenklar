import { DEFAULT_PLANS, REVIEW_ADDON, type PlanDefinition } from '@quellenklar/shared';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Button } from '@/components/button';
import {
  Badge,
  Card,
  ComingSoonBadge,
  layoutStyles,
  Screen,
  SectionHeader,
} from '@/components/layout';
import { Text } from '@/components/text';
import { useAppStore } from '@/store/app-store';

const euro = (value: number) =>
  value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

function limitLine(plan: PlanDefinition): string[] {
  const l = plan.limits;
  return [
    l.maxActiveProjects === null
      ? 'Projekte im Rahmen fairer Nutzung'
      : `${l.maxActiveProjects} aktives Projekt`,
    l.monthlyDocxExports === null
      ? 'DOCX-Exporte im Rahmen fairer Nutzung'
      : `${l.monthlyDocxExports} DOCX-Exporte pro Monat`,
    `${l.monthlyFullReviews} vollständige KI-Prüfung${l.monthlyFullReviews === 1 ? '' : 'en'} pro Monat`,
  ];
}

function Row({ label, comingSoon = true }: { label: string; comingSoon?: boolean }) {
  return (
    <View style={layoutStyles.rowBetween}>
      <Text style={{ flex: 1 }}>{label}</Text>
      {comingSoon ? <ComingSoonBadge /> : null}
    </View>
  );
}

export default function AccountScreen() {
  const plan = useAppStore((s) => s.plan);
  const projectCount = useAppStore((s) => s.projects.length);
  const clearLocalData = useAppStore((s) => s.clearLocalData);
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const current = DEFAULT_PLANS[plan];

  const confirmClear = () => {
    Alert.alert(
      'Alle lokalen Daten löschen?',
      `Es werden ${projectCount} Projekt${projectCount === 1 ? '' : 'e'} mit allen Inhalten von diesem Gerät gelöscht. Das kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: () => {
            clearLocalData();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Text variant="title">Konto</Text>

      <Card>
        <SectionHeader
          title="Anmeldung"
          subtitle="Du nutzt QuellenKlar derzeit ohne Konto. Daten liegen nur auf diesem Gerät."
        />
        <Row label="Anmelden mit E-Mail" />
        <Row label="Mit Apple anmelden" />
      </Card>

      <Card>
        <View style={layoutStyles.rowBetween}>
          <SectionHeader title="Dein Tarif" />
          <Badge label={current.name} tone="accent" />
        </View>
        {limitLine(current).map((line) => (
          <Text key={line} tone="secondary">
            • {line}
          </Text>
        ))}
        <Text variant="caption" tone="secondary">
          Monatskontingente werden am 1. des Folgemonats zurückgesetzt.
        </Text>
      </Card>

      <View style={layoutStyles.stack}>
        <SectionHeader
          title="Tarife"
          subtitle="Preise inkl. USt. Im Store wird der Preis deines Landes angezeigt."
        />
        {(['pro', 'business'] as const).map((id) => {
          const p = DEFAULT_PLANS[id];
          return (
            <Card key={id}>
              <View style={layoutStyles.rowBetween}>
                <Text variant="heading">{p.name}</Text>
                <ComingSoonBadge />
              </View>
              <Text>
                {euro(p.priceMonthlyEur)} pro Monat
                {p.priceYearlyEur !== null ? ` oder ${euro(p.priceYearlyEur)} pro Jahr` : ''}
              </Text>
              {limitLine(p).map((line) => (
                <Text key={line} tone="secondary">
                  • {line}
                </Text>
              ))}
              {p.limits.customBranding ? (
                <Text tone="secondary">• Eigenes Logo und eigene Akzentfarbe</Text>
              ) : null}
            </Card>
          );
        })}
        <Card>
          <View style={layoutStyles.rowBetween}>
            <Text variant="heading">{REVIEW_ADDON.name}</Text>
            <ComingSoonBadge />
          </View>
          <Text tone="secondary">
            {REVIEW_ADDON.reviews} zusätzliche vollständige KI-Prüfungen für{' '}
            {euro(REVIEW_ADDON.priceEur)}
          </Text>
        </Card>
      </View>

      <Card>
        <SectionHeader title="Datenschutz" />
        <Text tone="secondary">
          Entwürfe werden automatisch auf diesem Gerät gespeichert. Inhalte werden nur nach deiner
          ausdrücklichen Zustimmung zur KI-Prüfung übertragen – und nur, was für die gewählte
          Prüfung nötig ist.
        </Text>
        <Row label="Datenschutzerklärung" />
        <Row label="Impressum" />
        <Row label="Nutzungsbedingungen" />
        <Row label="Konto- und Projektdaten exportieren" />
      </Card>

      <Card>
        <SectionHeader title="Gerät" />
        <Button
          label="Einführung erneut ansehen"
          variant="secondary"
          onPress={() => {
            resetOnboarding();
            router.replace('/onboarding');
          }}
        />
        <Button label="Alle lokalen Daten löschen" variant="danger" onPress={confirmClear} />
      </Card>

      <Text variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
        QuellenKlar {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}
