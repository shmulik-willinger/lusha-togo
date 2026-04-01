import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getContactById, revealContact } from '../../src/api/contacts';
import { useContactStore } from '../../src/store/contactStore';
import { SearchContact, ContactPhone, ContactEmail } from '../../src/api/search';
import { openLinkedIn, callPhone, sendEmail, openWhatsApp } from '../../src/components/ContactActions';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { Badge } from '../../src/components/ui/Badge';
import { colors } from '../../src/theme/tokens';

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
  onSecondaryPress,
  secondaryActionLabel,
  danger,
  isDataMasked,
}: {
  icon: string | React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  actionLabel?: string;
  onSecondaryPress?: () => void;
  secondaryActionLabel?: string;
  danger?: boolean;
  isDataMasked?: boolean;
}) {
  return (
    <View style={{ direction: 'ltr', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <View style={{ width: 32, alignItems: 'flex-start' }}>
        {typeof icon === 'string'
          ? <Text style={{ fontSize: 18, opacity: isDataMasked ? 0.4 : 1 }}>{icon}</Text>
          : icon}
      </View>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Text>
        <Text
          style={{ fontSize: 15, marginTop: 2, color: isDataMasked ? '#9ca3af' : danger ? '#dc2626' : '#1a1a1a', fontWeight: '500' }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {onPress && actionLabel && (
        <TouchableOpacity
          onPress={onPress}
          style={{ backgroundColor: isDataMasked ? '#6f45ff' : '#f0ecff', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginLeft: 8 }}
          activeOpacity={0.75}
        >
          <Text style={{ color: isDataMasked ? '#fff' : '#6f45ff', fontSize: 13, fontWeight: '600' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {onSecondaryPress && secondaryActionLabel && (
        <TouchableOpacity
          onPress={onSecondaryPress}
          style={{ backgroundColor: '#e7f9ef', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginLeft: 6 }}
          activeOpacity={0.75}
        >
          <Text style={{ color: '#25d366', fontSize: 13, fontWeight: '600' }}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cachedContact = useContactStore((s) => s.selectedContact);
  const [contact, setContact] = useState<SearchContact | null>(null);

  const query = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContactById(id),
    // If we have cached data from the list, don't block on the API call
    enabled: !!id && !cachedContact,
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
        {/* Hero */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0ecff', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
              <Text style={{ color: '#6f45ff', fontSize: 22, fontWeight: '700' }}>
                {getInitials(data.name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#1a1a1a', fontSize: 19, fontWeight: '700', flex: 1 }} numberOfLines={1}>{data.name.full}</Text>
                {isDNC && <Badge variant="negative">DNC</Badge>}
              </View>
              {data.job_title?.title && (
                <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 3 }} numberOfLines={1}>{data.job_title.title}</Text>
              )}
              {data.company?.name && (
                <Text style={{ color: '#6f45ff', fontSize: 14, fontWeight: '600', marginTop: 2 }} numberOfLines={1}>
                  {data.company.name}
                </Text>
              )}
            </View>
          </View>

          {data.location?.city && (
            <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 10 }}>
              📍 {[data.location.city, data.location.state, data.location.country].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>

        {/* Contact Info */}
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
            Contact Info
          </Text>

          {isDNC ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: '#dc2626', fontWeight: '600', fontSize: 15 }}>⛔ Do Not Contact</Text>
              <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                This contact has opted out of communications.
              </Text>
            </View>
          ) : !showContactInfo ? (
            <View style={{ paddingVertical: 14 }}>
              {revealError ? (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' }}>
                  <Text style={{ color: '#92400e', fontWeight: '600', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
                    🔒 This Contact's Info is Protected – Upgrade to Unlock Access
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => revealMutation.mutate()}
                  disabled={revealMutation.isPending}
                  style={{ backgroundColor: '#6f45ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: revealMutation.isPending ? 0.7 : 1 }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {revealMutation.isPending ? 'Revealing…' : '🔓 Reveal Contact Info'}
                  </Text>
                </TouchableOpacity>
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
                    icon="📞"
                    label={phone.type ?? 'Phone'}
                    value={formatPhone(phoneNum)}
                    onPress={
                      isMasked ? () => revealMutation.mutate()
                      : phone.is_do_not_call ? undefined
                      : () => callPhone(phoneNum)
                    }
                    actionLabel={
                      isMasked ? (revealMutation.isPending ? '...' : '🔓 Reveal')
                      : phone.is_do_not_call ? undefined
                      : 'Call'
                    }
                    onSecondaryPress={isMobile ? () => openWhatsApp(phoneNum) : undefined}
                    secondaryActionLabel={isMobile ? '💬 WhatsApp' : undefined}
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
                    icon="✉️"
                    label={email.label ?? 'Email'}
                    value={email.address}
                    onPress={isMasked ? () => revealMutation.mutate() : () => sendEmail(email.address)}
                    actionLabel={isMasked ? (revealMutation.isPending ? '...' : '🔓 Reveal') : 'Email'}
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
                  style={{ flex: 1, backgroundColor: '#6f45ff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>💾 Save to Contacts</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={shareContact}
                style={{ flex: 1, backgroundColor: '#f0ecff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#6f45ff', fontWeight: '700', fontSize: 14 }}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 4 }} />
        </View>

        {/* Company */}
        {data.company?.name && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Company
            </Text>
            <InfoRow icon="🏢" label="Company" value={data.company.name} />
            <View style={{ height: 8 }} />
          </View>
        )}

        {/* Previous position */}
        {data.previous_job?.company && (
          <View style={{ backgroundColor: '#fff', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, paddingTop: 16, paddingBottom: 4 }}>
              Previous Position
            </Text>
            <InfoRow
              icon="⏱️"
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
