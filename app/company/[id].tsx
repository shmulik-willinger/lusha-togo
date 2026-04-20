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
import { Phone, Mail, MapPin, Users, Calendar, DollarSign, Globe, AtSign, Rocket, ChevronRight } from 'lucide-react-native';
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
  const [phone, setPhone] = React.useState(
    contact.phones?.find((p) => !p.is_do_not_call)?.normalized_number ??
    contact.phones?.find((p) => !p.is_do_not_call)?.number
  );
  const [email, setEmail] = React.useState(contact.emails?.[0]?.address);

  const revealMutation = useMutation({
    mutationFn: () => revealContact(contact),
    onSuccess: (data: any) => {
      const items: any[] = data?.contacts ?? data?.data?.data?.contacts ?? data?.data?.contacts ?? [];
      const item = items[0];
      if (item?.phones?.length) {
        const p = item.phones[0];
        setPhone(p.value ?? p.number ?? p.normalized_number);
      }
      if (item?.emails?.length) {
        const e = item.emails[0];
        setEmail(e.value ?? e.address);
      }
      setRevealed(true);
    },
  });

  const jobLine = [contact.job_title?.title, contact.job_title?.seniority]
    .filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      onPress={() => { setSelectedContact(contact); router.push(`/contact/${contact.contactId}`); }}
      activeOpacity={0.85}
      style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3efff', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: 13 }}>
            {`${contact.name.first?.[0] ?? ''}${contact.name.last?.[0] ?? ''}`.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: '#262626', fontSize: 14 }} numberOfLines={1}>
            {contact.name.full}
          </Text>
          {!!jobLine && (
            <Text style={{ color: '#737373', fontSize: 12, marginTop: 1 }} numberOfLines={1}>
              {jobLine}
            </Text>
          )}
        </View>
        {!revealed ? (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); revealMutation.mutate(); }}
            disabled={revealMutation.isPending}
            style={{ backgroundColor: '#6f45ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, opacity: revealMutation.isPending ? 0.6 : 1 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {revealMutation.isPending ? 'Revealing…' : 'Show details'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            {phone && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Phone size={11} color="#525252" strokeWidth={2} />
                <Text style={{ color: '#262626', fontSize: 12 }}>{phone}</Text>
              </View>
            )}
            {email && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Mail size={11} color="#525252" strokeWidth={2} />
                <Text style={{ color: '#262626', fontSize: 11 }} numberOfLines={1}>{email}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
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
  const following = entityId ? isFollowing(entityId) : false;
  const resolvedUserId = resolveUserId(session);

  const [showLoading, setShowLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [signals, setSignals] = useState<LushaSignalEvent[]>([]);
  const [showError, setShowError] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

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
      Alert.alert('Unregister', `Stop receiving signal notifications for ${company.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister', style: 'destructive',
          onPress: async () => {
            setRegisterLoading(true);
            try { await deleteSubscription(sub.id, apiKey); } catch {}
            await removeSubscription(sub.id);
            setRegisterLoading(false);
          },
        },
      ]);
      return;
    }
    if (!resolvedUserId) {
      Alert.alert('Error', 'Could not resolve your user ID. Please log out and log in again.');
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
      Alert.alert('Registered!', `You'll receive push notifications when there are signals for ${company.name}.`);
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
            Alert.alert('Registered!', `You'll receive push notifications when there are signals for ${company.name}.`);
            return;
          }
        } catch {}
      }
      Alert.alert('Error', msg || 'Could not register.');
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
    </View>
  );
}

