import { brand } from '@quellenklar/ui';
import { Image } from 'expo-image';

/** Platzhalter-Logo: Dokumentseite, „Q“ und Prüfhaken (siehe assets/brand/icon.svg). */
export function AppLogo({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: brand.primary,
      }}
      accessibilityLabel="QuellenKlar"
      accessible
    />
  );
}
