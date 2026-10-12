import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useAppStore } from '@/store/app-store';
import { useColors, useIsDark } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash-Screen bereits ausgeblendet – unkritisch.
});

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
      }),
  );
  const hydrated = useAppStore((s) => s.hydrated);
  const colors = useColors();
  const isDark = useIsDark();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  const base = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (!hydrated) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerTintColor: colors.accentText,
            headerTitleStyle: { color: colors.text },
            headerStyle: { backgroundColor: colors.surface },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="projekt/[id]" options={{ title: 'Projekt' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
