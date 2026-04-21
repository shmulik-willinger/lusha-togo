import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color } from '../../theme/tokens';

interface ScreenTitleProps {
  title: string;
  meta?: string;
}

export function ScreenTitle({ title, meta }: ScreenTitleProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {meta && <Text style={styles.meta}>{meta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: color.ink },
  meta:  { fontSize: 11, color: color.muted, marginTop: 2 },
});
