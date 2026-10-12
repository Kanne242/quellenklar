import {
  darkColors,
  lightColors,
  radius,
  spacing,
  typography,
  type ColorScheme,
} from '@quellenklar/ui';
import { useColorScheme } from 'react-native';

export { radius, spacing, typography };
export type { ColorScheme };

export function useColors(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
