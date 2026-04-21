import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Phone, Lock, Mail, type LucideIcon } from 'lucide-react-native';
import { color } from '../../theme/tokens';

type Kind = 'call' | 'reveal' | 'locked' | 'email';

const CONFIG: Record<Kind, { bg: string; fg: string; Icon: LucideIcon }> = {
  call:   { bg: color.live,      fg: color.liveInk, Icon: Phone },
  email:  { bg: color.brand,     fg: '#FFFFFF',     Icon: Mail },
  reveal: { bg: color.brandTint, fg: color.brand,   Icon: Lock },
  locked: { bg: color.brandTint, fg: color.brand,   Icon: Lock },
};

interface QuickActionButtonProps {
  kind: Kind;
  onPress?: () => void;
  size?: number;
}

export function QuickActionButton({ kind, onPress, size = 32 }: QuickActionButtonProps) {
  const { bg, fg, Icon } = CONFIG[kind];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon size={size * 0.45} color={fg} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
