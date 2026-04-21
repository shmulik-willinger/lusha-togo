import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { LivePill } from '../ui/LivePill';
import { QuickActionButton } from '../ui/QuickActionButton';
import { color, radius } from '../../theme/tokens';

interface DecisionMakerContact {
  id: string;
  name: string;
  role?: string;
  seniority?: string;
  revealed?: boolean;
  live?: boolean;
  phoneNumber?: string;
}

interface DecisionMakerRowProps {
  contact: DecisionMakerContact;
  loading?: boolean;
  onCall?: () => void;
  onReveal?: () => void;
  onPress?: () => void;
}

export function DecisionMakerRow({ contact, loading, onCall, onReveal, onPress }: DecisionMakerRowProps) {
  const subtitle = [contact.role, contact.seniority].filter(Boolean).join(' · ');
  const handlePress = onPress ?? (() => router.push(`/contact/${contact.id}`));
  return (
    <Pressable
      onPress={handlePress}
      style={styles.row}
    >
      <Avatar name={contact.name} size={36} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
          {contact.live && <LivePill size="xs" />}
        </View>
        {!!subtitle && <Text style={styles.role} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={color.brand} />
      ) : contact.revealed ? (
        <QuickActionButton kind="call" onPress={onCall} size={28} />
      ) : (
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onReveal?.(); }}
          style={styles.revealPill}
        >
          <Text style={styles.revealText}>REVEAL</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F5',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700', color: color.ink },
  role: { fontSize: 11, color: color.muted, marginTop: 1 },
  revealPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: color.brandTint,
  },
  revealText: { fontSize: 11, fontWeight: '700', color: color.brand, letterSpacing: 0.3 },
});
