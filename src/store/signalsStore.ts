import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_SIGNALS_KEY = 'lusha_signals_history';
const STORAGE_SUBS_KEY = 'lusha_subscriptions';
const SECURE_API_KEY = 'lusha_api_key';

/** Max signals to keep in history (oldest are dropped) */
const MAX_SIGNALS = 1000;

export interface StoredSubscription {
  /** Lusha subscription ID (from /api/subscriptions response) */
  id: string;
  entityId: string;
  entityType: 'contact' | 'company';
  entityName: string;
  signalTypes: string[];
  createdAt: string;
  logoUrl?: string;
}

export interface ReceivedSignal {
  id: string;
  timestamp: string;
  entityName: string;
  /** Lusha personId or companyId — used for navigation */
  entityId: string;
  entityType: 'contact' | 'company';
  signalType: string;
  data: Record<string, any>;
  read: boolean;
  /** 'api' = fetched via Show button, 'webhook' = received via push */
  source: 'api' | 'webhook';
  /** Company logo URL — populated when available */
  logoUrl?: string;
}

interface SignalsState {
  /** Lusha API key — stored in SecureStore */
  apiKey: string;
  /** Expo push token for this device — in memory only */
  expoPushToken: string | null;
  /** Active Lusha subscriptions — persisted in AsyncStorage */
  subscriptions: StoredSubscription[];
  /** Received signal events — persisted in AsyncStorage */
  signals: ReceivedSignal[];
  /** Number of unread signals */
  unreadCount: number;

  // Actions
  loadApiKey: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;

  setExpoPushToken: (token: string) => void;

  loadFromStorage: () => Promise<void>;

  setSubscriptions: (subs: StoredSubscription[]) => Promise<void>;
  addSubscription: (sub: StoredSubscription) => Promise<void>;
  removeSubscription: (id: string) => Promise<void>;
  isFollowing: (entityId: string) => boolean;

  addSignal: (signal: ReceivedSignal) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearSignals: () => Promise<void>;
  /** Full reset — called on logout so a new user doesn't inherit subs/signals/api key */
  reset: () => Promise<void>;
}

export const useSignalsStore = create<SignalsState>((set, get) => ({
  apiKey: '',
  expoPushToken: null,
  subscriptions: [],
  signals: [],
  unreadCount: 0,

  loadApiKey: async () => {
    try {
      const key = await SecureStore.getItemAsync(SECURE_API_KEY);
      if (key) set({ apiKey: key });
    } catch { /* ignore */ }
  },

  setApiKey: async (key: string) => {
    await SecureStore.setItemAsync(SECURE_API_KEY, key);
    set({ apiKey: key });
  },

  setExpoPushToken: (token: string) => set({ expoPushToken: token }),

  loadFromStorage: async () => {
    try {
      const [rawSubs, rawSignals] = await Promise.all([
        AsyncStorage.getItem(STORAGE_SUBS_KEY),
        AsyncStorage.getItem(STORAGE_SIGNALS_KEY),
      ]);

      const subscriptions: StoredSubscription[] = (rawSubs ? JSON.parse(rawSubs) : []).map((s: StoredSubscription) => ({
        ...s,
        entityName: s.entityName.replace(/\s*—\s*Lusha ToGo\s*$/i, ''),
      }));
      const signals: ReceivedSignal[] = rawSignals ? JSON.parse(rawSignals) : [];
      const unreadCount = signals.filter((s) => !s.read).length;

      set({ subscriptions, signals, unreadCount });
    } catch { /* ignore */ }
  },

  setSubscriptions: async (subs: StoredSubscription[]) => {
    await AsyncStorage.setItem(STORAGE_SUBS_KEY, JSON.stringify(subs));
    set({ subscriptions: subs });
  },

  addSubscription: async (sub: StoredSubscription) => {
    const current = get().subscriptions;
    const updated = [sub, ...current.filter((s) => s.entityId !== sub.entityId || s.entityType !== sub.entityType)];
    await AsyncStorage.setItem(STORAGE_SUBS_KEY, JSON.stringify(updated));
    set({ subscriptions: updated });
  },

  removeSubscription: async (id: string) => {
    const updated = get().subscriptions.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_SUBS_KEY, JSON.stringify(updated));
    set({ subscriptions: updated });
  },

  isFollowing: (entityId: string) => {
    return get().subscriptions.some((s) => s.entityId === String(entityId));
  },

  addSignal: async (signal: ReceivedSignal) => {
    const current = get().signals;
    // avoid exact duplicate (same id)
    if (current.some((s) => s.id === signal.id)) return;
    const updated = [signal, ...current].slice(0, MAX_SIGNALS);
    await AsyncStorage.setItem(STORAGE_SIGNALS_KEY, JSON.stringify(updated));
    const unreadCount = updated.filter((s) => !s.read).length;
    set({ signals: updated, unreadCount });
  },

  markAllRead: async () => {
    const updated = get().signals.map((s) => ({ ...s, read: true }));
    await AsyncStorage.setItem(STORAGE_SIGNALS_KEY, JSON.stringify(updated));
    set({ signals: updated, unreadCount: 0 });
  },

  clearSignals: async () => {
    await AsyncStorage.removeItem(STORAGE_SIGNALS_KEY);
    set({ signals: [], unreadCount: 0 });
  },

  reset: async () => {
    try { await SecureStore.deleteItemAsync(SECURE_API_KEY); } catch {}
    try { await AsyncStorage.removeItem(STORAGE_SIGNALS_KEY); } catch {}
    try { await AsyncStorage.removeItem(STORAGE_SUBS_KEY); } catch {}
    set({ apiKey: '', subscriptions: [], signals: [], unreadCount: 0 });
  },
}));
