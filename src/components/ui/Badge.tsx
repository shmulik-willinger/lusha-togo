import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'positive' | 'negative' | 'warning' | 'brand';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-neutral-100', text: 'text-neutral-600' },
  positive: { container: 'bg-green-100', text: 'text-green-700' },
  negative: { container: 'bg-red-100', text: 'text-red-700' },
  warning: { container: 'bg-orange-100', text: 'text-orange-700' },
  brand: { container: 'bg-primary-50', text: 'text-primary' },
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  const { container, text } = variantStyles[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${container}`}>
      <Text className={`text-xs font-sans-semibold ${text}`}>{children}</Text>
    </View>
  );
}
