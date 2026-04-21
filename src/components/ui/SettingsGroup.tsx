import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { color, radius } from '../../theme/tokens';

export type SettingsRow = {
  icon?: LucideIcon;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

interface SettingsGroupProps {
  rows: SettingsRow[];
}

export function SettingsGroup({ rows }: SettingsGroupProps) {
  return (
    <View style={styles.group}>
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        const Icon = r.icon;
        const textColor = r.danger ? color.danger : color.ink;
        return (
          <Pressable
            key={i}
            onPress={r.onPress}
            style={[styles.row, !isLast && styles.rowBorder]}
          >
            {Icon && (
              <Icon
                size={16}
                color={r.iconColor ?? (r.danger ? color.danger : color.muted)}
                strokeWidth={2.2}
                style={{ width: 22 }}
              />
            )}
            <Text style={[styles.label, { color: textColor }]}>{r.label}</Text>
            {r.value && <Text style={styles.value}>{r.value}</Text>}
            {!r.danger && <ChevronRight size={14} color={color.muted} strokeWidth={2.2} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F3F5' },
  label: { flex: 1, fontSize: 13 },
  value: { fontSize: 11, color: color.muted },
});
