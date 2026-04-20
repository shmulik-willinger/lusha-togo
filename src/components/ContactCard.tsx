import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Phone, Mail, Ban, Lock, Unlock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchContact } from '../api/search';
import { revealContact } from '../api/contacts';
import { openLinkedIn, callPhone, sendEmail } from './ContactActions';
import { useContactStore } from '../store/contactStore';

interface ContactCardProps {
  contact: SearchContact;
  onReveal?: (revealed: SearchContact) => void;
}

function getInitials(name: SearchContact['name']): string {
  return `${name.first?.[0] ?? ''}${name.last?.[0] ?? ''}`.toUpperCase();
}

function formatPhone(n: string | number | undefined | null): string {
  if (n == null || n === '') return '';
  const s = String(n);
  return s.startsWith('+') ? s : `+${s}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function ContactCard({ contact: initialContact, onReveal }: ContactCardProps) {
  const setSelectedContact = useContactStore((s) => s.setSelectedContact);
  const setRevealedContact = useContactStore((s) => s.setRevealedContact);
  const getRevealedContact = useContactStore((s) => s.getRevealedContact);

  // Restore revealed state from store (survives tab switches / unmounts)
  const [contact, setContact] = useState(() => {
    const cached = getRevealedContact(initialContact.contactId);
    return cached ?? initialContact;
  });
  const [revealError, setRevealError] = useState(false);
  const queryClient = useQueryClient();

  // Sync when parent provides a new contact (different id) or newly-revealed data
  React.useEffect(() => {
    if (initialContact.contactId !== contact.contactId) {
      const cached = getRevealedContact(initialContact.contactId);
      setContact(cached ?? initialContact);
    } else if (initialContact.isShown && !contact.isShown) {
      setContact(initialContact);
    }
  }, [initialContact.contactId, initialContact.isShown]);

  const revealMutation = useMutation({
    mutationFn: () => revealContact(contact),
    onSuccess: (responseData: any) => {
      console.log('[reveal-success]', JSON.stringify(responseData).substring(0, 400));

      // Extract revealed phones/emails from the API response
      // Actual response structure: { data: { type: "success", data: { contacts: [...] } } }
      const revealedItems: any[] =
        responseData?.contacts ?? responseData?.data?.data?.contacts ?? responseData?.data?.contacts ?? [];
      const revealedItem = revealedItems[0];

      let updatedPhones = contact.phones ?? [];
      let updatedEmails = contact.emails ?? [];

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

      const revealed: SearchContact = {
        ...contact,
        isShown: true,
        phones: updatedPhones,
        emails: updatedEmails,
      };
      setContact(revealed);
      setRevealedContact(revealed);
      onReveal?.(revealed);

      if (contact.listId) {
        queryClient.invalidateQueries({ queryKey: ['contact-list', contact.listId] });
      }
    },
    onError: (err: any) => {
      console.log('[reveal-error]', err?.response?.status, JSON.stringify(err?.response?.data).substring(0, 200));
      setRevealError(true);
    },
  });

  const isRevealed = contact.isShown;
  const isDNC = contact.isContactFullDNC;
  const isBlocked = contact.isBlockedForShow;
  const firstPhone = contact.phones?.find((p) => !p.is_do_not_call) ?? contact.phones?.[0];
  const firstEmail = contact.emails?.[0];
  const hasLinkedIn = !!contact.social_link;

  const jobLine = [contact.job_title?.title, contact.company?.name].filter(Boolean).join(' · ');
  const locationLine = [contact.location?.city, contact.location?.country].filter(Boolean).join(', ');

  return (
    <TouchableOpacity
      onPress={() => {
        setSelectedContact(contact);
        router.push(`/contact/${contact.contactId}`);
      }}
      activeOpacity={0.82}
      style={styles.card}
    >
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {contact.name.full}
            </Text>
            {isDNC && (
              <View style={styles.dncBadge}>
                <Text style={styles.dncBadgeText}>DNC</Text>
              </View>
            )}
          </View>

          {!!jobLine && (
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              {jobLine}
            </Text>
          )}

          {!!locationLine && (
            <View style={styles.locationRow}>
              <MapPin size={11} color="#a3a3a3" strokeWidth={1.75} />
              <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                {locationLine}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action row ── */}
      {isDNC ? (
        <View style={styles.dncRow}>
          <Ban size={14} color="#dc2626" strokeWidth={2} />
          <Text style={styles.dncText}>Do Not Contact</Text>
        </View>
      ) : isBlocked ? (
        <View style={styles.dncRow}>
          <Lock size={14} color="#dc2626" strokeWidth={2} />
          <Text style={styles.dncText}>Restricted</Text>
        </View>
      ) : isRevealed ? (
        <View style={styles.revealedColumn}>
          {firstPhone && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); callPhone(firstPhone.normalized_number ?? firstPhone.number); }}
              style={styles.dataChipFull}
              activeOpacity={0.7}
            >
              <Phone size={13} color="#525252" strokeWidth={2} />
              <Text style={styles.dataChipText} numberOfLines={1} ellipsizeMode="tail">
                {formatPhone(firstPhone.normalized_number ?? firstPhone.number)}
              </Text>
              {hasLinkedIn && !firstEmail && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); openLinkedIn(contact.social_link!); }}
                  style={styles.linkedinBtnSmall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkedinText}>in</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          {firstEmail && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); sendEmail(firstEmail.address); }}
              style={styles.dataChipFull}
              activeOpacity={0.7}
            >
              <Mail size={13} color="#525252" strokeWidth={2} />
              <Text style={styles.dataChipText} numberOfLines={1} ellipsizeMode="tail">
                {firstEmail.address}
              </Text>
              {hasLinkedIn && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); openLinkedIn(contact.social_link!); }}
                  style={styles.linkedinBtnSmall}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkedinText}>in</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          {!firstPhone && !firstEmail && hasLinkedIn && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); openLinkedIn(contact.social_link!); }}
              style={styles.linkedinBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.linkedinText}>in</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : revealError ? (
        <View style={styles.protectedRow}>
          <Lock size={13} color="#92400e" strokeWidth={2} />
          <Text style={styles.protectedText}>
            This Contact's Info is Protected – Upgrade to Unlock Access
          </Text>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); revealMutation.mutate(); }}
            disabled={revealMutation.isPending}
            style={[styles.revealBtn, revealMutation.isPending && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            {revealMutation.isPending ? (
              <Text style={styles.revealBtnText}>Revealing…</Text>
            ) : (
              <View style={styles.revealBtnInner}>
                <Unlock size={14} color="#ffffff" strokeWidth={2.25} />
                <Text style={styles.revealBtnText}>Reveal Contact</Text>
              </View>
            )}
          </TouchableOpacity>
          {hasLinkedIn && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); openLinkedIn(contact.social_link!); }}
              style={styles.linkedinBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.linkedinText}>in</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const PURPLE = '#6f45ff';
const PURPLE_LIGHT = '#f3efff';

const styles = StyleSheet.create({
  card: {
    direction: 'ltr',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBlock: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 13,
    color: '#737373',
    marginTop: 2,
    fontWeight: '400',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  location: {
    fontSize: 12,
    color: '#a3a3a3',
    flexShrink: 1,
  },
  dncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revealBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  dncBadge: {
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  dncBadgeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 10,
    marginHorizontal: -2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  revealedColumn: {
    flexDirection: 'column',
    gap: 6,
  },
  dataChipFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  dataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    maxWidth: '100%',
  },
  linkedinBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0077b5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  dataChipText: {
    fontSize: 12,
    color: '#262626',
    fontWeight: '500',
    flexShrink: 1,
  },
  revealBtn: {
    flex: 1,
    backgroundColor: PURPLE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  revealBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  linkedinBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0077b5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkedinText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dncText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  protectedText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 17,
  },
});
