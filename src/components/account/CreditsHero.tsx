import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientHero } from '../ui/GradientHero';
import { color, radius } from '../../theme/tokens';

interface CreditsHeroProps {
  used: number;
  total: number;
  resetsOn?: string;
  dailyPace?: number;
}

export function CreditsHero({ used, total, resetsOn, dailyPace }: CreditsHeroProps) {
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const fillColor = pct < 5 ? color.danger : pct < 20 ? color.warm : color.live;

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <GradientHero variant="dark" style={styles.card}>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>MONTHLY CREDITS</Text>
            {resetsOn && <Text style={styles.resets}>resets {resetsOn}</Text>}
          </View>
          <View style={styles.numberRow}>
            <Text style={styles.big}>{remaining.toLocaleString()}</Text>
            <Text style={styles.of}>of {total.toLocaleString()} left</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
          </View>
          <Text style={styles.caption}>
            {Math.round(pct)}% remaining{dailyPace != null && dailyPace > 0 ? ` · ~${dailyPace} reveals/day pace` : ''}
          </Text>
        </View>
      </GradientHero>
    </View>
  );
}

const styles = StyleSheet.create({
  card:   { borderRadius: radius.lg, marginVertical: 16 },
  inner:  { padding: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow:{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
  resets: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  numberRow: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontSize: 32, fontWeight: '800', letterSpacing: -1, color: '#FFFFFF' },
  of:  { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  track: {
    height: 6, marginTop: 10, borderRadius: 3, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fill:   { height: '100%', borderRadius: 3 },
  caption:{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
});
