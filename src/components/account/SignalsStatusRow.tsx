import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Radar, ChevronRight } from 'lucide-react-native';
import { color, radius } from '../../theme/tokens';

interface SignalsStatusRowProps {
  connected: boolean;
  entityCount?: number;
  maskedKey?: string;
  onPress: () => void;
}

export function SignalsStatusRow({
  connected, entityCount, maskedKey, onPress,
}: SignalsStatusRowProps) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
      <Pressable onPress={onPress} style={styles.card}>
        <View style={[styles.icon, { backgroundColor: connected ? color.liveTint : color.brandTint }]}>
          <Radar
            size={15}
            color={connected ? '#007A44' : color.brand}
            strokeWidth={2.2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Signals · {connected ? 'connected' : 'not connected'}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {connected
              ? `${entityCount ?? 0} entities${maskedKey ? ` · API key ${maskedKey}` : ''}`
              : 'Set up your API key to start receiving signals'}
          </Text>
        </View>
        <ChevronRight size={18} color={color.muted} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 14,
  },
  icon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '700', color: color.ink },
  sub:   { fontSize: 11, color: color.muted, marginTop: 2 },
});
