import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { color, radius } from '../../theme/tokens';

type Pref = 'system' | 'light' | 'dark';

interface AppearanceSheetProps {
  visible: boolean;
  value: Pref;
  onChange: (p: Pref) => void;
  onClose: () => void;
}

const OPTIONS: { value: Pref; label: string; sub: string }[] = [
  { value: 'system', label: 'System', sub: 'Follow device setting' },
  { value: 'light',  label: 'Light',  sub: 'Always light theme' },
  { value: 'dark',   label: 'Dark',   sub: 'Always dark theme' },
];

export function AppearanceSheet({ visible, value, onChange, onClose }: AppearanceSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 16) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Appearance</Text>
          {OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => { onChange(opt.value); onClose(); }}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{opt.label}</Text>
                  <Text style={styles.sub}>{opt.sub}</Text>
                </View>
                {selected && <Check size={18} color={color.brand} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#D1D1DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: color.ink, marginBottom: 14, letterSpacing: -0.3 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F3F5',
  },
  label: { fontSize: 14, fontWeight: '600', color: color.ink },
  sub:   { fontSize: 11, color: color.muted, marginTop: 2 },
});
