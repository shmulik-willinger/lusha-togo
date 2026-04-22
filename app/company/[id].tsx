import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Mail, Globe, AtSign, Rocket, ChevronRight, Lock, BellRing, BellOff, Star, CheckCircle2 } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { SearchCompany, searchProspects, SearchContact } from '../../src/api/search';
import { CompanyNameOption } from '../../src/api/filters';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useCompanyStore } from '../../src/store/companyStore';
import { useContactStore } from '../../src/store/contactStore';
import { revealContact } from '../../src/api/contacts';
import { useMutation } from '@tanstack/react-query';
import { useSignalsStore } from '../../src/store/signalsStore';
import { createSubscription, deleteSubscription, listAllSubscriptions, reactivateSubscription, getCompanySignals, LushaSignalEvent } from '../../src/api/signals';
import { useAuthStore } from '../../src/store/authStore';
import { resolveUserId } from '../../src/utils/session';
import { CompanyHero } from '../../src/components/company/CompanyHero';
import { DecisionMakerRow } from '../../src/components/company/DecisionMakerRow';
import { CollapsibleSection } from '../../src/components/ui/CollapsibleSection';
import { AppDialog } from '../../src/components/ui/AppDialog';
import { color } from '../../src/theme/tokens';
import { ReceivedSignal } from '../../src/store/signalsStore';

function formatSignalDate(ts?: string): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function LatestSignalsForEntity({ entityId, getLabel, getDetail }: {
  entityId: string;
  getLabel: (type: string) => string;
  getDetail: (data: Record<string, any>, type: string) => string;
}) {
  const storeSignals = useSignalsStore((s) => s.signals);
  const relevant = storeSignals
    .filter((s) => String(s.entityId) === String(entityId))
    .slice(0, 3);
  if (relevant.length === 0) return null;
  return (
    <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: color.muted, textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 8 }}>
        Recent Signals · {relevant.length}
      </Text>
      {relevant.map((s, i) => (
        <View key={s.id ?? i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < relevant.length - 1 ? 1 : 0, borderBottomColor: '#F3F3F5' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: color.ink }}>{getLabel(s.signalType)}</Text>
            </View>
            {!!getDetail(s.data ?? {}, s.signalType) && (
              <Text style={{ fontSize: 12, color: color.muted, marginTop: 2 }}>{getDetail(s.data ?? {}, s.signalType)}</Text>
            )}
          </View>
          <Text style={{ fontSize: 11, color: color.muted2, marginLeft: 8 }}>
            {formatSignalDate(s.data?.signalDate ?? s.timestamp)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
      <Text style={{ color: '#a3a3a3', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#262626', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 }}>{value}</Text>
    </View>
  );
}

function LinkedInBadge() {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: '#0077B5', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 14 }}>in</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}
      activeOpacity={0.7}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{typeof icon === 'string' ? <Text style={{ fontSize: 18 }}>{icon}</Text> : icon}</View>
      <Text style={{ flex: 1, marginLeft: 8, color: '#6f45ff', fontWeight: '500', fontSize: 14 }}>{label}</Text>
      <ChevronRight size={18} color="#a3a3a3" strokeWidth={1.75} />
    </TouchableOpacity>
  );
}

