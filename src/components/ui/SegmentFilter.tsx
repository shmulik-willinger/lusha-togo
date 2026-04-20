import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { color, radius } from '../../theme/tokens';

export type Segment = { key: string; label: string; count?: number };

type Props = {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
};

export function SegmentFilter({ segments, value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            style={[styles.chip, active ? styles.chipActive : styles.chipGhost]}
            hitSlop={8}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelGhost]}>
              {s.label}
              {typeof s.count === 'number' && (
                <Text style={{ opacity: 0.7 }}> · {s.count.toLocaleString()}</Text>
              )}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipActive: { backgroundColor: color.ink },
  chipGhost:  { backgroundColor: color.line2 },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: { color: '#FFF' },
  labelGhost:  { color: color.muted },
});
