import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
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
  logoUrl?: string;
  entityName?: string;
  onPress?: () => void;
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function SignalCard({
  kind, title, subtitle, live = false, logoUrl, entityName, onPress,
}: SignalCardProps) {
  const { Icon, bg, fg } = ICON[kind];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {logoUrl ? (
        <View style={styles.logoWrap}>
          <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="contain" />
          <View style={[styles.kindBadge, { backgroundColor: bg }]}>
            <Icon size={10} color={fg} strokeWidth={2.4} />
          </View>
        </View>
      ) : entityName ? (
        <View style={styles.initialsWrap}>
          <Text style={styles.initialsText}>{initialsOf(entityName)}</Text>
          <View style={[styles.kindBadge, { backgroundColor: bg }]}>
            <Icon size={10} color={fg} strokeWidth={2.4} />
          </View>
        </View>
      ) : (
        <View style={[styles.icon, { backgroundColor: bg }]}>
          <Icon size={18} color={fg} strokeWidth={2.2} />
        </View>
      )}
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
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: color.line,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'visible',
  },
  logoImg: { width: 40, height: 40, borderRadius: 10 },
  initialsWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: color.brandTint,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { color: color.brand, fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },
  kindBadge: {
    position: 'absolute',
    right: -4, bottom: -4,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: color.ink, lineHeight: 16 },
  subtitle: { fontSize: 11, color: color.muted, marginTop: 2 },
});