function FollowCompanyButton({ company }: { company: SearchCompany }) {
  const { apiKey, isFollowing, addSubscription, removeSubscription, subscriptions } = useSignalsStore();
  const { session } = useAuthStore();
  const entityId = company.company_id || company.company_lid;
  const following = entityId ? isFollowing(entityId) : false;
  const [loading, setLoading] = useState(false);
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
      Alert.alert('Error', e?.response?.data?.message ?? e?.message ?? 'Could not follow company.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = () => {
    const sub = subscriptions.find((s) => s.entityId === entityId);
    if (!sub) return;
    Alert.alert('Unfollow', `Stop following ${company.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try { await deleteSubscription(sub.id, apiKey); } catch (e: any) {
            console.log('[follow-company] delete error:', e?.message);
          }
          await removeSubscription(sub.id);
          setLoading(false);
        },
      },
    ]);
  };

  return (
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
  );
}

export default function CompanyDetailScreen() {
  const storedCompany = useCompanyStore((s) => s.selectedCompany);

  const { data: dmData, isLoading: dmLoading } = useQuery({
    queryKey: ['company-contacts', storedCompany?.name],
    queryFn: () => searchProspects({
      filters: { companyName: [{ name: storedCompany!.name } as CompanyNameOption] },
      pageSize: 5,
      tab: 'contacts',
    }),
    enabled: !!storedCompany?.name,
    staleTime: 10 * 60 * 1000,
  });

  const { data: enrichSearch } = useQuery({
    queryKey: ['company-enrich', storedCompany?.name],
    queryFn: () => searchProspects({
      filters: { companyName: [{ name: storedCompany!.name } as CompanyNameOption] },
      pageSize: 1,
      tab: 'companies',
    }),
    enabled: !!storedCompany?.name,
    staleTime: 30 * 60 * 1000,
  });

  if (!storedCompany) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
        <Stack.Screen options={{ title: 'Company' }} />
        <CompanyDetailSkeleton />
      </SafeAreaView>
    );
  }

  // Merge enriched search data into stored data — fills in fields missing from recommendations
  const e = enrichSearch?.companies?.[0];
  const company: SearchCompany = {
    ...storedCompany,
    social: storedCompany.social ?? e?.social,
    homepage_url: storedCompany.homepage_url ?? e?.homepage_url,
    description: storedCompany.description ?? e?.description,
    revenue_range: storedCompany.revenue_range ?? e?.revenue_range,
    founded: storedCompany.founded ?? e?.founded,
    secondary_industry: storedCompany.secondary_industry ?? e?.secondary_industry,
    specialties: storedCompany.specialties ?? e?.specialties,
    linkedin_followers: storedCompany.linkedin_followers ?? e?.linkedin_followers,
    sic: storedCompany.sic ?? e?.sic,
    naics: storedCompany.naics ?? e?.naics,
    funding_rounds: storedCompany.funding_rounds ?? e?.funding_rounds,
    funding_summary: storedCompany.funding_summary ?? e?.funding_summary,
    logo_url: storedCompany.logo_url ?? e?.logo_url,
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
        {/* Hero */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {company.logo_url ? (
              <Image
                source={{ uri: company.logo_url }}
                style={{ width: 60, height: 60, borderRadius: 12, marginRight: 14 }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: '#f3efff', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ color: '#6f45ff', fontSize: 22, fontWeight: '700' }}>
                  {company.name?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#262626', fontSize: 20, fontWeight: '700' }}>{company.name}</Text>
              {company.industry?.primary_industry && (
                <Text style={{ color: '#737373', fontSize: 14, marginTop: 2 }}>
                  {company.industry.primary_industry}
                </Text>
              )}
              {company.location?.city && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                  <MapPin size={12} color="#a3a3a3" strokeWidth={1.75} />
                  <Text style={{ color: '#a3a3a3', fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
                    {[company.location.city, company.location.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick stats row */}
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {sizeLabel && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Users size={12} color="#525252" strokeWidth={1.75} />
                <Text style={{ color: '#262626', fontSize: 12 }}>{sizeLabel} employees</Text>
              </View>
            )}
            {company.founded && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Calendar size={12} color="#525252" strokeWidth={1.75} />
                <Text style={{ color: '#262626', fontSize: 12 }}>Founded {company.founded}</Text>
              </View>
            )}
            {company.revenue_range?.string && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <DollarSign size={12} color="#525252" strokeWidth={1.75} />
                <Text style={{ color: '#262626', fontSize: 12 }}>{company.revenue_range.string}</Text>
              </View>
            )}
          </View>

          {company.description && (
            <Text style={{ color: '#737373', fontSize: 13, lineHeight: 19, marginTop: 12 }} numberOfLines={4}>
              {company.description}
            </Text>
          )}
          <FollowCompanyButton company={company} />
        </View>

        {/* Company Info */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Company Info
          </Text>
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
              <Text style={{ color: '#a3a3a3', fontSize: 13, marginBottom: 8 }}>Specialties</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {company.specialties!.map((s, i) => (
                  <View key={i} style={{ backgroundColor: '#e5e5e5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 12, color: '#262626' }}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 8 }} />
        </View>

        {/* Potential Decision Makers */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Potential Decision Makers
          </Text>
          {dmLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#6f45ff" />
            </View>
          ) : decisionMakers.length === 0 ? (
            <Text style={{ color: '#a3a3a3', fontSize: 13, paddingVertical: 12 }}>No contacts found</Text>
          ) : (
            decisionMakers.map((c) => (
              <DecisionMakerCard key={c.contactId} contact={c} />
            ))
          )}
          <View style={{ height: 8 }} />
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
