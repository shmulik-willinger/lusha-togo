import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

const PALETTE = ['#6F45FF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  uri?: string;
}

export function Avatar({ name, size = 40, uri }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  const initials = getInitials(name);
  const bg = PALETTE[hashName(name) % PALETTE.length] + '22';
  const fg = PALETTE[hashName(name) % PALETTE.length];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: size * 0.38, letterSpacing: 0.3 }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
