import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

type Tone = 'default' | 'live' | 'warm' | 'danger';

interface StatChipProps {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'flat';
  tone?: Tone;
}

const TONE: Record<Tone, string> = {
  default: color.ink,
  live:    '#007A44',
  warm:    color.warmInk,
  danger:  color.danger,
};

export function StatChip({ value, label, trend, tone = 'default' }: StatChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.value, { color: TONE[tone] }]}>
        {trend === 'up'   && '▲ '}
        {trend === 'down' && '▼ '}
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: color.canvas,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  label: {
    fontSize: 9,
    color: color.muted2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
    marginTop: 2,
  },
});
