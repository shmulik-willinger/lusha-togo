import '../global.css';
import { useEffect, useRef } from 'react';
import { I18nManager, Platform, View } from 'react-native';
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
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuthStore } from '../src/store/authStore';
import { revealWebViewManager } from '../src/utils/revealWebView';
import { useSignalsStore, ReceivedSignal } from '../src/store/signalsStore';
import { registerDeviceWithRelay } from '../src/api/signals';
import { resolveUserId } from '../src/utils/session';
import { getUserInfo } from '../src/api/auth';
// Force LTR regardless of device language (app is English-only).
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Lusha Signals',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6f45ff',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'cdb7979c-134e-4426-8ec6-b8b04e0da958',
    });
    return tokenData.data;
  } catch (e) {
    console.log('[notifications] getExpoPushTokenAsync failed:', e);
    return null;
  }
}

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

function addSignalFromNotification(
  notification: Notifications.Notification,
  addSignal: (s: ReceivedSignal) => Promise<void>,
) {
  const content = notification.request.content;
  const data = (content.data ?? {}) as Record<string, any>;
  const signalType: string = data.signal_type ?? 'unknown';
  const signalData: Record<string, any> = data.signal_data ?? {};
  const entityName: string =
    data.entity_name ?? signalData.contactName ?? signalData.name ?? content.title ?? 'Unknown';
  const entityId: string = String(data.entity_id ?? signalData.entityId ?? '');
  const entityType: 'contact' | 'company' =
    data.entity_type === 'company' ? 'company' : 'contact';

  addSignal({
    id: notification.request.identifier ?? Date.now().toString(),
    timestamp: new Date().toISOString(),
    entityName,
    entityId,
    entityType,
    signalType,
    data: signalData,
    read: false,
    source: 'webhook',
  }).catch(() => {});
}

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

  const { session, updateUserId } = useAuthStore();
  const { loadApiKey, loadFromStorage, setExpoPushToken, expoPushToken, addSignal } = useSignalsStore();
  const notifListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  // Load persisted data on mount
  useEffect(() => {
    loadApiKey();
    loadFromStorage();
  }, []);

  // Ensure userId is persisted in session (resolve from API if missing)
  useEffect(() => {
    if (!session?.cookie) return;
    if (session.userId) return; // already have it
    getUserInfo(undefined, session.email).then((info) => {
      if (info.userId) {
        console.log('[layout] resolved userId from API:', info.userId);
        updateUserId(info.userId);
      }
    }).catch(() => {});
  }, [session?.cookie]);

  // Register for push notifications when user is logged in
  useEffect(() => {
    if (!session?.cookie) return;

    const userId = resolveUserId(session);
    if (!userId) return;

    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;
      setExpoPushToken(token);
      // Register under resolved userId (numeric or email)
      registerDeviceWithRelay(userId, token).catch((e) =>
        console.log('[notifications] relay registration failed:', e?.message),
      );
      // Also register under email so webhooks from older subscriptions still route correctly
      if (session?.email && session.email !== userId) {
        registerDeviceWithRelay(session.email, token).catch(() => {});
      }
    });

    // Foreground: notification received while app is open
    notifListenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
      addSignalFromNotification(notification, addSignal);
    });

    // Background/killed: user taps the notification
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      addSignalFromNotification(response.notification, addSignal);
    });

    return () => {
      if (notifListenerRef.current) Notifications.removeNotificationSubscription(notifListenerRef.current);
      if (responseListenerRef.current) Notifications.removeNotificationSubscription(responseListenerRef.current);
    };
  }, [session?.cookie]);

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
        <Stack.Screen
          name="upload-contacts"
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
