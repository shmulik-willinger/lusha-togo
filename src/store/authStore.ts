import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';

const SESSION_KEY = 'lusha_session';
const SECURE_API_KEY = 'lusha_api_key';
const STORAGE_SIGNALS_KEY = 'lusha_signals_history';
const STORAGE_SUBS_KEY = 'lusha_subscriptions';

export interface SessionData {
  cookie: string;       // full cookie string captured from WebView
  pxCookie?: string;    // PerimeterX anti-bot token from localStorage
  userId?: string;
  email?: string;
  name?: string;
  plan?: string;
  creditsUsed?: number;
  creditsTotal?: number;
}

interface AuthState {
  session: SessionData | null;
  isLoading: boolean;
  // Actions
  loadSession: () => Promise<void>;
  setSession: (session: SessionData) => Promise<void>;
  clearSession: () => Promise<void>;
  updateCredits: (used: number, total: number) => void;
  updateUserId: (userId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  loadSession: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw) as SessionData;
        set({ session, isLoading: false });
      } else {
        set({ session: null, isLoading: false });
      }
    } catch {
      set({ session: null, isLoading: false });
    }
  },

  setSession: async (session: SessionData) => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    set({ session });
  },

  clearSession: async () => {
    // Fast path: clear the session record + in-memory state so the router
    // navigates to /(auth)/login immediately and never renders stale data.
    try { await SecureStore.deleteItemAsync(SESSION_KEY); } catch {}
    set({ session: null });

    // Slow path: fire-and-forget cleanup. We don't await these because any
    // single failure (or a blocking CookieManager call on Android) would ANR
    // the UI and block sign-out. The next login either overwrites them or
    // ignores them entirely.
    void Promise.resolve().then(async () => {
      try { await CookieManager.clearAll(); } catch {}
      try { await SecureStore.deleteItemAsync(SECURE_API_KEY); } catch {}
      try { await AsyncStorage.removeItem(STORAGE_SIGNALS_KEY); } catch {}
      try { await AsyncStorage.removeItem(STORAGE_SUBS_KEY); } catch {}
    });
  },

  updateCredits: (creditsUsed: number, creditsTotal: number) => {
    set((state) =>
      state.session ? { session: { ...state.session, creditsUsed, creditsTotal } } : {},
    );
  },

  updateUserId: (userId: string) => {
    set((state) => {
      if (!state.session) return {};
      const updated = { ...state.session, userId };
      SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(updated)).catch(() => {});
      return { session: updated };
    });
  },
}));
