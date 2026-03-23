import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../../src/store/authStore';

const SAVED_EMAIL_KEY = 'lusha_saved_email';
const SAVED_PASSWORD_KEY = 'lusha_saved_password';

// Cookie names used by Lusha in production
const LUSHA_COOKIE_NAMES = ['ll', 'sall', 'll_staging', 'sall_staging'];
const LUSHA_DASHBOARD = 'https://dashboard.lusha.com';
// Only flag paths that are definitely login/auth-entry pages (not OAuth callbacks).
const LOGIN_PATH_FRAGMENTS = ['/login', '/signin', '/sign-in', '/auth/login', '/auth/signin'];
// Mimic Chrome on Android so Cloudflare treats the WebView as a real browser.
const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';

function LushaLogo() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Rect x={0} y={0} width={80} height={80} rx={20} fill="#6f45ff" />
      {/* Lusha L glyph — geometric sans-serif mark */}
      <Path d="M22 16 L36 16 L36 50 L58 50 L58 64 L22 64 Z" fill="white" />
    </Svg>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const pxCookieRef = useRef<string>('');
  const loginHandledRef = useRef(false); // prevent duplicate execution
  const { setSession } = useAuthStore();

  // Receive pxcookie extracted from WebView localStorage, or fill_done signal
  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'px_data') {
        console.log('[login] WebView localStorage keys:', JSON.stringify(msg.lsKeys));
        console.log('[login] pxcookie from localStorage:', msg.pxcookie ? msg.pxcookie.substring(0, 60) : 'NONE');
        pxCookieRef.current = msg.pxcookie ?? '';
      } else if (msg.type === 'fill_done' && msg.found) {
        // Form was submitted — poll silently in background WITHOUT showing the loading overlay.
        // If a CAPTCHA appears, the user must be able to see and interact with the WebView.
        // Loading overlay is shown only once we confirm session cookies exist (in finishLogin).
        console.log('[login] fill_done: form submitted, polling for session cookies silently');
        pollForSessionCookies();
      }
    } catch { /* ignore */ }
  };

  const pollForSessionCookies = async () => {
    if (loginHandledRef.current) return;
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        await CookieManager.flush().catch(() => {});
        const [dashboardCookies, rootCookies] = await Promise.all([
          CookieManager.get(LUSHA_DASHBOARD).catch(() => ({})),
          CookieManager.get('https://lusha.com').catch(() => ({})),
        ]);
        const mergedCookies = { ...rootCookies, ...dashboardCookies };
        const hasSession = LUSHA_COOKIE_NAMES.some((n) => mergedCookies[n]?.value);
        console.log('[login] poll attempt', i + 1, '| hasSession:', hasSession, '| keys:', Object.keys(mergedCookies).join(','));
        if (hasSession) {
          if (loginHandledRef.current) return;
          loginHandledRef.current = true;
          await finishLogin(mergedCookies);
          return;
        }
      } catch { /* keep polling */ }
    }
    // Timeout — let handleNavigationStateChange handle it as fallback
    console.log('[login] poll timed out without session cookies');
    setLoading(false);
  };

  // Pre-fill saved email + password on mount
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(SAVED_EMAIL_KEY),
      SecureStore.getItemAsync(SAVED_PASSWORD_KEY),
    ]).then(([savedEmail, savedPass]) => {
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
    });
  }, []);

  // JavaScript injected after the WebView finishes loading to auto-fill and submit the form.
  const buildAutoFillScript = (emailVal: string, passVal: string) => `
    (function() {
      function fireEvents(el) {
        ['focus','input','change','blur'].forEach(function(type) {
          el.dispatchEvent(new Event(type, { bubbles: true }));
        });
        // Also fire React synthetic event
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: el.value }));
      }
      function fill() {
        var emailField = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="mail" i], input[id*="email" i]');
        var passField  = document.querySelector('input[type="password"]');
        if (emailField && passField) {
          var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          emailField.focus();
          nativeSetter.call(emailField, ${JSON.stringify(emailVal)});
          fireEvents(emailField);
          passField.focus();
          nativeSetter.call(passField, ${JSON.stringify(passVal)});
          fireEvents(passField);
          passField.blur();
          // Wait for React state, then force-enable and click the submit button
          setTimeout(function() {
            var btn = document.querySelector('button[type="submit"]') ||
                      document.querySelector('button[data-testid*="login" i]') ||
                      document.querySelector('button[data-testid*="signin" i]') ||
                      Array.from(document.querySelectorAll('button')).find(function(b) {
                        return /sign.?in|log.?in/i.test(b.textContent);
                      });
            if (btn) {
              btn.disabled = false;
              btn.removeAttribute('disabled');
              btn.click();
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'fill_done',found:true}));
            } else {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'fill_done',found:false}));
            }
          }, 800);
          return true;
        }
        return false;
      }
      var attempts = 0;
      var id = setInterval(function() {
        if (fill() || ++attempts >= 15) clearInterval(id);
      }, 500);
    })();
    true;
  `;

  const handleLoginPress = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    // Clear stale session cookies so the WebView can't auto-redirect to /dashboard
    // with an expired/invalid token — forces a real login every time.
    await CookieManager.clearAll().catch(() => {});
    setLoading(false);
    setShowWebView(true);
  };

  const handleWebViewLoad = () => {
    if (webViewRef.current && email.trim() && password.trim()) {
      webViewRef.current.injectJavaScript(buildAutoFillScript(email.trim(), password));
    }
  };

  const finishLogin = async (mergedCookies: Record<string, any>) => {
    // Show loading overlay now — we have session cookies and are about to navigate away.
    setLoading(true);
    try {
      console.log('[login] cookies captured:', JSON.stringify(Object.keys(mergedCookies)));

      const ESSENTIAL_COOKIES = [
        'll', 'sall', 'll_staging', 'sall_staging',
        '_csrf', 'XSRF-TOKEN', '__cf_bm', 'pscd', 'user_guid',
        '_pxhd', '_px2', '_px3', '_pxvid', '_pxde',
      ];
      const essentialCookieStr = ESSENTIAL_COOKIES
        .filter((name) => mergedCookies[name]?.value)
        .map((name) => `${name}=${mergedCookies[name].value}`)
        .join('; ');

      const hasSession = LUSHA_COOKIE_NAMES.some((n) => mergedCookies[n]?.value);
      const cookieStr = hasSession ? essentialCookieStr : Object.values(mergedCookies)
        .filter((c: any) => c.name && c.value)
        .map((c: any) => `${c.name}=${c.value}`)
        .join('; ')
        .substring(0, 2000);

      console.log('[login] essential cookie string length:', cookieStr.length, 'hasSession:', hasSession);

      if (!pxCookieRef.current) {
        const pxhd = mergedCookies['_pxhd']?.value;
        const px2 = mergedCookies['_px2']?.value;
        const px3 = mergedCookies['_px3']?.value;
        const pxvid = mergedCookies['_pxvid']?.value;
        if (pxhd || px2 || pxvid) {
          pxCookieRef.current = JSON.stringify({ _pxhd: pxhd, _px2: px2, _px3: px3, _pxvid: pxvid });
        }
      }

      let jwtUserId: string | undefined;
      let jwtName: string | undefined;
      const llValue = mergedCookies['ll']?.value || mergedCookies['sall']?.value;
      if (llValue) {
        try {
          const parts = llValue.split('.');
          if (parts.length >= 2) {
            const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
            const payload = JSON.parse(atob(padded));
            jwtUserId = payload.userId?.toString() || payload.sub?.toString() || payload.id?.toString();
            const first = payload.firstName || payload.first_name;
            const last = payload.lastName || payload.last_name;
            jwtName = payload.name || (first ? `${first} ${last || ''}`.trim() : undefined);
          }
        } catch { /* ignore JWT decode errors */ }
      }

      await setSession({ cookie: cookieStr, email: email.trim(), userId: jwtUserId, name: jwtName, pxCookie: pxCookieRef.current });
      await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email.trim());
      await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password);
      setShowWebView(false);
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('[login] Cookie extraction failed:', err);
      await setSession({ cookie: '', email: email.trim() }).catch(() => {});
      await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email.trim()).catch(() => {});
      await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password).catch(() => {});
      setShowWebView(false);
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const { url } = navState;
    if (!url) return;

    const isOnLoginPage = LOGIN_PATH_FRAGMENTS.some((f) => url.includes(f));
    console.log('[login] nav:', url.substring(0, 100), 'loading:', navState.loading, 'isLoginPage:', isOnLoginPage);

    if (isOnLoginPage) return;
    // Only intercept dashboard.lusha.com pages (not lusha.com marketing site)
    // The poll approach handles the lusha.com redirect case via fill_done message
    if (!url.startsWith(LUSHA_DASHBOARD)) return;
    if (loginHandledRef.current) return;
    loginHandledRef.current = true;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    await CookieManager.flush().catch(() => {});
    const [dashboardCookies, rootCookies] = await Promise.all([
      CookieManager.get(LUSHA_DASHBOARD).catch(() => ({})),
      CookieManager.get('https://lusha.com').catch(() => ({})),
    ]);
    await finishLogin({ ...rootCookies, ...dashboardCookies });
  };

  const handleWebViewClose = () => {
    loginHandledRef.current = false;
    setShowWebView(false);
    setLoading(false);
  };

  const handleWebViewError = () => {
    setLoading(false);
    Alert.alert(
      'Connection error',
      'Could not reach Lusha. Please check your internet connection and try again.',
    );
    setShowWebView(false);
  };

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-neutral-100"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="items-center mb-10">
            <View className="mb-4">
              <LushaLogo />
            </View>
            <Text className="text-3xl font-sans-bold text-neutral-800">Lusha ToGo</Text>
            <Text className="text-neutral-500 text-base mt-1">Sign in to your account</Text>
          </View>

          {/* Form */}
          <View
            className="w-full bg-white rounded-2xl p-6 shadow-sm"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
          >
            <Text className="text-sm font-sans-semibold text-neutral-700 mb-1.5">Email</Text>
            <TextInput
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-neutral-800 text-base mb-4"
              placeholder="you@company.com"
              placeholderTextColor="#a3a3a3"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text className="text-sm font-sans-semibold text-neutral-700 mb-1.5">Password</Text>
            <TextInput
              className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3.5 text-neutral-800 text-base mb-6"
              placeholder="••••••••"
              placeholderTextColor="#a3a3a3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLoginPress}
            />

            <TouchableOpacity
              onPress={handleLoginPress}
              disabled={loading}
              className="bg-primary rounded-xl py-4 items-center"
              style={{ opacity: loading ? 0.7 : 1 }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-sans-bold">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-neutral-400 text-xs mt-8 text-center px-4">
            By signing in you agree to Lusha's Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* WebView login modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleWebViewClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
            <TouchableOpacity onPress={handleWebViewClose} style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 16, color: '#6f45ff' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#262626', textAlign: 'center' }}>Sign In</Text>
            {/* Spacer to center title */}
            <View style={{ width: 60 }} />
          </View>

          {loading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.85)', zIndex: 10 }}>
              <ActivityIndicator size="large" color="#6f45ff" />
              <Text style={{ marginTop: 12, color: '#666' }}>Signing in…</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: `${LUSHA_DASHBOARD}/login` }}
            userAgent={ANDROID_CHROME_UA}
            onLoad={handleWebViewLoad}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleWebViewMessage}
            onError={handleWebViewError}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
