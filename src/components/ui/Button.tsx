import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary active:bg-primary-600',
    text: 'text-white font-sans-semibold',
  },
  secondary: {
    container: 'bg-white border border-neutral-200 active:bg-neutral-50',
    text: 'text-neutral-800 font-sans-semibold',
  },
  ghost: {
    container: 'active:bg-neutral-100',
    text: 'text-primary font-sans-semibold',
  },
  danger: {
    container: 'bg-negative active:bg-red-600',
    text: 'text-white font-sans-semibold',
  },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-1.5 rounded-md', text: 'text-xs' },
  md: { container: 'px-4 py-2.5 rounded-lg', text: 'text-sm' },
  lg: { container: 'px-5 py-3.5 rounded-lg', text: 'text-base' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const { container, text } = variantStyles[variant];
  const { container: sizeContainer, text: sizeText } = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center ${container} ${sizeContainer} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#6f45ff'}
          className="mr-2"
        />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${text} ${sizeText}`}>{children}</Text>
    </TouchableOpacity>
  );
}
