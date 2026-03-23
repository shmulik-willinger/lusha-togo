import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import CookieManager from '@react-native-cookies/cookies';
import { router } from 'expo-router';

export const BASE_URL = 'https://dashboard-services.lusha.com';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Origin': 'https://dashboard.lusha.com',
    'Referer': 'https://dashboard.lusha.com/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  },
  withCredentials: true,
});

// Request interceptor — attach session cookie.
// Strategy: prefer the cookie stored in SecureStore (set at login time).
// If that's empty (can happen on Android where WebView hides Set-Cookie headers),
// fall back to reading fresh cookies directly from the WebView cookie store.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let cookie = '';
    let pxCookie = '';

    // Primary: SecureStore-persisted cookie
    try {
      const raw = await SecureStore.getItemAsync('lusha_session');
      if (raw) {
        const session = JSON.parse(raw) as { cookie: string; pxCookie?: string };
        cookie = session.cookie ?? '';
        pxCookie = session.pxCookie ?? '';
      }
    } catch { /* ignore */ }

    // Fallback: read ALL cookies from the WebView cookie jar
    if (!cookie) {
      try {
        // Flush ensures pending WebView cookies are synced before reading (Android)
        await CookieManager.flush().catch(() => {});
        const cookies = await CookieManager.get(BASE_URL);
        // Send the full cookie string (all cookies for the domain), same as a browser would
        cookie = Object.values(cookies)
          .filter((c) => c.name && c.value)
          .map((c) => `${c.name}=${c.value}`)
          .join('; ');
      } catch { /* ignore */ }
    }

    if (cookie) {
      config.headers['Cookie'] = cookie;

      // Extract CSRF values from the cookie string and pass them as headers
      const csrfMatch = cookie.match(/(?:^|;\s*)_csrf=([^;]+)/);
      const xsrfMatch = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
      if (csrfMatch) config.headers['_csrf'] = decodeURIComponent(csrfMatch[1]);
      if (xsrfMatch) config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
    }

    // PerimeterX anti-bot header — required by Lusha API for POST requests
    if (pxCookie) config.headers['x-px-cookies'] = pxCookie;

    console.log('[api]', config.method?.toUpperCase(), config.url, 'cookie:', cookie ? 'YES' : 'NONE', 'px:', pxCookie ? 'YES' : 'NONE', 'xsrf:', config.headers['X-XSRF-TOKEN'] ? 'YES' : 'NONE');

    if (config.url?.includes('unmask')) {
      const cookieKeys = cookie ? cookie.split(';').map(c => c.trim().split('=')[0]).join(',') : 'none';
      console.log('[unmask-diag] cookie-names:', cookieKeys);
      console.log('[unmask-diag] _csrf:', config.headers['_csrf'] ? String(config.headers['_csrf']).substring(0,30) : 'MISSING');
      console.log('[unmask-diag] X-XSRF-TOKEN:', config.headers['X-XSRF-TOKEN'] ? String(config.headers['X-XSRF-TOKEN']).substring(0,30) : 'MISSING');
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor — log response status and handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const errBody = error.response?.data ? JSON.stringify(error.response.data).substring(0, 150) : '';
    console.log('[api-err]', status, url, errBody);
    if (status === 401) {
      await SecureStore.deleteItemAsync('lusha_session');
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