async function openLinkedInCompany(linkedinUrl: string) {
  const slug = linkedinUrl.replace(/.*\/company\//, '').replace(/\/$/, '');
  const appUrl = `linkedin://company/${slug}`;
  const canOpen = await Linking.canOpenURL(appUrl);
  if (canOpen) {
    Linking.openURL(appUrl);
  } else {
    WebBrowser.openBrowserAsync(
      linkedinUrl.startsWith('http') ? linkedinUrl : `https://linkedin.com/company/${slug}`,
    );
  }
}

function DecisionMakerCard({ contact }: { contact: SearchContact }) {
  const setSelectedContact = useContactStore((s) => s.setSelectedContact);
  const [revealed, setRevealed] = React.useState(contact.isShown ?? false);
  const [restrictedOpen, setRestrictedOpen] = React.useState(false);
  const [revealErrorMsg, setRevealErrorMsg] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState(
    contact.phones?.find((p) => !p.is_do_not_call)?.normalized_number ??
    contact.phones?.find((p) => !p.is_do_not_call)?.number
  );

  const revealMutation = useMutation({
    mutationFn: () => revealContact(contact),
    onSuccess: (data: any) => {
      const items: any[] = data?.contacts ?? data?.data?.data?.contacts ?? data?.data?.contacts ?? [];
      const item = items[0];
      if (item?.phones?.length) {
        const p = item.phones[0];
        setPhone(p.value ?? p.number ?? p.normalized_number);
      }
      setRevealed(true);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const body = err?.response?.data;
      console.log('[DM reveal-error]', status, JSON.stringify(body).substring(0, 200));
      if (status === 403) {
        setRestrictedOpen(true);
      } else {
        const msg = body?.message || err?.message || 'Could not reveal this contact. Please try again.';
        setRevealErrorMsg(msg);
      }
    },
  });

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handlePress = () => {
    setSelectedContact(contact);
    router.push(`/contact/${contact.contactId}`);
  };

  return (
    <>
      <DecisionMakerRow
        contact={{
          id: contact.contactId,
          name: contact.name.full,
          role: contact.job_title?.title,
          seniority: contact.job_title?.seniority,
          revealed,
          live: false,
          phoneNumber: phone,
        }}
        loading={revealMutation.isPending}
        onCall={handleCall}
        onReveal={() => revealMutation.mutate()}
        onPress={handlePress}
      />
      <AppDialog
        visible={restrictedOpen}
        tone="warning"
        icon={Lock}
        title="Contact Info is Protected"
        message={`Your account doesn't have access to ${contact.name.full}'s contact info. Upgrade your plan to unlock access.`}
        primary={{ label: 'Got it' }}
        onClose={() => setRestrictedOpen(false)}
      />
      <AppDialog
        visible={!!revealErrorMsg}
        tone="danger"
        title="Reveal failed"
        message={revealErrorMsg ?? ''}
        primary={{ label: 'OK' }}
        onClose={() => setRevealErrorMsg(null)}
      />
    </>
  );
}

function signalLabel(type: string): string {
  const labels: Record<string, string> = {
    companyChange: 'Employee changed jobs',
    promotion: 'Employee promoted',
    websiteTrafficIncrease: 'Website traffic increase',
    websiteTrafficDecrease: 'Website traffic decrease',
    itSpendIncrease: 'IT spend increase',
    itSpendDecrease: 'IT spend decrease',
    surgeInHiring: 'Surge in hiring',
    surgeInHiringByDepartment: 'Surge in hiring by dept',
    surgeInHiringByLocation: 'Surge in hiring by location',
    headcountIncrease1m: 'Headcount increase (1m)',
    headcountIncrease3m: 'Headcount increase (3m)',
    headcountIncrease6m: 'Headcount increase (6m)',
    headcountIncrease12m: 'Headcount increase (12m)',
    headcountDecrease1m: 'Headcount decrease (1m)',
    headcountDecrease3m: 'Headcount decrease (3m)',
    headcountDecrease6m: 'Headcount decrease (6m)',
    headcountDecrease12m: 'Headcount decrease (12m)',
    riskNews: 'Risk news',
    commercialActivityNews: 'Commercial activity',
    corporateStrategyNews: 'Corporate strategy',
    financialEventsNews: 'Financial events',
    peopleNews: 'People news',
    marketIntelligenceNews: 'Market intelligence',
    productActivityNews: 'Product activity',
    funding: 'Funding',
    techAdoption: 'Tech adoption',
  };
  return labels[type] ?? type;
}

function signalDetail(s: LushaSignalEvent): string {
  const d = s.data ?? {};
  switch (s.signalType) {
    case 'companyChange':
      return [
        d.previousCompanyName && d.currentCompanyName ? `${d.previousCompanyName} → ${d.currentCompanyName}` : d.currentCompanyName,
        d.currentTitle,
      ].filter(Boolean).join(' · ');
    case 'promotion':
      return [d.currentTitle, d.currentSeniorityLabel ? `(${d.currentSeniorityLabel})` : null].filter(Boolean).join(' ');
    case 'websiteTrafficIncrease':
    case 'websiteTrafficDecrease':
      return d.changeRatePercent ? `${d.changeRatePercent > 0 ? '+' : ''}${d.changeRatePercent}% vs avg` : '';
    case 'itSpendIncrease':
    case 'itSpendDecrease':
      return d.changeRatePercent ? `${d.changeRatePercent > 0 ? '+' : ''}${d.changeRatePercent}% change` : '';
    case 'surgeInHiring':
    case 'surgeInHiringByDepartment':
    case 'surgeInHiringByLocation':
      return d.newJobs ? `${d.newJobs} new jobs` : '';
    default:
      return d.changeRatePercent ? `${d.changeRatePercent > 0 ? '+' : ''}${d.changeRatePercent}%` : d.currentTitle ?? '';
  }
}

function CompanySignalsSection({ company }: { company: SearchCompany }) {
  const { apiKey, addSignal, isFollowing, addSubscription, removeSubscription, subscriptions } = useSignalsStore();
  const { session } = useAuthStore();
  const entityId = company.company_id || company.company_lid;
  const following = entityId ? isFollowing(entityId, company.name, 'company') : false;
  const resolvedUserId = resolveUserId(session);

  const [showLoading, setShowLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [signals, setSignals] = useState<LushaSignalEvent[]>([]);
  const [showError, setShowError] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  // Dialog state
  type DialogState =
    | { kind: 'registered' }
    | { kind: 'error'; message: string }
    | { kind: 'confirmUnregister'; onConfirm: () => void }
    | null;
  const [dialog, setDialog] = useState<DialogState>(null);

  if (!apiKey || !entityId) return null;

  const handleShow = async () => {
    setShowLoading(true);
    setShowError(null);
    try {
      const results = await getCompanySignals(entityId, apiKey);
      setSignals(results);
      setShown(true);
      for (const s of results) {
        await addSignal({
          id: `api-${entityId}-${s.signalType}-${s.signalDate ?? 'nodate'}`,
          timestamp: new Date().toISOString(),
          entityName: company.name,
          entityId,
          entityType: 'company',
          signalType: s.signalType,
          data: s.data,
          read: true,
          source: 'api',
          logoUrl: company.logo_url,
        });
      }
    } catch (e: any) {
      setShowError(e?.response?.data?.message ?? e?.message ?? 'Could not fetch signals.');
    } finally {
      setShowLoading(false);
    }
  };

  const handleRegister = async () => {
    if (following) {
      const sub = subscriptions.find((s) => s.entityId === entityId);
      if (!sub) return;
      setDialog({
        kind: 'confirmUnregister',
        onConfirm: async () => {
          setRegisterLoading(true);
          try { await deleteSubscription(sub.id, apiKey); } catch {}
          await removeSubscription(sub.id);
          setRegisterLoading(false);
        },
      });
      return;
    }
    if (!resolvedUserId) {
      setDialog({ kind: 'error', message: 'Could not resolve your user ID. Please log out and log in again.' });
      return;
    }
    setRegisterLoading(true);
    try {
      const result = await createSubscription({
        entityId, entityType: 'company', entityName: company.name, apiKey, userId: resolvedUserId,
      });
      await addSubscription({
        id: result.id, entityId, entityType: 'company', entityName: company.name,
        signalTypes: result.signalTypes, createdAt: result.createdAt ?? new Date().toISOString(),
        logoUrl: company.logo_url,
      });
      setDialog({ kind: 'registered' });
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? '';
      if (msg.toLowerCase().includes('already exists')) {
        try {
          const subs = await listAllSubscriptions(apiKey);
          const existing = subs.find((s: any) => String(s.entityId) === String(entityId));
          if (existing) {
            await reactivateSubscription(existing.id, apiKey);
            await addSubscription({
              id: existing.id, entityId, entityType: 'company', entityName: company.name,
              signalTypes: existing.signalTypes ?? [], createdAt: existing.createdAt ?? new Date().toISOString(),
              logoUrl: company.logo_url,
            });
            setDialog({ kind: 'registered' });
            return;
          }
        } catch {}
      }
      setDialog({ kind: 'error', message: msg || 'Could not register.' });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 12 }}>
        Signals
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: shown && signals.length > 0 ? 12 : 4 }}>
        <TouchableOpacity
          onPress={handleShow}
          disabled={showLoading}
          style={{ flex: 1, backgroundColor: '#f3efff', borderRadius: 10, paddingVertical: 11, alignItems: 'center', opacity: showLoading ? 0.7 : 1 }}
          activeOpacity={0.85}
        >
          {showLoading
            ? <ActivityIndicator size="small" color="#6f45ff" />
            : <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: 14 }}>Show Signals</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={registerLoading}
          style={{ flex: 1, backgroundColor: following ? '#fee2e2' : '#6f45ff', borderRadius: 10, paddingVertical: 11, alignItems: 'center', opacity: registerLoading ? 0.7 : 1 }}
          activeOpacity={0.85}
        >
          {registerLoading
            ? <ActivityIndicator size="small" color={following ? '#dc2626' : '#fff'} />
            : <Text style={{ color: following ? '#dc2626' : '#fff', fontWeight: '700', fontSize: 14 }}>
                {following ? 'Unregister' : 'Register'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {showError && <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{showError}</Text>}

      {shown && signals.length === 0 && !showError && (
        <Text style={{ color: '#a3a3a3', fontSize: 13, paddingBottom: 12 }}>No signals found for this company.</Text>
      )}
      {signals.map((s, i) => (
        <View key={i} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#262626' }}>{signalLabel(s.signalType)}</Text>
            {s.signalDate && (
              <Text style={{ fontSize: 11, color: '#a3a3a3' }}>{new Date(s.signalDate).toLocaleDateString()}</Text>
            )}
          </View>
          {!!signalDetail(s) && (
            <Text style={{ fontSize: 12, color: '#737373', marginTop: 3 }}>{signalDetail(s)}</Text>
          )}
        </View>
      ))}

      {following && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8, paddingTop: signals.length > 0 ? 4 : 0 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
          <Text style={{ fontSize: 12, color: '#737373' }}>Registered — All Signals</Text>
        </View>
      )}

      <AppDialog
        visible={dialog?.kind === 'registered'}
        tone="success"
        icon={BellRing}
        title="Registered!"
        message={`You'll receive push notifications when there are signals for ${company.name}.`}
        primary={{ label: 'Done' }}
        onClose={() => setDialog(null)}
      />
      <AppDialog
        visible={dialog?.kind === 'error'}
        tone="danger"
        title="Something went wrong"
        message={dialog?.kind === 'error' ? dialog.message : ''}
        primary={{ label: 'OK' }}
        onClose={() => setDialog(null)}
      />
      <AppDialog
        visible={dialog?.kind === 'confirmUnregister'}
        tone="warning"
        icon={BellOff}
        title="Unregister signals?"
        message={`Stop receiving signal notifications for ${company.name}?`}
        primary={{ label: 'Unregister', onPress: () => dialog?.kind === 'confirmUnregister' && dialog.onConfirm() }}
        secondary={{ label: 'Cancel' }}
        destructive
        onClose={() => setDialog(null)}
      />
    </View>
  );
}

