import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { color, radius, shadow } from '../../theme/tokens';

type Props = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
};

export function Card({ elevated, padded, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.base,
        elevated ? shadow.elevated : shadow.card,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
  },
  padded: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
