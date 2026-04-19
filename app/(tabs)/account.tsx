import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '../../src/api/auth';
import { logout } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useSignalsStore } from '../../src/store/signalsStore';

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ direction: 'ltr', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <Text style={{ color: '#6b7280', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14, maxWidth: '65%', textAlign: 'right' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function UsageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const isHigh = pct > 0.8;

  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>{used.toLocaleString()} used</Text>
        <Text style={{ color: '#6b7280', fontSize: 14 }}>{total.toLocaleString()} total</Text>
      </View>
      <View style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: 8, overflow: 'hidden' }}>
        <View
          style={{ height: '100%', borderRadius: 8, width: `${pct * 100}%`, backgroundColor: isHigh ? '#ef4444' : '#6f45ff' }}
        />
      </View>
      <Text style={{ color: isHigh ? '#ef4444' : '#6b7280', fontSize: 13, marginTop: 6, textAlign: 'right' }}>
        {Math.round(pct * 100)}% used
      </Text>
    </View>
  );
}

// Decode JWT payload from the ll session cookie to extract userId and name
function decodeSessionJWT(cookie?: string): { userId?: string; firstName?: string; lastName?: string } {
  if (!cookie) return {};
  try {
    const llMatch = cookie.match(/(?:^|;\s*)(?:ll|sall)=([^;]+)/);
    if (!llMatch) return {};
    const parts = llMatch[1].split('.');
    if (parts.length < 2) return {};
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    const rawId = payload.userId?.toString() || payload.sub?.toString() || payload.id?.toString();
    return {
      userId: rawId === 'anonymous' ? undefined : rawId,
      firstName: payload.firstName || payload.first_name,
      lastName: payload.lastName || payload.last_name,
    };
  } catch { return {}; }
}

function SignalsSection() {
  const { apiKey, setApiKey, subscriptions } = useSignalsStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await setApiKey(trimmed);
    setEditing(false);
  };

  const handleClear = () => {
    Alert.alert('Remove API Key', 'This will disable Signals notifications until you add a key again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setApiKey('') },
    ]);
  };

  return (
    <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
        Signals
      </Text>

      {!apiKey && !editing ? (
        <View style={{ paddingVertical: 14 }}>
          <Text style={{ color: '#6b7280', fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
            Add your Lusha API key to follow contacts and companies and receive signals as push notifications.
          </Text>
          <TouchableOpacity
            onPress={() => { setDraft(''); setEditing(true); }}
            style={{ backgroundColor: '#6f45ff', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Set up Signals</Text>
          </TouchableOpacity>
        </View>
      ) : editing ? (
        <View style={{ paddingVertical: 14 }}>
          <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
            Find your API key in Lusha dashboard → Settings → API Keys
          </Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Paste your Lusha API key"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1a1a1a', marginBottom: 10 }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleSave}
              style={{ flex: 1, backgroundColor: '#6f45ff', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditing(false)}
              style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ paddingVertical: 10 }}>
          <View style={{ direction: 'ltr', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>API Key</Text>
            <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14 }}>••••{apiKey.slice(-4)}</Text>
          </View>
          <View style={{ direction: 'ltr', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>Following</Text>
            <Text style={{ color: '#1a1a1a', fontWeight: '600', fontSize: 14 }}>{subscriptions.length} entities</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => { setDraft(''); setEditing(true); }}
              style={{ flex: 1, backgroundColor: '#f0ecff', borderRadius: 10, paddingVertical: 9, alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#6f45ff', fontWeight: '600', fontSize: 13 }}>Change Key</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              style={{ flex: 1, backgroundColor: '#fff5f5', borderRadius: 10, paddingVertical: 9, alignItems: 'center' }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 13 }}>Remove</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 8 }} />
        </View>
      )}
    </View>
  );
}

export default function AccountScreen() {
  const { session, clearSession, updateCredits } = useAuthStore();

  // Decode JWT from stored cookie if session doesn't have userId yet
  const jwtData = decodeSessionJWT(session?.cookie);
  const resolvedUserId = session?.userId || jwtData.userId;

  const userQuery = useQuery({
    queryKey: ['user-info', resolvedUserId, session?.email],
    queryFn: () => getUserInfo(resolvedUserId, session?.email),
  });

  useEffect(() => {
    if (userQuery.data?.creditsTotal != null) {
      updateCredits(userQuery.data.creditsUsed ?? 0, userQuery.data.creditsTotal);
    }
  }, [userQuery.data]);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          await clearSession();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const jwtName = (jwtData.firstName || jwtData.lastName)
    ? `${jwtData.firstName || ''} ${jwtData.lastName || ''}`.trim()
    : undefined;

  const fullName =
    (userQuery.data?.firstName || userQuery.data?.lastName)
      ? `${userQuery.data.firstName} ${userQuery.data.lastName}`.trim()
      : (session?.name || jwtName || '');

  const email = userQuery.data?.email || session?.email || '';
  const plan = userQuery.data?.plan || session?.plan || 'Professional';
  const creditsUsed = session?.creditsUsed ?? 0;
  const creditsTotal = session?.creditsTotal ?? 0;

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, marginBottom: 10 }}>
          <View style={{ direction: 'ltr', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0ecff', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
              <Text style={{ color: '#6f45ff', fontSize: 20, fontWeight: '700' }}>
                {fullName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {userQuery.isLoading ? (
                <>
                  <Skeleton width="55%" height={18} />
                  <View style={{ marginTop: 8 }}><Skeleton width="70%" height={13} /></View>
                </>
              ) : (
                <>
                  <Text style={{ color: '#1a1a1a', fontWeight: '700', fontSize: 17 }}>{fullName}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 3 }}>{email}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Plan & credits */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Plan
          </Text>
          <InfoCard label="Plan" value={plan} />
          {creditsTotal > 0 && (
            <View style={{ paddingVertical: 14 }}>
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13, marginBottom: 6 }}>Account credits</Text>
              <InfoCard label="Monthly quota" value={creditsTotal.toLocaleString()} />
              {creditsUsed != null && creditsUsed > 0 && (
                <>
                  <InfoCard label="Used" value={creditsUsed.toLocaleString()} />
                  <UsageBar used={creditsUsed} total={creditsTotal} />
                </>
              )}
            </View>
          )}
        </View>

        {/* Account info */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Account
          </Text>
          <InfoCard label="Email" value={email} />
          {(userQuery.data?.userId || resolvedUserId) && (
            <InfoCard label="User ID" value={userQuery.data?.userId || resolvedUserId || ''} />
          )}
          <View style={{ height: 8 }} />
        </View>

        {/* Signals */}
        <SignalsSection />

        {/* Sign out */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, marginBottom: 32 }}>
          Lusha ToGo v{Constants.expoConfig?.version ?? '?'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
