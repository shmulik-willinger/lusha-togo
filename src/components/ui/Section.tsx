import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

interface SectionProps {
  title: string;
  subtitle?: string;
  count?: number | string;
  linkLabel?: string;
  onLinkPress?: () => void;
  children?: React.ReactNode;
}

export function Section({
  title, subtitle, count, linkLabel, onLinkPress, children,
}: SectionProps) {
  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {count != null && <Text style={styles.count}>· {count}</Text>}
          </View>
          {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
        {linkLabel && (
          <Pressable onPress={onLinkPress} hitSlop={8}>
            <Text style={styles.link}>{linkLabel} →</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: color.ink, letterSpacing: -0.3 },
  count: { fontSize: 15, fontWeight: '800', color: color.brand, letterSpacing: -0.3 },
  sub:   { fontSize: 11, color: color.muted, marginTop: 2 },
  link:  { fontSize: 10, fontWeight: '700', color: color.brand, letterSpacing: 0.5 },
});
