import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { color } from '../../theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  initiallyCollapsed?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  initiallyCollapsed = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(!initiallyCollapsed);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  const Chev = open ? ChevronUp : ChevronDown;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Chev size={16} color={color.muted} strokeWidth={2.2} />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title: { fontSize: 13, fontWeight: '700', color: color.ink, textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { paddingBottom: 16 },
});
