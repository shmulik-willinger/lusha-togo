import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

interface StickyActionBarProps {
  count: number;
  caption: string;
  actionLabel: string;
  onPress: () => void;
}

export function StickyActionBar({ count, caption, actionLabel, onPress }: StickyActionBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.countChip}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{count} selected</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <Pressable onPress={onPress} style={styles.action} hitSlop={8}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.brand,
    paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  countChip: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  title:     { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  caption:   { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  action: {
    backgroundColor: color.live,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: radius.sm,
  },
  actionText: { color: color.liveInk, fontWeight: '700', fontSize: 11 },
});