function FollowCompanyButton({ company }: { company: SearchCompany }) {
  const { apiKey, isFollowing, addSubscription, removeSubscription, subscriptions } = useSignalsStore();
  const { session } = useAuthStore();
  const entityId = company.company_id || company.company_lid;
  const following = entityId ? isFollowing(entityId, company.name, 'company') : false;
  const [loading, setLoading] = useState(false);
  const [confirmUnfollow, setConfirmUnfollow] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resolvedUserId = resolveUserId(session);

  if (!entityId || !apiKey || !resolvedUserId) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      const result = await createSubscription({
        entityId,
        entityType: 'company',
        entityName: company.name,
        apiKey,
        userId: resolvedUserId,
      });
      await addSubscription({
        id: result.id,
        entityId,
        entityType: 'company',
        entityName: company.name,
        signalTypes: result.signalTypes,
        createdAt: result.createdAt ?? new Date().toISOString(),
        logoUrl: company.logo_url,
      });
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? '';
      // Backend already has this subscription (e.g. after logout cleared the
      // local mirror, or an old subscription the API doesn't return in GET).
      // Treat this as success: register a local stub with a temporary id so
      // the button flips to "✓ Following" immediately. The real id will be
      // synced the next time the user pulls-to-refresh the Signals tab.
      if (msg.toLowerCase().includes('already exists')) {
        try {
          // Best-effort: look it up, reactivate, and use the real id.
          const subs = await listAllSubscriptions(apiKey);
          const existing = subs.find((s: any) => String(s.entityId) === String(entityId));
          if (existing) {
            try { await reactivateSubscription(existing.id, apiKey); } catch {}
            await addSubscription({
              id: existing.id,
              entityId,
              entityType: 'company',
              entityName: company.name,
              signalTypes: existing.signalTypes ?? [],
              createdAt: existing.createdAt ?? new Date().toISOString(),
              logoUrl: company.logo_url,
            });
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }

        // Fallback: add a local stub so the UI is honest about what's live
        // on the server. Pull-to-refresh on Signals > Registered replaces it.
        await addSubscription({
          id: `stub-${entityId}`,
          entityId,
          entityType: 'company',
          entityName: company.name,
          signalTypes: [],
          createdAt: new Date().toISOString(),
          logoUrl: company.logo_url,
        });
        setLoading(false);
        return;
      }
      setErrorMsg(msg || 'Could not follow company.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = () => {
    // Match by entityId OR by (type+name) — see isFollowing for context
    const cleanName = company.name.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase();
    const sub = subscriptions.find((s) => s.entityId === entityId)
      ?? subscriptions.find((s) => s.entityType === 'company' &&
           s.entityName.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase() === cleanName);
    if (!sub) return;
    setConfirmUnfollow(true);
  };

  const performUnfollow = async () => {
    const cleanName = company.name.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase();
    const sub = subscriptions.find((s) => s.entityId === entityId)
      ?? subscriptions.find((s) => s.entityType === 'company' &&
           s.entityName.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase() === cleanName);
    if (!sub) return;
    setLoading(true);
    try { await deleteSubscription(sub.id, apiKey); } catch (e: any) {
      console.log('[follow-company] delete error:', e?.message);
    }
    await removeSubscription(sub.id);
    setLoading(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={following ? handleUnfollow : handleFollow}
        disabled={loading}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: following ? '#f3efff' : '#6f45ff',
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 16,
          opacity: loading ? 0.6 : 1,
          alignSelf: 'flex-start',
          marginTop: 8,
        }}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator size="small" color={following ? '#6f45ff' : '#fff'} />
          : <Text style={{ fontSize: 13, color: following ? '#6f45ff' : '#fff', fontWeight: '600' }}>
              {following ? '✓ Following' : '+ Follow'}
            </Text>
        }
      </TouchableOpacity>

      <AppDialog
        visible={confirmUnfollow}
        tone="warning"
        icon={Star}
        title="Unfollow?"
        message={`Stop following ${company.name}? You won't receive signal notifications anymore.`}
        primary={{ label: 'Unfollow', onPress: performUnfollow }}
        secondary={{ label: 'Cancel' }}
        destructive
        onClose={() => setConfirmUnfollow(false)}
      />
      <AppDialog
        visible={!!errorMsg}
        tone="danger"
        title="Something went wrong"
        message={errorMsg ?? ''}
        primary={{ label: 'OK' }}
        onClose={() => setErrorMsg(null)}
      />
    </>
  );
}

