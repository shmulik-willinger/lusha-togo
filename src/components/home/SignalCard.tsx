import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TrendingUp, ArrowRight, Newspaper, type LucideIcon } from 'lucide-react-native';
import { LivePill } from '../ui/LivePill';
import { color, radius } from '../../theme/tokens';

type SignalKind = 'funding' | 'jobChange' | 'news';

const ICON: Record<SignalKind, { Icon: LucideIcon; bg: string; fg: string }> = {
  funding:   { Icon: TrendingUp, bg: color.liveTint,  fg: '#007A44' },
  jobChange: { Icon: ArrowRight, bg: color.warmTint,  fg: color.warmInk },
  news:      { Icon: Newspaper,  bg: color.brandTint, fg: color.brand },
};

interface SignalCardProps {
  kind: SignalKind;
  title: string;
  subtitle: string;
  live?: boolean;
  onPress?: () => void;
}

export function SignalCard({ kind, title, subtitle, live = false, onPress }: SignalCardProps) {
  const { Icon, bg, fg } = ICON[kind];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Icon size={18} color={fg} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {live && <LivePill size="xs" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: color.ink, lineHeight: 16 },
  subtitle: { fontSize: 11, color: color.muted, marginTop: 2 },
});
