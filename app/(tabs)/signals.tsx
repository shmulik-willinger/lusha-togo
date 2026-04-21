import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Key, TrendingUp, TrendingDown, Users, Newspaper, Building2, Trophy, type LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSignalsStore, ReceivedSignal, StoredSubscription } from '../../src/store/signalsStore';
import { listSubscriptions, deleteSubscription } from '../../src/api/signals';
import { SignalsTeaser } from '../../src/components/signals/SignalsTeaser';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SIGNAL_LABELS: Record<string, string> = {
  companyChange: 'Changed jobs',
  promotion: 'Promoted',
  websiteTrafficIncrease: 'Website traffic ↑',
  websiteTrafficDecrease: 'Website traffic ↓',
  itSpendIncrease: 'IT spend ↑',
  itSpendDecrease: 'IT spend ↓',
  surgeInHiring: 'Surge in hiring',
  surgeInHiringByDepartment: 'Surge in hiring by dept',
  surgeInHiringByLocation: 'Surge in hiring by location',
  headcountIncrease1m: 'Headcount ↑ (1m)',
  headcountIncrease3m: 'Headcount ↑ (3m)',
  headcountIncrease6m: 'Headcount ↑ (6m)',
  headcountIncrease12m: 'Headcount ↑ (12m)',
  headcountDecrease1m: 'Headcount ↓ (1m)',
  headcountDecrease3m: 'Headcount ↓ (3m)',
  headcountDecrease6m: 'Headcount ↓ (6m)',
  headcountDecrease12m: 'Headcount ↓ (12m)',
  riskNews: 'Risk news',
  commercialActivityNews: 'Commercial activity',
  corporateStrategyNews: 'Corporate strategy',
  financialEventsNews: 'Financial events',
  peopleNews: 'People news',
  marketIntelligenceNews: 'Market intelligence',
  productActivityNews: 'Product activity',
  funding: 'Funding round',
  techAdoption: 'Tech adoption',
};

function signalIcon(type: string): LucideIcon {
  if (type.includes('Increase') || type.includes('increase') || type === 'funding') return TrendingUp;
  if (type.includes('Decrease') || type.includes('decrease')) return TrendingDown;
  if (type.includes('Hiring') || type.includes('hiring') || type.includes('headcount')) return Users;
  if (type.includes('News') || type.includes('news')) return Newspaper;
  if (type === 'companyChange') return Building2;
  if (type === 'promotion') return Trophy;
  return Bell;
}

function signalTitle(signal: ReceivedSignal): string {
  const label = SIGNAL_LABELS[signal.signalType] ?? signal.signalType;
  return `${signal.entityName} · ${label}`;
}

