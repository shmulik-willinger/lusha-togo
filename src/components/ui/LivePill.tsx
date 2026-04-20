import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

type Variant = 'live' | 'brand' | 'ghost' | 'dnc' | 'warm';

type Props = {
  label: string;
  variant?: Variant;
  dot?: boolean;
};

const palette: Record<Variant, { bg: string; fg: string }> = {
  live:  { bg: color.liveTint,   fg: color.liveInk   },
  brand: { bg: color.brandTint,  fg: color.brand     },
  ghost: { bg: color.line2,      fg: color.muted     },
  dnc:   { bg: color.dangerTint, fg: color.dangerInk },
  warm:  { bg: color.warmTint,   fg: color.warmInk   },
};

export function LivePill({ label, variant = 'live', dot = variant === 'live' }: Props) {
  const p = palette[variant];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color.live }]} />}
      <Text style={[styles.label, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
