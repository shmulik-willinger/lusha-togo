import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Modal } from 'react-native';

const MESSAGES = [
  "Hold on, it's worth it...",
  'Almost there!',
  'Applying filters!',
];

const PROGRESS_STEPS = [
  { target: 35, delay: 0 },
  { target: 80, delay: 1200 },
  { target: 100, delay: 2400 },
];

interface AIThinkingOverlayProps {
  visible: boolean;
}

export function AIThinkingOverlay({ visible }: AIThinkingOverlayProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      setMessageIdx(0);
      return;
    }

    // Animate progress bar in stages
    PROGRESS_STEPS.forEach(({ target, delay }, idx) => {
      setTimeout(() => {
        Animated.timing(progress, {
          toValue: target,
          duration: 800,
          useNativeDriver: false,
        }).start();
        setMessageIdx(Math.min(idx, MESSAGES.length - 1));
      }, delay);
    });
  }, [visible]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 items-center justify-center px-8">
        <View className="bg-white rounded-2xl p-8 w-full items-center shadow-2xl">
          {/* Lusha logo pulse animation */}
          <PulsingLogo />

          <Text className="text-neutral-800 font-sans-semibold text-lg mt-6 mb-2 text-center">
            Finding your prospects
          </Text>
          <Text className="text-neutral-500 text-sm text-center mb-6">
            {MESSAGES[messageIdx]}
          </Text>

          {/* Progress bar */}
          <View className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={{ width, backgroundColor: '#6f45ff' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PulsingLogo() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        { width: 64, height: 64, borderRadius: 16, backgroundColor: '#6f45ff', alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Text style={{ color: '#ffffff', fontSize: 28, fontWeight: '700' }}>L</Text>
    </Animated.View>
  );
}
