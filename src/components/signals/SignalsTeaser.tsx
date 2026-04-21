import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TrendingUp, ArrowRight, Zap, Users, Briefcase, Bell, type LucideIcon } from 'lucide-react-native';
import { GradientHero } from '../ui/GradientHero';
import { color, radius } from '../../theme/tokens';

interface SampleSignal {
  Icon: LucideIcon;
  bg: string;
  fg: string;
  title: string;
  sub: string;
}

const SAMPLE_SIGNALS: SampleSignal[] = [
  { Icon: TrendingUp, bg: color.liveTint, fg: '#007A44',    title: 'Stripe raised Series I · $42M', sub: '2 days ago' },
  { Icon: ArrowRight, bg: color.warmTint, fg: color.warmInk, title: 'Sarah Chen · promoted to SVP',   sub: '4 days ago' },
];

const FEATURES: { Icon: LucideIcon; title: string }[] = [
  { Icon: Zap,        title: 'Funding rounds & IT-spend changes' },
  { Icon: Briefcase,  title: 'Job moves & promotions of followed contacts' },
  { Icon: Users,      title: 'Hiring surges by dept & location' },
  { Icon: Bell,       title: 'Push notifications when anything fires' },
];

interface SignalsTeaserProps {
  onActivate: () => void;
}

export function SignalsTeaser({ onActivate }: SignalsTeaserProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ padding: 16 }}>
        <GradientHero variant="brand" style={styles.card}>
          <View style={styles.inner}>
            <Text style={styles.eyebrow}>▶ PREVIEW · NOT ACTIVATED</Text>
            <Text style={styles.title}>See the last 7 days.</Text>
            <Text style={styles.sub}>This is a sample of what you'd see.</Text>

            {SAMPLE_SIGNALS.map((s, i) => {
              const { Icon } = s;
              return (
                <View key={i} style={[styles.sampleRow, i === 1 && { opacity: 0.6 }]}>
                  <View style={[styles.sampleIcon, { backgroundColor: s.bg }]}>
                    <Icon size={14} color={s.fg} strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sampleTitle}>{s.title}</Text>
                    <Text style={styles.sampleSub}>{s.sub}</Text>
                  </View>
                </View>
              );
            })}

            <Pressable onPress={onActivate} style={styles.cta} hitSlop={6}>
              <Zap size={13} color={color.liveInk} strokeWidth={2.6} />
              <Text style={styles.ctaText}>Activate with API key →</Text>
            </Pressable>
          </View>
        </GradientHero>
      </View>

      <View style={styles.featureGrid}>
        {FEATURES.map((f, i) => {
          const { Icon } = f;
          return (
            <View key={i} style={styles.featureCard}>
              <Icon size={18} color={color.brand} strokeWidth={2.2} />
              <Text style={styles.featureText}>{f.title}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:  { borderRadius: radius.lg },
  inner: { padding: 20 },
  eyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1 },
  title:   { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 6, letterSpacing: -0.3 },
  sub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  sampleRow: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm, padding: 10,
  },
  sampleIcon: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  sampleTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sampleSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  cta: {
    marginTop: 14,
    backgroundColor: color.live,
    paddingVertical: 12,
    borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  ctaText: { fontSize: 12, fontWeight: '700', color: color.liveInk },

  featureGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    shadowColor: '#0B0B10', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  featureText: { fontSize: 11, fontWeight: '700', color: color.ink, marginTop: 6, lineHeight: 15 },
});
