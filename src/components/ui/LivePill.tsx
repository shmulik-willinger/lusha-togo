import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

type Variant = 'live' | 'brand' | 'ghost' | 'dnc' | 'warm';
type Size = 'xs' | 'sm' | 'md';

interface LivePillProps {
  label?: string;
  variant?: Variant;
  dot?: boolean;
  size?: Size;
}

const palette: Record<Variant, { bg: string; fg: string }> = {
  live:  { bg: color.liveTint,   fg: color.liveInk   },
  brand: { bg: color.brandTint,  fg: color.brand     },
  ghost: { bg: color.line2,      fg: color.muted     },
  dnc:   { bg: color.dangerTint, fg: color.dangerInk },
  warm:  { bg: color.warmTint,   fg: color.warmInk   },
};

const sizeMap: Record<Size, { pad: number; py: number; font: number; dot: number; gap: number }> = {
  xs: { pad: 6,  py: 2, font: 9,  dot: 5, gap: 3 },
  sm: { pad: 8,  py: 3, font: 10, dot: 6, gap: 4 },
  md: { pad: 10, py: 4, font: 11, dot: 7, gap: 5 },
};

export function LivePill({ label = 'LIVE', variant = 'live', dot = variant === 'live', size = 'sm' }: LivePillProps) {
  const p = palette[variant];
  const s = sizeMap[size];
  return (
    <View style={[
      styles.pill,
      { backgroundColor: p.bg, paddingHorizontal: s.pad, paddingVertical: s.py, gap: s.gap, borderRadius: radius.pill },
    ]}>
      {dot && <View style={{ width: s.dot, height: s.dot, borderRadius: s.dot / 2, backgroundColor: color.live }} />}
      <Text style={[styles.label, { color: p.fg, fontSize: s.font }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
