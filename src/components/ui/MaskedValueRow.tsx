import React from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { LivePill } from './LivePill';
import { color, radius } from '../../theme/tokens';

interface MaskedValueRowProps {
  label: string;
  masked: string;
  live?: boolean;
}

const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export function MaskedValueRow({ label, masked, live = false }: MaskedValueRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Lock size={13} color={color.brand} strokeWidth={2.2} />
      </View>
      <View style={styles.val}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.masked}>{masked}</Text>
      </View>
      {live && <LivePill size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(111,69,255,0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(111,69,255,0.4)',
    borderRadius: radius.md,
    marginBottom: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: color.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  val: { flex: 1 },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: color.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  masked: {
    fontSize: 12,
    fontFamily: monoFamily,
    letterSpacing: 1,
    color: color.muted2,
  },
});
