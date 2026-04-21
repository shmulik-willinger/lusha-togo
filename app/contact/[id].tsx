import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Ban, Lock, Unlock, Phone, Mail, MessageCircle, Building2, Clock, UserPlus, Share2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getContactById, revealContact } from '../../src/api/contacts';
import { useContactStore } from '../../src/store/contactStore';
import { SearchContact, ContactPhone, ContactEmail } from '../../src/api/search';
import { openLinkedIn, callPhone, sendEmail, openWhatsApp } from '../../src/components/ContactActions';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Badge } from '../../src/components/ui/Badge';
import { ContactHero } from '../../src/components/contact/ContactHero';
import { RevealHeroCard } from '../../src/components/contact/RevealHeroCard';
import { MaskedValueRow } from '../../src/components/ui/MaskedValueRow';
import { color } from '../../src/theme/tokens';
import { useSignalsStore } from '../../src/store/signalsStore';
import { createSubscription, deleteSubscription, listAllSubscriptions, reactivateSubscription, getContactSignals, LushaSignalEvent } from '../../src/api/signals';
import { useAuthStore } from '../../src/store/authStore';
import { resolveUserId } from '../../src/utils/session';

function getInitials(name: SearchContact['name']): string {
  return `${name.first?.[0] ?? ''}${name.last?.[0] ?? ''}`.toUpperCase();
}

function formatPhone(n: string | number | undefined | null): string {
  if (n == null || n === '') return '';
  const s = String(n);
  return s.startsWith('+') ? s : `+${s}`;
}