function signalDate(signal: ReceivedSignal): string {
  const d = signal.data ?? {};
  const raw = d.signalDate ?? signal.timestamp;
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function signalBody(signal: ReceivedSignal): string {
  const d = signal.data ?? {};
  switch (signal.signalType) {
    case 'companyChange':
      return [
        d.previousCompanyName && d.currentCompanyName
          ? `${d.previousCompanyName} → ${d.currentCompanyName}`
          : d.currentCompanyName,
        d.currentTitle,
      ].filter(Boolean).join(' · ');
    case 'promotion':
      return [d.currentTitle, d.currentSeniorityLabel ? `(${d.currentSeniorityLabel})` : null]
        .filter(Boolean).join(' ');
    case 'websiteTrafficIncrease':
    case 'websiteTrafficDecrease':
      return d.changeRatePercent != null ? `${Number(d.changeRatePercent) > 0 ? '+' : ''}${d.changeRatePercent}% vs historical avg` : '';
    case 'itSpendIncrease':
    case 'itSpendDecrease':
      return d.changeRatePercent != null ? `${Number(d.changeRatePercent) > 0 ? '+' : ''}${d.changeRatePercent}% spend change` : '';
    case 'surgeInHiring':
      return d.newJobsPostedLastWeek != null ? `${d.newJobsPostedLastWeek} new jobs posted` : '';
    case 'surgeInHiringByDepartment':
      return [d.department, d.newJobsPostedLastWeek ? `${d.newJobsPostedLastWeek} new jobs` : null].filter(Boolean).join(' · ');
    case 'surgeInHiringByLocation':
      return [d.location, d.newJobsPostedLastWeek ? `${d.newJobsPostedLastWeek} new jobs` : null].filter(Boolean).join(' · ');
    default:
      if (d.changeRatePercent != null) return `${Number(d.changeRatePercent) > 0 ? '+' : ''}${d.changeRatePercent}%`;
      if (d.newEmployeesCount != null && d.baselineEmployeesCount != null)
        return `${d.baselineEmployeesCount} → ${d.newEmployeesCount} employees`;
      return '';
  }
}

function navigateToEntity(signal: ReceivedSignal) {
  if (!signal.entityId) return;
  if (signal.entityType === 'company') {
    router.push(`/company/${signal.entityId}`);
  } else {
    router.push(`/contact/${signal.entityId}`);
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptySignals() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <Bell size={48} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#262626', textAlign: 'center', marginBottom: 8 }}>
        No signals yet
      </Text>
      <Text style={{ fontSize: 14, color: '#a3a3a3', textAlign: 'center', lineHeight: 20 }}>
        Open a contact or company and tap Show Signals or Register to start receiving signals.
      </Text>
    </View>
  );
}

function NoApiKey() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
      <Key size={48} color="#a3a3a3" strokeWidth={1.5} style={{ marginBottom: 12 }} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#262626', textAlign: 'center', marginBottom: 8 }}>
        Lusha API Key required
      </Text>
      <Text style={{ fontSize: 14, color: '#a3a3a3', textAlign: 'center', lineHeight: 20 }}>
        Go to Account → Signals → Set up Signals, and paste your Lusha API key.
      </Text>
    </View>
  );
}

function SourceBadge({ source }: { source: 'api' | 'webhook' }) {
  const isApi = source === 'api';
  return (
    <View style={{
      backgroundColor: isApi ? '#e0f2fe' : '#f3efff',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: isApi ? '#0284c7' : '#6f45ff' }}>
        {isApi ? 'API' : 'LIVE'}
      </Text>
    </View>
  );
}

function EntityAvatar({ signal }: { signal: ReceivedSignal }) {
  if (signal.logoUrl) {
    return (
      <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3efff', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
        <Image source={{ uri: signal.logoUrl }} style={{ width: 36, height: 36 }} resizeMode="contain" />
      </View>
    );
  }
  const initials = signal.entityType === 'contact'
    ? getInitials(signal.entityName ?? '')
    : (signal.entityName?.[0]?.toUpperCase() ?? '?');
  const fontSize = signal.entityType === 'contact' ? 12 : 15;
  return (
    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3efff', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
      <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize }}>{initials}</Text>
    </View>
  );
}

