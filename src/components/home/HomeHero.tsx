import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { GradientHero } from '../ui/GradientHero';
import { useAuthStore } from '../../store/authStore';
import { useSignalsStore } from '../../store/signalsStore';
import { radius } from '../../theme/tokens';

// Extract first name from JWT payload in session cookie, matching account.tsx logic
function decodeFirstName(cookie?: string): string {
  if (!cookie) return '';
  try {
    const m = cookie.match(/(?:^|;\s*)(?:ll|sall)=([^;]+)/);
    if (!m) return '';
    const parts = m[1].split('.');
    if (parts.length < 2) return '';
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload.firstName || payload.first_name || '';
  } catch { return ''; }
}

function countRecentSignals(signals: { timestamp: string }[]): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return signals.filter((s) => now - new Date(s.timestamp).getTime() < day).length;
}

export function HomeHero() {
  const { session } = useAuthStore();
  const signals = useSignalsStore((s) => s.signals);

  const firstNameFromSession = session?.name?.split(' ')[0] ?? '';
  const firstNameFromJwt = decodeFirstName(session?.cookie);
  const firstName = firstNameFromJwt || firstNameFromSession || 'there';

  const hot = countRecentSignals(signals);

  return (
    <GradientHero variant="brand" radius={0} style={styles.hero}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>HELLO, {firstName.toUpperCase()}</Text>
        <Text style={styles.title}>
          {hot > 0
            ? `You've got ${hot} warm signal${hot === 1 ? '' : 's'} today.`
            : `Ready to find your next lead.`}
        </Text>

        <Pressable onPress={() => router.push('/(tabs)/search' as never)} style={styles.searchCard}>
          <View style={styles.searchRow1}>
            <Sparkles size={13} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.searchAsk}>Ask Lusha AI</Text>
          </View>
          <Text style={styles.searchPrompt}>
            "VP of Sales at Series B fintech in NYC…"
          </Text>
        </Pressable>
      </View>
    </GradientHero>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 20, paddingBottom: 24 },
  inner: { paddingHorizontal: 16 },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 14,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.md,
    padding: 12,
  },
  searchRow1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchAsk: { fontSize: 11.5, color: '#FFFFFF', opacity: 0.95, fontWeight: '500' },
  searchPrompt: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
});
