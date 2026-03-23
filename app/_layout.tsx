import '../global.css';
import { useEffect, useRef } from 'react';
import { I18nManager, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { WebView } from 'react-native-webview';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../src/store/authStore';
import { revealWebViewManager } from '../src/utils/revealWebView';
// Force LTR regardless of device language (app is English-only).
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#ffffff' },
  headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1a1a1a' },
  headerTitleAlign: 'left' as const,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerTintColor: '#6f45ff',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    mutations: { retry: 0 },
  },
});

const BG_WV_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';

function BackgroundRevealWebView() {
  const { session } = useAuthStore();
  const wvRef = useRef<WebView>(null);

  useEffect(() => {
    revealWebViewManager.setRef(wvRef);
  }, []);

  if (!session?.cookie) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: 100, height: 100, opacity: 0, transform: [{ translateX: -500 }] }}
    >
      <WebView
        ref={wvRef}
        source={{ uri: 'https://dashboard.lusha.com/home' }}
        userAgent={BG_WV_UA}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onLoad={() => { console.log('[bg-webview] onLoad fired'); revealWebViewManager.onLoaded(); }}
        onError={(e) => console.log('[bg-webview] onError:', e.nativeEvent.description)}
        onMessage={(e) => revealWebViewManager.handleMessage(e.nativeEvent.data)}
        style={{ flex: 1 }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <BackgroundRevealWebView />
      <Stack screenOptions={{ headerShown: false, ...HEADER_STYLE }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="contact/[id]"
          options={{ headerShown: true, title: 'Contact', presentation: 'card', ...HEADER_STYLE }}
        />
        <Stack.Screen
          name="company/[id]"
          options={{ headerShown: true, title: 'Company', presentation: 'card', ...HEADER_STYLE }}
        />
        <Stack.Screen
          name="list/[id]"
          options={{ headerShown: true, title: 'List', presentation: 'card', ...HEADER_STYLE }}
        />
        <Stack.Screen
          name="recommendations"
          options={{ headerShown: true, title: 'Recommended Leads', presentation: 'card', ...HEADER_STYLE }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