function SignalCard({ signal }: { signal: ReceivedSignal }) {
  const body = signalBody(signal);
  return (
    <TouchableOpacity
      onPress={() => navigateToEntity(signal)}
      activeOpacity={signal.entityId ? 0.75 : 1}
      style={{
        backgroundColor: signal.read ? '#fff' : '#f5f0ff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <EntityAvatar signal={signal} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#262626', flex: 1, marginRight: 8 }} numberOfLines={1}>
              {signalTitle(signal)}
            </Text>
            <Text style={{ fontSize: 11, color: '#a3a3a3', flexShrink: 0 }}>
              {signalDate(signal)}
            </Text>
          </View>
          {!!body && (
            <Text style={{ fontSize: 13, color: '#737373', lineHeight: 18 }} numberOfLines={2}>
              {body}
            </Text>
          )}
          {!!signal.entityId && (
            <Text style={{ fontSize: 11, color: '#6f45ff', marginTop: 4 }}>
              Tap to view {signal.entityType} →
            </Text>
          )}
        </View>
        {!signal.read && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6f45ff', marginLeft: 8, marginTop: 4 }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SubscriptionRow({ sub, onUnfollow }: { sub: StoredSubscription; onUnfollow: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
      <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#f3efff', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
        {sub.logoUrl ? (
          <Image source={{ uri: sub.logoUrl }} style={{ width: 36, height: 36 }} resizeMode="contain" />
        ) : (
          <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: sub.entityType === 'contact' ? 12 : 15 }}>
            {sub.entityType === 'contact' ? getInitials(sub.entityName ?? '') : (sub.entityName?.[0]?.toUpperCase() ?? '?')}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#262626' }} numberOfLines={1}>
          {sub.entityName}
        </Text>
        <Text style={{ fontSize: 12, color: '#a3a3a3', marginTop: 1 }}>
          {sub.entityType === 'contact' ? 'Contact' : 'Company'} · All Signals
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onUnfollow(sub.id)}
        style={{ backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
        activeOpacity={0.75}
      >
        <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>Unregister</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type Tab = 'activity' | 'following';

export default function SignalsScreen() {
  const { apiKey, signals, subscriptions, unreadCount, markAllRead, removeSubscription, setSubscriptions, clearSignals } = useSignalsStore();
  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!apiKey) return;
    setRefreshing(true);
    try {
      const remote = await listSubscriptions(apiKey);
      const merged = remote.map((r) => {
        const local = subscriptions.find((s) => s.id === r.id);
        return {
          id: r.id,
          entityId: r.entityId,
          entityType: (r.entityType === 'company' ? 'company' : 'contact') as 'contact' | 'company',
          entityName: local?.entityName ?? ((r.name ?? '').replace(/\s*—\s*Lusha ToGo\s*$/i, '') || r.entityId),
          signalTypes: r.signalTypes,
          createdAt: r.createdAt ?? new Date().toISOString(),
          logoUrl: local?.logoUrl,
        };
      });
      await setSubscriptions(merged);
    } catch (e: any) {
      console.log('[signals] refresh error:', e?.message);
    } finally {
      setRefreshing(false);
    }
  }, [apiKey, subscriptions]);

  const handleUnregister = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    Alert.alert(
      'Unregister',
      `Stop receiving signal notifications for ${sub?.entityName ?? 'this entity'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            if (!apiKey) return;
            try { await deleteSubscription(id, apiKey); } catch (e: any) {
              console.log('[signals] delete sub error:', e?.message);
            }
            await removeSubscription(id);
          },
        },
      ],
    );
  };

  const onActivityTabPress = () => {
    setActiveTab('activity');
    if (unreadCount > 0) markAllRead();
  };

  if (!apiKey) {
    return (
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
        <SignalsTeaser onActivate={() => router.push('/(tabs)/account' as never)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      {/* Inner tab bar */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <TouchableOpacity
          onPress={onActivityTabPress}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'activity' ? '#6f45ff' : 'transparent' }}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === 'activity' ? '#6f45ff' : '#737373' }}>
              Activity
            </Text>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: '#6f45ff', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('following')}
          style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'following' ? '#6f45ff' : 'transparent' }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === 'following' ? '#6f45ff' : '#737373' }}>
            Registered ({subscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6f45ff" />}
      >
        {activeTab === 'activity' ? (
          signals.length === 0 ? <EmptySignals /> : (
            <View style={{ backgroundColor: '#fff', marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
                <TouchableOpacity
                  onPress={() => Alert.alert('Clear Activity', 'Remove all signals from Activity?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => clearSignals() },
                  ])}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 13, color: '#dc2626', fontWeight: '500' }}>Clear all</Text>
                </TouchableOpacity>
              </View>
              {[...signals]
                .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
                .map((signal) => <SignalCard key={signal.id} signal={signal} />)}
            </View>
          )
        ) : (
          subscriptions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👁️</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#262626', textAlign: 'center', marginBottom: 8 }}>
                Not registered to anything yet
              </Text>
              <Text style={{ fontSize: 14, color: '#a3a3a3', textAlign: 'center', lineHeight: 20 }}>
                Open a contact or company page and tap Register to receive live push notifications.
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#fff', marginTop: 8 }}>
              {subscriptions.map((sub) => (
                <SubscriptionRow key={sub.id} sub={sub} onUnfollow={handleUnregister} />
              ))}
            </View>
          )
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
