import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';
import { color } from '../../theme/tokens';

interface HeaderAction {
  icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
}

interface CleanBackHeaderProps {
  onBack: () => void;
  rightActions?: HeaderAction[];
}

export function CleanBackHeader({ onBack, rightActions = [] }: CleanBackHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <ChevronLeft size={22} color={color.brand} strokeWidth={2.4} />
      </Pressable>
      <View style={styles.right}>
        {rightActions.map(({ icon: Icon, onPress, active }, i) => (
          <Pressable key={i} onPress={onPress} hitSlop={8}>
            <Icon
              size={18}
              color={active ? color.brand : color.muted}
              strokeWidth={2.2}
              fill={active ? color.brand : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  back: { padding: 4 },
  right: { marginLeft: 'auto', flexDirection: 'row', gap: 14, paddingRight: 8 },
});