export default function CompanyDetailScreen() {
  const storedCompany = useCompanyStore((s) => s.selectedCompany);

  // Decision Makers query: try structured companyName filter first, then fall
  // back to free-text search if the structured call returns no contacts. Some
  // companies (e.g. AbbVie) have data in prospecting but only match via the
  // dashboard's free-text search, not via the structured filter.
  // Quota-exceeded errors are swallowed here so the rest of the page still
  // renders — the main Search tab surfaces the dedicated quota UI already.
  const { data: dmData, isLoading: dmLoading, error: dmError } = useQuery({
    queryKey: ['company-contacts', storedCompany?.name],
    queryFn: async () => {
      const name = storedCompany!.name;
      try {
        const byFilter = await searchProspects({
          filters: { companyName: [{ name } as CompanyNameOption] },
          pageSize: 5,
          tab: 'contacts',
        });
        if ((byFilter.contacts?.length ?? 0) > 0) return byFilter;
      } catch (e: any) {
        if (e?.quotaExceeded) return { contacts: [], companies: [], total: 0, page: 1, hasMore: false, _quotaExceeded: true };
        throw e;
      }
      try {
        return await searchProspects({
          searchText: name,
          pageSize: 5,
          tab: 'contacts',
        });
      } catch (e: any) {
        if (e?.quotaExceeded) return { contacts: [], companies: [], total: 0, page: 1, hasMore: false, _quotaExceeded: true };
        throw e;
      }
    },
    enabled: !!storedCompany?.name,
    staleTime: 10 * 60 * 1000,
    retry: false, // don't retry quota errors
  });
  const dmQuotaExceeded = (dmData as any)?._quotaExceeded === true;

  // Enrich with the prospecting search so every entry point (Search, Lists,
  // Recommendations, Signals) gets the same rich page. Strategy: try the
  // structured `companyName` filter first; some company names (e.g. AbbVie)
  // return zero hits via the structured filter, so we fall back to free-text
  // `searchText` which is the same path the dashboard uses.
  const enrichCompanyLid = (() => {
    if (!storedCompany?.company_lid) return undefined;
    const n = Number(storedCompany.company_lid);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  })();
  const enrichQueryKey = ['company-enrich', storedCompany?.company_lid ?? '', storedCompany?.name ?? ''];
  const { data: enrichSearch } = useQuery({
    queryKey: enrichQueryKey,
    queryFn: async () => {
      const name = storedCompany!.name;
      try {
        const byFilter = await searchProspects({
          filters: {
            companyName: [{
              name,
              ...(enrichCompanyLid != null ? { company_lid: enrichCompanyLid } : {}),
            } as CompanyNameOption],
          },
          pageSize: 1,
          tab: 'companies',
        });
        if ((byFilter.companies?.length ?? 0) > 0) return byFilter;
      } catch (e: any) {
        if (e?.quotaExceeded) return { contacts: [], companies: [], total: 0, page: 1, hasMore: false };
        throw e;
      }
      // 2nd attempt: free-text search — more forgiving, mirrors dashboard behavior
      try {
        return await searchProspects({
          searchText: name,
          pageSize: 1,
          tab: 'companies',
        });
      } catch (e: any) {
        if (e?.quotaExceeded) return { contacts: [], companies: [], total: 0, page: 1, hasMore: false };
        throw e;
      }
    },
    enabled: !!storedCompany?.name,
    staleTime: 30 * 60 * 1000,
    retry: false, // don't burn retries on quota errors
  });

  if (!storedCompany) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
        <Stack.Screen options={{ title: 'Company' }} />
        <CompanyDetailSkeleton />
      </SafeAreaView>
    );
  }

  // Merge enriched search data into stored data.
  //
  // Different entry points give us different shapes of `storedCompany`:
  //   - Search:          full SearchCompany (from /prospecting-search)
  //   - List detail:     full SearchCompany
  //   - Recommendations: PARTIAL — only primary_industry / min-max size / city
  //   - Signals tap:     MINIMAL — just name + logo + id
  //
  // To make every entry point render the same rich page, we prefer
  // `enrichSearch` values when they're present (it re-fetches the same
  // prospecting endpoint that Search uses), and fall back to the stored
  // value only when enrichSearch didn't return this field.
  const e = enrichSearch?.companies?.[0];
  const company: SearchCompany = {
    ...storedCompany,
    // Prefer enrichSearch for rich object fields so partial data from
    // Recommendations doesn't mask the full prospecting payload.
    industry: e?.industry ?? storedCompany.industry,
    company_size: e?.company_size ?? storedCompany.company_size,
    location: e?.location ?? storedCompany.location,
    social: e?.social ?? storedCompany.social,
    homepage_url: e?.homepage_url ?? storedCompany.homepage_url,
    description: e?.description ?? storedCompany.description,
    revenue_range: e?.revenue_range ?? storedCompany.revenue_range,
    founded: e?.founded ?? storedCompany.founded,
    secondary_industry: e?.secondary_industry ?? storedCompany.secondary_industry,
    specialties: e?.specialties ?? storedCompany.specialties,
    linkedin_followers: e?.linkedin_followers ?? storedCompany.linkedin_followers,
    sic: e?.sic ?? storedCompany.sic,
    naics: e?.naics ?? storedCompany.naics,
    funding_rounds: e?.funding_rounds ?? storedCompany.funding_rounds,
    funding_summary: e?.funding_summary ?? storedCompany.funding_summary,
    logo_url: storedCompany.logo_url ?? e?.logo_url, // prefer original logo we already showed
  };

  const sizeLabel = company.company_size?.min != null && company.company_size?.max != null
    ? `${company.company_size.min.toLocaleString()}–${company.company_size.max.toLocaleString()}`
    : company.company_size?.employees_in_linkedin
    ? company.company_size.employees_in_linkedin.toLocaleString()
    : null;

  const decisionMakers = dmData?.contacts?.slice(0, 5) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <Stack.Screen options={{ title: company.name }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — new CompanyHero */}
        <View style={{ marginBottom: 8 }}>
          <CompanyHero
            name={company.name}
            industry={company.industry?.primary_industry}
            location={[company.location?.city, company.location?.country].filter(Boolean).join(', ') || undefined}
            domain={company.homepage_url ? company.homepage_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : undefined}
            logoUrl={company.logo_url}
            stats={{
              employees: sizeLabel ?? undefined,
              revenue: company.revenue_range?.string,
              headcountDelta: undefined,
            }}
          />
          {company.description && (
            <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ color: color.muted, fontSize: 13, lineHeight: 19 }} numberOfLines={4}>
                {company.description}
              </Text>
            </View>
          )}
          <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 16 }}>
            <FollowCompanyButton company={company} />
          </View>
        </View>

        {/* Recent signals from local store (shown when navigated from Activity) */}
        <LatestSignalsForEntity
          entityId={String(company.company_id || company.company_lid || '')}
          getLabel={signalLabel}
          getDetail={(data, type) => signalDetail({ data, signalType: type } as LushaSignalEvent)}
        />

        {/* Decision Makers — only render the section when we have something
            to show (loading, a quota message, or results). When prospecting
            returns zero hits for a small/masked company, hide the section
            entirely so the page doesn't look half-broken. */}
        {(dmLoading || decisionMakers.length > 0 || dmQuotaExceeded) && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: color.muted, textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 8 }}>
              Decision Makers {decisionMakers.length > 0 ? `· ${decisionMakers.length}` : ''}
            </Text>
            {dmLoading ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={color.brand} />
              </View>
            ) : dmQuotaExceeded ? (
              <Text style={{ color: color.muted, fontSize: 13, paddingVertical: 12, lineHeight: 18 }}>
                Daily search limit reached. Decision makers will appear after the quota resets.
              </Text>
            ) : (
              decisionMakers.map((c) => (
                <DecisionMakerCard key={c.contactId} contact={c} />
              ))
            )}
            <View style={{ height: 8 }} />
          </View>
        )}

        {/* Company Info — collapsed by default */}
        <View style={{ marginBottom: 8 }}>
          <CollapsibleSection title="Company Info" initiallyCollapsed>
            {company.industry?.primary_industry && (
              <StatRow label="Primary industry" value={company.industry.primary_industry} />
            )}
            {company.secondary_industry && (
              <StatRow label="Secondary industry" value={company.secondary_industry} />
            )}
            {sizeLabel && <StatRow label="Employees" value={`${sizeLabel}`} />}
            {company.revenue_range?.string && (
              <StatRow label="Revenue" value={company.revenue_range.string} />
            )}
            {company.founded && <StatRow label="Founded" value={String(company.founded)} />}
            {company.linkedin_followers != null && (
              <StatRow label="LinkedIn followers" value={
                company.linkedin_followers >= 1_000_000
                  ? `${(company.linkedin_followers / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
                  : company.linkedin_followers >= 1_000
                  ? `${Math.round(company.linkedin_followers / 1000)}K`
                  : String(company.linkedin_followers)
              } />
            )}
            {company.sic && <StatRow label="SIC" value={company.sic} />}
            {company.naics && <StatRow label="NAICS" value={company.naics} />}
            {(company.specialties?.length ?? 0) > 0 && (
              <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
                <Text style={{ color: color.muted, fontSize: 13, marginBottom: 8 }}>Specialties</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {company.specialties!.map((s, i) => (
                    <View key={i} style={{ backgroundColor: color.line, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 12, color: color.ink }}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* Signals */}
        <CompanySignalsSection company={company} />

        {/* Links */}
        {(company.homepage_url || company.social?.linkedin || company.social?.twitter || company.social?.crunchbase) && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Links
            </Text>
            {company.homepage_url && (
              <LinkRow
                icon={<Globe size={18} color="#525252" strokeWidth={1.75} />}
                label={company.homepage_url}
                onPress={() => {
                  const url = company.homepage_url!.startsWith('http')
                    ? company.homepage_url!
                    : `https://${company.homepage_url}`;
                  WebBrowser.openBrowserAsync(url);
                }}
              />
            )}
            {company.social?.linkedin && (
              <LinkRow
                icon={<LinkedInBadge />}
                label="LinkedIn Company Page"
                onPress={() => openLinkedInCompany(company.social!.linkedin!)}
              />
            )}
            {company.social?.twitter && (
              <LinkRow
                icon={<AtSign size={18} color="#1DA1F2" strokeWidth={1.75} />}
                label={`@${company.social.twitter.replace(/.*twitter\.com\//i, '')}`}
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    company.social!.twitter!.startsWith('http')
                      ? company.social!.twitter!
                      : `https://twitter.com/${company.social!.twitter}`,
                  )
                }
              />
            )}
            {company.social?.crunchbase && (
              <LinkRow
                icon={<Rocket size={18} color="#525252" strokeWidth={1.75} />}
                label="Crunchbase Profile"
                onPress={() =>
                  WebBrowser.openBrowserAsync(
                    company.social!.crunchbase!.startsWith('http')
                      ? company.social!.crunchbase!
                      : `https://crunchbase.com/${company.social!.crunchbase}`,
                  )
                }
              />
            )}
            <View style={{ height: 8 }} />
          </View>
        )}

        {/* Funding */}
        {(company.funding_rounds?.length ?? 0) > 0 && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Funding
            </Text>
            {company.funding_summary?.last_funding_round && (
              <StatRow label="Last round" value={company.funding_summary.last_funding_round} />
            )}
            {company.funding_rounds?.slice(0, 4).map((round: any, i) => {
              const usd = round.money_raised_usd ?? round.moneyRaisedUsd;
              const rawDate = round.announced_on ?? round.announcedOn;
              let dateStr = '';
              if (rawDate) {
                if (typeof rawDate === 'number') {
                  // Unix timestamp (seconds or ms) → year only
                  const ts = rawDate > 1e10 ? rawDate : rawDate * 1000;
                  dateStr = new Date(ts).getFullYear().toString();
                } else {
                  // String like "2023-01-15" or "2023" → first 7 chars
                  dateStr = String(rawDate).substring(0, 7);
                }
              }
              const amtStr = usd
                ? usd >= 1_000_000_000
                  ? `$${(usd / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
                  : `$${(usd / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
                : 'Undisclosed';
              return (
                <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
                  <Text style={{ color: '#262626', fontWeight: '600', fontSize: 13 }}>{round.title}</Text>
                  <Text style={{ color: '#737373', fontSize: 12, marginTop: 2 }}>
                    {amtStr}{dateStr ? ` · ${dateStr}` : ''}
                  </Text>
                </View>
              );
            })}
            <View style={{ height: 8 }} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CompanyDetailSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={60} height={60} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Skeleton width="55%" height={20} />
            <View style={{ marginTop: 8 }}><Skeleton width="40%" height={14} /></View>
          </View>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
        {[...Array(5)].map((_, i) => (
          <View key={i} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
            <Skeleton height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}
