import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { GradientHero } from '../ui/GradientHero';
import { color, radius } from '../../theme/tokens';

interface RevealHeroCardProps {
  contactName: string;
  valueCount: {
    phones: number;
    emails: number;
    social?: string[];
  };
  creditCost?: number;
  loading?: boolean;
  onReveal?: () => void;
}

export function RevealHeroCard({
  contactName,
  valueCount,
  creditCost = 1,
  loading = false,
  onReveal,
}: RevealHeroCardProps) {
  const { phones, emails, social = [] } = valueCount;
  const summary = [
    phones && `${phones} phone${phones > 1 ? 's' : ''}`,
    emails && `${emails} email${emails > 1 ? 's' : ''}`,
    ...social,
  ].filter(Boolean).join(' · ') || 'Contact data';

  const firstName = contactName.split(' ')[0] || 'this contact';

  return (
    <GradientHero variant="dark" style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>◆ PREMIUM DATA</Text>
        </View>
        <Text style={styles.title}>Unlock {firstName}'s direct line.</Text>
        <Text style={styles.sub}>{summary}</Text>
        <Pressable onPress={onReveal} disabled={loading} style={[styles.cta, loading && { opacity: 0.7 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={color.liveInk} />
          ) : (
            <Zap size={14} color={color.liveInk} strokeWidth={2.6} fill={color.liveInk} />
          )}
          <Text style={styles.ctaText}>
            {loading ? 'Revealing…' : `Reveal · ${creditCost} credit${creditCost > 1 ? 's' : ''}`}
          </Text>
        </Pressable>
      </View>
    </GradientHero>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10 },
  inner: { padding: 20, alignItems: 'center' },
  chip: {
    backgroundColor: color.liveTint,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 10,
  },
  chipText: { fontSize: 10, fontWeight: '700', color: color.liveInk, letterSpacing: 0.3 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 3,
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 14,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: color.live,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    alignSelf: 'stretch',
  },
  ctaText: { fontSize: 12, fontWeight: '700', color: color.liveInk },
});
