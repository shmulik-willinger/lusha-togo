import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Avatar } from '../ui/Avatar';
import { color } from '../../theme/tokens';

interface PickerContactLite {
  id: string;
  name: string;
  displayName?: string;
  title?: string;
  company?: string;
}

interface ContactPickerRowProps {
  contact: PickerContactLite;
  selected: boolean;
  onToggle: () => void;
}

export function ContactPickerRow({ contact, selected, onToggle }: ContactPickerRowProps) {
  const name = contact.displayName ?? contact.name;
  const sub = [contact.title, contact.company].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.box, selected ? styles.boxOn : styles.boxOff]}>
        {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <Avatar name={name} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {!!sub && <Text style={styles.sub} numberOfLines={1}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  box: {
    width: 22, height: 22, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  boxOn:  { backgroundColor: color.brand },
  boxOff: { borderWidth: 1.5, borderColor: '#D1D1DB' },
  name: { fontSize: 12, fontWeight: '700', color: color.ink },
  sub:  { fontSize: 10, color: color.muted, marginTop: 1 },
});
