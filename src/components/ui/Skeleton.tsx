import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewProps } from 'react-native';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
}

export function Skeleton({ width, height = 16, rounded = false, style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  // width can be a number or percentage string — cast via unknown to satisfy TS
  const widthValue = (width ?? '100%') as number;

  return (
    <Animated.View
      style={[
        {
          width: widthValue,
          height,
          backgroundColor: '#e5e5e5',
          borderRadius: rounded ? 9999 : 6,
          opacity,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function ContactCardSkeleton() {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row items-center mb-3">
        <Skeleton width={40} height={40} rounded />
        <View className="ml-3 flex-1">
          <Skeleton width="60%" height={14} />
          <View className="mt-1.5">
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
        <Skeleton width={40} height={32} />
      </View>
    </View>
  );
}