function InfoRow({
  icon,
  label,
  value,
  onPress,
  actionLabel,
  actionIcon: ActionIcon,
  onSecondaryPress,
  secondaryActionLabel,
  secondaryActionIcon: SecondaryActionIcon,
  danger,
  isDataMasked,
}: {
  icon: string | React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onSecondaryPress?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: LucideIcon;
  danger?: boolean;
  isDataMasked?: boolean;
}) {
  return (
    <View style={{ direction: 'ltr', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
      <View style={{ width: 28, alignItems: 'flex-start', opacity: isDataMasked ? 0.4 : 1 }}>
        {typeof icon === 'string'
          ? <Text style={{ fontSize: 18 }}>{icon}</Text>
          : icon}
      </View>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={{ fontSize: 11, color: '#a3a3a3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        <Text
          style={{ fontSize: 15, marginTop: 2, color: isDataMasked ? '#a3a3a3' : danger ? '#dc2626' : '#262626', fontWeight: '500' }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {onPress && actionLabel && (
        <TouchableOpacity
          onPress={onPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDataMasked ? '#6f45ff' : '#f3efff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, marginLeft: 8 }}
          activeOpacity={0.75}
        >
          {ActionIcon && <ActionIcon size={13} color={isDataMasked ? '#fff' : '#6f45ff'} strokeWidth={2.25} />}
          <Text style={{ color: isDataMasked ? '#fff' : '#6f45ff', fontSize: 13, fontWeight: '600' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {onSecondaryPress && secondaryActionLabel && (
        <TouchableOpacity
          onPress={onSecondaryPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e7f9ef', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, marginLeft: 6 }}
          activeOpacity={0.75}
        >
          {SecondaryActionIcon && <SecondaryActionIcon size={13} color="#25d366" strokeWidth={2.25} />}
          <Text style={{ color: '#25d366', fontSize: 13, fontWeight: '600' }}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function signalLabel(type: string): string {
  switch (type) {
    case 'companyChange': return 'Changed jobs';
    case 'promotion': return 'Promoted';
    default: return type;
  }
}

function signalDetail(event: LushaSignalEvent): string {
  const d = event.data ?? {};
  switch (event.signalType) {
    case 'companyChange':
      return [
        d.previousCompanyName && d.currentCompanyName ? `${d.previousCompanyName} → ${d.currentCompanyName}` : d.currentCompanyName,
        d.currentTitle,
      ].filter(Boolean).join(' · ');
    case 'promotion':
      return [d.currentTitle, d.currentSeniorityLabel ? `(${d.currentSeniorityLabel})` : null].filter(Boolean).join(' ');
    default:
      return d.currentCompanyName ?? d.currentTitle ?? '';
  }
}

function ContactSignalsSection({ contact }: { contact: SearchContact }) {
  const { apiKey, addSignal, isFollowing, addSubscription, removeSubscription, subscriptions } = useSignalsStore();
  const { session } = useAuthStore();
  const entityId = contact.personId != null ? String(contact.personId) : null;
  const following = entityId ? isFollowing(entityId, contact.name.full, 'contact') : false;
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
      const results = await getContactSignals(entityId, apiKey);
      setSignals(results);
      setShown(true);
      // Save each to history
      for (const s of results) {
        await addSignal({
          id: `api-${entityId}-${s.signalType}-${s.signalDate ?? 'nodate'}`,
          timestamp: new Date().toISOString(),
          entityName: contact.name.full,
          entityId,
          entityType: 'contact',
          signalType: s.signalType,
          data: s.data,
          read: true,
          source: 'api',
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
      Alert.alert('Unregister', `Stop receiving signal notifications for ${contact.name.full}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
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
        entityId, entityType: 'contact', entityName: contact.name.full, apiKey, userId: resolvedUserId,
      });
      await addSubscription({
        id: result.id, entityId, entityType: 'contact', entityName: contact.name.full,
        signalTypes: result.signalTypes, createdAt: result.createdAt ?? new Date().toISOString(),
      });
      Alert.alert('Registered!', `You'll receive push notifications when ${contact.name.full} has new signals.`);
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? '';
      if (msg.toLowerCase().includes('already exists')) {
        try {
          const subs = await listAllSubscriptions(apiKey);
          const existing = subs.find((s: any) => String(s.entityId) === String(entityId));
          if (existing) {
            await reactivateSubscription(existing.id, apiKey);
            await addSubscription({
              id: existing.id, entityId, entityType: 'contact', entityName: contact.name.full,
              signalTypes: existing.signalTypes ?? [], createdAt: existing.createdAt ?? new Date().toISOString(),
            });
            Alert.alert('Registered!', `You'll receive push notifications when ${contact.name.full} has new signals.`);
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
    <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 12 }}>
        Signals
      </Text>

      {/* Action buttons */}
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

      {/* Error */}
      {showError && (
        <Text style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{showError}</Text>
      )}

      {/* Signals list */}
      {shown && signals.length === 0 && !showError && (
        <Text style={{ color: '#a3a3a3', fontSize: 13, paddingBottom: 12 }}>No signals found for this contact.</Text>
      )}
      {(() => {
        const latest = new Map<string, LushaSignalEvent>();
        for (const s of signals) {
          const ex = latest.get(s.signalType);
          const tEx = ex?.signalDate ? new Date(ex.signalDate).getTime() : 0;
          const tNew = s.signalDate ? new Date(s.signalDate).getTime() : 0;
          if (!ex || tNew > tEx) latest.set(s.signalType, s);
        }
        return Array.from(latest.values())
          .sort((a, b) => (b.signalDate ? new Date(b.signalDate).getTime() : 0) - (a.signalDate ? new Date(a.signalDate).getTime() : 0))
          .map((s, i) => (
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
          ));
      })()}

      {following && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 12, paddingTop: signals.length > 0 ? 4 : 0 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
          <Text style={{ fontSize: 12, color: '#737373' }}>Registered — All Signals</Text>
        </View>
      )}
    </View>
  );
}

function FollowButton({ contact }: { contact: SearchContact }) {
  const { apiKey, expoPushToken, isFollowing, addSubscription, removeSubscription, subscriptions } = useSignalsStore();
  const { session } = useAuthStore();
  const entityId = contact.personId != null ? String(contact.personId) : null;
  const following = entityId ? isFollowing(entityId, contact.name.full, 'contact') : false;
  const [loading, setLoading] = useState(false);
  const resolvedUserId = resolveUserId(session);

  if (!entityId || !apiKey || !resolvedUserId) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      const result = await createSubscription({
        entityId,
        entityType: 'contact',
        entityName: contact.name.full,
        apiKey,
        userId: resolvedUserId,
      });
      await addSubscription({
        id: result.id,
        entityId,
        entityType: 'contact',
        entityName: contact.name.full,
        signalTypes: result.signalTypes,
        createdAt: result.createdAt ?? new Date().toISOString(),
      });
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? e?.message ?? '';
      // Backend already has this subscription (e.g. after logout cleared the
      // local mirror, or an old subscription the API doesn't return in GET).
      // Treat this as success so the button flips to "✓ Following".
      if (msg.toLowerCase().includes('already exists')) {
        try {
          const subs = await listAllSubscriptions(apiKey);
          const existing = subs.find((s: any) => String(s.entityId) === String(entityId));
          if (existing) {
            try { await reactivateSubscription(existing.id, apiKey); } catch {}
            await addSubscription({
              id: existing.id,
              entityId,
              entityType: 'contact',
              entityName: contact.name.full,
              signalTypes: existing.signalTypes ?? [],
              createdAt: existing.createdAt ?? new Date().toISOString(),
            });
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }

        // Fallback: stub local record; pull-to-refresh on Signals syncs the real id.
        await addSubscription({
          id: `stub-${entityId}`,
          entityId,
          entityType: 'contact',
          entityName: contact.name.full,
          signalTypes: [],
          createdAt: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }
      Alert.alert('Error', msg || 'Could not follow contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = () => {
    const cleanName = contact.name.full.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase();
    const sub = subscriptions.find((s) => s.entityId === entityId)
      ?? subscriptions.find((s) => s.entityType === 'contact' &&
           s.entityName.replace(/\s*—\s*Lusha ToGo\s*$/i, '').trim().toLowerCase() === cleanName);
    if (!sub) return;
    Alert.alert('Unfollow', `Stop following ${contact.name.full}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unfollow',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deleteSubscription(sub.id, apiKey);
          } catch (e: any) {
            console.log('[follow] delete error:', e?.message);
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
        gap: 4,
        backgroundColor: following ? '#f3efff' : '#6f45ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        opacity: loading ? 0.6 : 1,
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

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedContact = useContactStore((s) => s.selectedContact);
  const [contact, setContact] = useState<SearchContact | null>(null);

  // Fetch if no cache, OR cache is minimal (e.g. seeded from a signal — no job_title/phones yet).
  const cacheIsMinimal = !!cachedContact && !cachedContact.job_title && !cachedContact.phones;
  const query = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContactById(id),
    enabled: !!id && (!cachedContact || cacheIsMinimal),
  });

  useEffect(() => {
    if (query.data) setContact(query.data);
  }, [query.data]);

  const [revealError, setRevealError] = useState(false);

  const revealMutation = useMutation({
    mutationFn: () => revealContact(data!),
    onSuccess: (responseData: any) => {
      if (!data) return;
      console.log('[contact-detail reveal-success]', JSON.stringify(responseData).substring(0, 400));

      // Actual response structure: { data: { type: "success", data: { contacts: [...] } } }
      const revealedItems: any[] =
        responseData?.contacts ?? responseData?.data?.data?.contacts ?? responseData?.data?.contacts ?? [];
      const revealedItem = revealedItems[0];

      let updatedPhones = data.phones ?? [];
      let updatedEmails = data.emails ?? [];

      if (revealedItem) {
        if (revealedItem.phones?.length) {
          updatedPhones = revealedItem.phones.map((p: any) => ({
            number: String(p.value ?? p.number ?? ''),
            normalized_number: String(p.normalized_number ?? p.value ?? p.number ?? ''),
            type: p.type,
            is_do_not_call: p.doNotCall ?? p.is_do_not_call ?? false,
            datapointId: p.datapointId,
            isMasked: false,
          }));
        }
        if (revealedItem.emails?.length) {
          updatedEmails = revealedItem.emails.map((e: any) => ({
            address: String(e.value ?? e.address ?? ''),
            label: e.label ?? e.type,
            datapointId: e.datapointId,
            isMasked: false,
          }));
        }
      }

      setContact({ ...data, isShown: true, phones: updatedPhones, emails: updatedEmails });
    },
    onError: (err: any) => {
      console.log('[contact-detail reveal-error]', err?.response?.status, JSON.stringify(err?.response?.data).substring(0, 200));
      setRevealError(true);
    },
  });

  const data = contact ?? cachedContact ?? query.data;

  if (!data && (query.isLoading)) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-100">
        <Stack.Screen options={{ title: 'Contact' }} />
        <ContactDetailSkeleton />
      </SafeAreaView>
    );
  }

  const hasPhones = (data.phones?.length ?? 0) > 0;
  const hasEmails = (data.emails?.length ?? 0) > 0;
  const isRevealed = data.isShown;
  const isDNC = data.isContactFullDNC;

  // Show contact info if fully revealed OR if at least one item was partially revealed (e.g. via dashboard)
  const anyUnmasked =
    (data.phones ?? []).some(p => p.isMasked === false) ||
    (data.emails ?? []).some(e => e.isMasked === false);
  const showContactInfo = isRevealed || anyUnmasked;

  const saveToPhoneContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to contacts in your phone settings.');
      return;
    }

    const contact: Contacts.Contact = {
      [Contacts.Fields.FirstName]: data.name.first ?? '',
      [Contacts.Fields.LastName]: data.name.last ?? '',
      [Contacts.Fields.JobTitle]: data.job_title?.title ?? '',
      [Contacts.Fields.Company]: data.company?.name ?? '',
      [Contacts.Fields.PhoneNumbers]: data.phones
        ?.filter((p) => !p.is_do_not_call)
        .map((p) => ({
          label: p.type ?? 'mobile',
          number: p.normalized_number ?? p.number,
        })) ?? [],
      [Contacts.Fields.Emails]: data.emails?.map((e) => ({
        label: e.label ?? 'work',
        email: e.address,
      })) ?? [],
      [Contacts.Fields.UrlAddresses]: data.social_link
        ? [{ label: 'LinkedIn', url: data.social_link }]
        : [],
    } as Contacts.Contact;

    try {
      await Contacts.addContactAsync(contact);
      Alert.alert('Saved!', `${data.name.full} was saved to your contacts.`);
    } catch (e) {
      Alert.alert('Error', 'Could not save contact. Please try again.');
    }
  };

  const shareContact = async () => {
    const parts = [
      data.name.full,
      data.job_title?.title,
      data.company?.name,
      ...(isRevealed ? data.phones?.map((p) => p.normalized_number ?? p.number) ?? [] : []),
      ...(isRevealed ? data.emails?.map((e) => e.address) ?? [] : []),
      data.social_link,
    ].filter(Boolean);
    await Share.share({ message: parts.join('\n') });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7', direction: 'ltr' }}>
      <Stack.Screen options={{ title: data.name.full }} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero — new ContactHero */}
        <View style={{ marginBottom: 10 }}>
          <ContactHero
            name={data.name.full}
            role={data.job_title?.title ?? ''}
            company={data.company?.name ?? ''}
            verified={isRevealed && !isDNC}
            onCall={() => {
              const p = data.phones?.find(ph => !ph.is_do_not_call);
              if (p) callPhone(p.normalized_number ?? p.number);
              else if (!isRevealed) revealMutation.mutate();
            }}
            onEmail={() => {
              const e = data.emails?.[0];
              if (e) sendEmail(e.address);
              else if (!isRevealed) revealMutation.mutate();
            }}
            callDisabled={isDNC || (isRevealed && !data.phones?.some(p => !p.is_do_not_call))}
            emailDisabled={isDNC || (isRevealed && !data.emails?.length)}
          />
          {/* Follow button + DNC badge row (kept from old hero) */}
          <View style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isDNC && <Badge variant="negative">DNC</Badge>}
            <FollowButton contact={data} />
            {data.location?.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 }}>
                <MapPin size={12} color={color.muted2} strokeWidth={1.75} />
                <Text style={{ color: color.muted, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
                  {[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Reveal hero (when not revealed) */}
        {!showContactInfo && !isDNC && !revealError && (
          <RevealHeroCard
            contactName={data.name.full}
            valueCount={{
              phones: data.phones?.length ?? 0,
              emails: data.emails?.length ?? 0,
              social: data.social_link ? ['LinkedIn'] : [],
            }}
            creditCost={1}
            loading={revealMutation.isPending}
            onReveal={() => revealMutation.mutate()}
          />
        )}

        {/* Contact Info */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10, marginTop: !showContactInfo && !isDNC && !revealError ? 10 : 0 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: color.muted2, textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Contact
          </Text>

          {isDNC ? (
            <View style={{ paddingVertical: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ban size={16} color={color.danger} strokeWidth={2} />
                <Text style={{ color: color.danger, fontWeight: '600', fontSize: 15 }}>Do Not Contact</Text>
              </View>
              <Text style={{ color: color.muted, fontSize: 13, marginTop: 4 }}>
                This contact has opted out of communications.
              </Text>
            </View>
          ) : !showContactInfo ? (
            <View style={{ paddingTop: 10, paddingBottom: 14 }}>
              {revealError ? (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Lock size={16} color="#92400e" strokeWidth={2} />
                  <Text style={{ color: '#92400e', fontWeight: '600', fontSize: 14, lineHeight: 20, flex: 1 }}>
                    This Contact's Info is Protected – Upgrade to Unlock Access
                  </Text>
                </View>
              ) : (
                <>
                  {(data.phones?.length ?? 0) > 0 && (
                    <MaskedValueRow label="MOBILE" masked="+1 ••• ••• ••••" live />
                  )}
                  {(data.emails?.length ?? 0) > 0 && (
                    <MaskedValueRow label="EMAIL · WORK" masked="•••••••••@••••••••••" />
                  )}
                  {!data.phones?.length && !data.emails?.length && data.social_link && (
                    <MaskedValueRow label="SOCIAL PROFILE" masked="linkedin.com/in/•••••" />
                  )}
                </>
              )}
            </View>
          ) : (
            <>
              {data.phones?.map((phone, i) => {
                const isMasked = isRevealed ? phone.isMasked === true : phone.isMasked !== false;
                const isMobile = !isMasked && phone.type?.toLowerCase().includes('mobile');
                const phoneNum = phone.normalized_number ?? phone.number;
                return (
                  <InfoRow
                    key={i}
                    icon={<Phone size={18} color={isMasked ? '#a3a3a3' : '#525252'} strokeWidth={1.75} />}
                    label={phone.type ?? 'Phone'}
                    value={formatPhone(phoneNum)}
                    onPress={
                      isMasked ? () => revealMutation.mutate()
                      : phone.is_do_not_call ? undefined
                      : () => callPhone(phoneNum)
                    }
                    actionLabel={
                      isMasked ? (revealMutation.isPending ? '...' : 'Reveal')
                      : phone.is_do_not_call ? undefined
                      : 'Call'
                    }
                    actionIcon={isMasked && !revealMutation.isPending ? Unlock : undefined}
                    onSecondaryPress={isMobile ? () => openWhatsApp(phoneNum) : undefined}
                    secondaryActionLabel={isMobile ? 'WhatsApp' : undefined}
                    secondaryActionIcon={isMobile ? MessageCircle : undefined}
                    danger={phone.is_do_not_call}
                    isDataMasked={isMasked}
                  />
                );
              })}
              {data.emails?.map((email, i) => {
                const isMasked = isRevealed ? email.isMasked === true : email.isMasked !== false;
                return (
                  <InfoRow
                    key={i}
                    icon={<Mail size={18} color={isMasked ? '#a3a3a3' : '#525252'} strokeWidth={1.75} />}
                    label={email.label ?? 'Email'}
                    value={email.address}
                    onPress={isMasked ? () => revealMutation.mutate() : () => sendEmail(email.address)}
                    actionLabel={isMasked ? (revealMutation.isPending ? '...' : 'Reveal') : 'Email'}
                    actionIcon={isMasked && !revealMutation.isPending ? Unlock : undefined}
                    isDataMasked={isMasked}
                  />
                );
              })}
            </>
          )}

          {data.social_link && (
            <InfoRow
              icon={
                <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#0a66c2', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>in</Text>
                </View>
              }
              label="LinkedIn"
              value="View profile"
              onPress={() => openLinkedIn(data.social_link!)}
              actionLabel="Open"
            />
          )}
          {isRevealed && (
            <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 14 }}>
              {hasPhones && (
                <TouchableOpacity
                  onPress={saveToPhoneContacts}
                  style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#6f45ff', borderRadius: 12, paddingVertical: 12 }}
                  activeOpacity={0.85}
                >
                  <UserPlus size={16} color="#fff" strokeWidth={2.25} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save to Contacts</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={shareContact}
                style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#f3efff', borderRadius: 12, paddingVertical: 12 }}
                activeOpacity={0.85}
              >
                <Share2 size={16} color="#6f45ff" strokeWidth={2.25} />
                <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: 14 }}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 4 }} />
        </View>

        {/* Company */}
        {data.company?.name && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Company
            </Text>
            <InfoRow icon={<Building2 size={18} color="#525252" strokeWidth={1.75} />} label="Company" value={data.company.name} />
            <View style={{ height: 8 }} />
          </View>
        )}

        {/* Signals */}
        <ContactSignalsSection contact={data} />

        {/* Previous position */}
        {data.previous_job?.company && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Previous Position
            </Text>
            <InfoRow
              icon={<Clock size={18} color="#525252" strokeWidth={1.75} />}
              label={data.previous_job.company}
              value={data.previous_job.job_title ?? ''}
            />
            <View style={{ height: 8 }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactDetailSkeleton() {
  return (
    <View className="p-5">
      <View className="bg-white rounded-2xl p-5 mb-3">
        <View className="flex-row items-center mb-4">
          <Skeleton width={64} height={64} rounded />
          <View className="ml-4 flex-1">
            <Skeleton width="60%" height={20} />
            <View className="mt-2"><Skeleton width="40%" height={14} /></View>
          </View>
        </View>
        <Skeleton height={14} />
      </View>
      <View className="bg-white rounded-2xl p-5">
        <Skeleton width="30%" height={12} />
        <View className="mt-3"><Skeleton height={48} /></View>
      </View>
    </View>
  );
}
