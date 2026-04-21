import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Bell, Moon, HelpCircle, LogOut } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '../../src/api/auth';
import { logout } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Avatar } from '../../src/components/ui/Avatar';
import { CreditsHero } from '../../src/components/account/CreditsHero';
import { SignalsStatusRow } from '../../src/components/account/SignalsStatusRow';
import { AppearanceSheet } from '../../src/components/account/AppearanceSheet';
import { SettingsGroup, type SettingsRow } from '../../src/components/ui/SettingsGroup';
import { Section } from '../../src/components/ui/Section';
import { useSignalsStore } from '../../src/store/signalsStore';
import { useTheme } from '../../src/theme/ThemeProvider';
import { color as staticColor, radius } from '../../src/theme/tokens';

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

function firstOfNextMonth(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function computeDailyPace(used: number): number {
  const now = new Date();
  const day = now.getDate();
  if (day < 1) return 0;
  return Math.round(used / day);
}

function SignalsSetupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { apiKey, setApiKey } = useSignalsStore();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditing(!apiKey);
      setDraft('');
    }
  }, [visible, apiKey]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    await setApiKey(trimmed);
    setEditing(false);
    onClose();
  };

  const handleRemove = () => {
    Alert.alert('Remove API Key', 'This will disable Signals notifications until you add a key again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await setApiKey(''); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }} onPress={(e) => e.stopPropagation()}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1DB', alignSelf: 'center', marginBottom: 14 }} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: staticColor.ink, marginBottom: 8 }}>Signals Setup</Text>
          <Text style={{ fontSize: 12, color: staticColor.muted, marginBottom: 14 }}>
            Find your API key in Lusha dashboard → Settings → API Keys
          </Text>

          {editing ? (
            <>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Paste your Lusha API key"
                placeholderTextColor={staticColor.muted2}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={{ borderWidth: 1, borderColor: staticColor.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: staticColor.ink, marginBottom: 10 }}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handleSave} style={{ flex: 1, backgroundColor: staticColor.brand, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' }} activeOpacity={0.85}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditing(false)} style={{ flex: 1, backgroundColor: staticColor.line, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' }} activeOpacity={0.85}>
                  <Text style={{ color: staticColor.muted, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text style={{ color: staticColor.muted, fontSize: 14 }}>API Key</Text>
                <Text style={{ color: staticColor.ink, fontWeight: '600', fontSize: 14 }}>••••{apiKey.slice(-4)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity onPress={() => setEditing(true)} style={{ flex: 1, backgroundColor: staticColor.brandTint, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' }} activeOpacity={0.85}>
                  <Text style={{ color: staticColor.brand, fontWeight: '700', fontSize: 13 }}>Change Key</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRemove} style={{ flex: 1, backgroundColor: staticColor.dangerTint, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' }} activeOpacity={0.85}>
                  <Text style={{ color: staticColor.danger, fontWeight: '700', fontSize: 13 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function AccountScreen() {
  const { session, clearSession, updateCredits } = useAuthStore();
  const { apiKey, subscriptions } = useSignalsStore();
  const { color, pref, setPref } = useTheme();
  const [signalsModalOpen, setSignalsModalOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

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
  const creditsUsed = session?.creditsUsed ?? 0;
  const creditsTotal = session?.creditsTotal ?? 0;

  const appearanceLabel = pref === 'system' ? 'System' : pref === 'dark' ? 'Dark' : 'Light';

  const settingsRows: SettingsRow[] = [
    {
      icon: Bell,
      label: 'Notifications',
      value: apiKey ? 'On' : 'Off',
      onPress: () => setSignalsModalOpen(true),
    },
    {
      icon: Moon,
      label: 'Appearance',
      value: appearanceLabel,
      onPress: () => setAppearanceOpen(true),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Visit docs.lusha.com or contact support@lusha.com'),
    },
    {
      icon: LogOut,
      label: 'Sign out',
      danger: true,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: color.canvas, direction: 'ltr' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile header */}
        <View style={{ backgroundColor: color.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={fullName || '?'} size={56} />
            <View style={{ flex: 1 }}>
              {userQuery.isLoading ? (
                <>
                  <Skeleton width="55%" height={18} />
                  <View style={{ marginTop: 8 }}><Skeleton width="70%" height={13} /></View>
                </>
              ) : (
                <>
                  <Text style={{ color: color.ink, fontWeight: '800', fontSize: 18, letterSpacing: -0.3 }}>{fullName || 'Account'}</Text>
                  <Text style={{ color: color.muted, fontSize: 12, marginTop: 3 }} numberOfLines={1}>{email}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Credits Hero */}
        {creditsTotal > 0 && (
          <CreditsHero
            used={creditsUsed}
            total={creditsTotal}
            resetsOn={firstOfNextMonth()}
            dailyPace={computeDailyPace(creditsUsed)}
          />
        )}

        {/* Signals status */}
        <SignalsStatusRow
          connected={!!apiKey}
          entityCount={subscriptions.length}
          maskedKey={apiKey ? `••••${apiKey.slice(-4)}` : undefined}
          onPress={() => setSignalsModalOpen(true)}
        />

        {/* Settings */}
        <Section title="Settings" />
        <SettingsGroup rows={settingsRows} />

        {/* Version */}
        <Text style={{ textAlign: 'center', color: color.muted2, fontSize: 12, marginTop: 24 }}>
          Lusha ToGo v{Constants.expoConfig?.version ?? '?'}
        </Text>
      </ScrollView>

      <SignalsSetupModal visible={signalsModalOpen} onClose={() => setSignalsModalOpen(false)} />
      <AppearanceSheet
        visible={appearanceOpen}
        value={pref}
        onChange={setPref}
        onClose={() => setAppearanceOpen(false)}
      />
    </SafeAreaView>
  );
}
