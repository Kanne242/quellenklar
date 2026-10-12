import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAppStore } from '@/store/app-store';
import { useColors } from '@/theme';

/** Hauptnavigation – höchstens vier Bereiche (Spezifikation Abschnitt 5). */
export default function TabsLayout() {
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const colors = useColors();

  if (!onboardingCompleted) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.accent}
      iconColor={{ default: colors.tabInactive, selected: colors.accent }}
      labelStyle={{
        default: { color: colors.tabInactive },
        selected: { color: colors.accentText },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Projekte</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'folder', selected: 'folder.fill' }} md="folder" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="neu">
        <NativeTabs.Trigger.Label>Neu erstellen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vorlagen">
        <NativeTabs.Trigger.Label>Vorlagen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="doc.on.doc" md="description" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="konto">
        <NativeTabs.Trigger.Label>Konto</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
