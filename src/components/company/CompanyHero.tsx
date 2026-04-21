import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatChip } from '../ui/StatChip';
import { color, radius } from '../../theme/tokens';

interface CompanyHeroProps {
  name: string;
  industry?: string;
  location?: string;
  domain?: string;
  logoUrl?: string;
  stats: {
    employees?: string;
    revenue?: string;
    headcountDelta?: string;
  };
}

export function CompanyHero({ name, industry, location, domain, logoUrl, stats }: CompanyHeroProps) {
  const visibleStats = [
    stats.employees && { key: 'emp', value: stats.employees, label: 'Employees' },
    stats.revenue && { key: 'rev', value: stats.revenue, label: 'Revenue' },
    stats.headcountDelta && { key: 'hc', value: stats.headcountDelta, label: '6mo HC', tone: 'live' as const },
  ].filter(Boolean) as { key: string; value: string; label: string; tone?: 'live' }[];

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[color.brandTint, '#E0F5E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      />
      <View style={styles.logo}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logoImg} resizeMode="contain" />
        ) : (
          <Text style={styles.logoText}>{name.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {[industry, location, domain].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {visibleStats.length > 0 && (
        <View style={styles.stats}>
          {visibleStats.map((s) => (
            <StatChip key={s.key} value={s.value} label={s.label} tone={s.tone} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', padding: 16 },
  banner: { height: 48, borderRadius: radius.md, marginBottom: -24 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  logoImg: { width: 56, height: 56, borderRadius: radius.md },
  logoText: { fontSize: 22, fontWeight: '800', color: color.brand },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: color.ink },
  meta: { fontSize: 12, color: color.muted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 6, marginTop: 12 },
});
