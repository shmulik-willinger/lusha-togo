import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoginHeroCoverProps {
  height?: number | string;
}

export function LoginHeroCover({ height = 360 }: LoginHeroCoverProps) {
  return (
    <View style={[styles.wrap, { height: height as number }]}>
      <LinearGradient
        colors={['#0B0B10', '#0B0B10']}
        style={StyleSheet.absoluteFill as any}
      />
      <LinearGradient
        colors={['rgba(111,69,255,0.55)', 'transparent']}
        start={{ x: 0.2, y: 0.15 }}
        end={{ x: 1, y: 0.7 }}
        style={StyleSheet.absoluteFill as any}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,210,122,0.25)']}
        start={{ x: 0.3, y: 0.4 }}
        end={{ x: 0.9, y: 0.85 }}
        style={StyleSheet.absoluteFill as any}
      />
      <View style={styles.inner}>
        <View style={styles.mark}>
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: 40, height: 40, borderRadius: 10 }}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Sell smarter.{'\n'}From anywhere.</Text>
          <Text style={styles.sub}>
            Verified B2B contacts in your pocket. Sign in to sync your pipeline.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  mark: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  textBlock: { flex: 1, justifyContent: 'center' },
  title: {
    color: '#FFFFFF', fontSize: 28, fontWeight: '800',
    letterSpacing: -1, lineHeight: 34, maxWidth: 280,
  },
  sub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 19,
    maxWidth: 280, marginTop: 10,
  },
});
