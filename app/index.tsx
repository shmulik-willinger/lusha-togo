import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

// Entry route — redirects to login or home once auth state is known.
// expo-router v6 navigates here first (lushamoto:///), so this screen
// acts as the loading/redirect gate instead of _layout.tsx.
export default function Index() {
  const { session, isLoading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isLoading, session]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5B4FCF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
