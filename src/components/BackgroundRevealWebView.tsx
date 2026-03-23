/**
 * Invisible WebView loaded at dashboard.lusha.com.
 * Gives PerimeterX (PX) a real browser context — so when reveal needs
 * to re-search via the WebView the request passes PX and the backend
 * populates Redis, enabling the subsequent unmask call to succeed.
 */
import React, { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { revealWebViewManager } from '../utils/revealWebView';

export function BackgroundRevealWebView() {
  const webViewRef = useRef<any>(null);

  // Register the ref with the manager so revealContact() can inject JS
  React.useEffect(() => {
    revealWebViewManager.setRef(webViewRef);
  }, []);

  return (
    <View style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute' }}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://dashboard.lusha.com' }}
        style={{ width: 1, height: 1 }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onLoad={() => revealWebViewManager.onLoaded()}
        onMessage={(e) => revealWebViewManager.handleMessage(e.nativeEvent.data)}
        // Suppress any visible UI (alerts, errors, etc.)
        onError={() => {}}
        onHttpError={() => {}}
      />
    </View>
  );
}
