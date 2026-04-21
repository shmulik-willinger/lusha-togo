import React from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius as tokenRadius } from '../../theme/tokens';

type Variant = 'brand' | 'dark' | 'reveal';

const GRADIENTS: Record<Variant, [string, string]> = {
  brand:  ['#6F45FF', '#8C6BFF'],
  dark:   ['#0B0B10', '#2B1A66'],
  reveal: ['#0B0B10', '#2B1A66'],
};

interface GradientHeroProps {
  variant?: Variant;
  style?: ViewStyle;
  children: React.ReactNode;
  radius?: number;
}

export function GradientHero({
  variant = 'brand',
  style,
  children,
  radius: r = tokenRadius.lg,
}: GradientHeroProps) {
  return (
    <LinearGradient
      colors={GRADIENTS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: r, overflow: 'hidden' }, style]}
    >
      {children}
    </LinearGradient>
  );
}
