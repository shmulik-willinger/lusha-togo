import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
            number: p.value ?? p.number ?? '',
            normalized_number: p.normalized_number ?? p.value ?? p.number ?? '',
            type: p.type,
            is_do_not_call: p.doNotCall ?? p.is_do_not_call ?? false,
            datapointId: p.datapointId,
            isMasked: false,
          }));
        }
        if (revealedItem.emails?.length) {
          updatedEmails = revealedItem.emails.map((e: any) => ({
            address: e.value ?? e.address ?? '',
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
            <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
              📍 {locationLine}
            </Text>
          )}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Action row ── */}
      {isDNC ? (
        <Text style={styles.dncText}>⛔ Do Not Contact</Text>
      ) : isBlocked ? (
        <Text style={styles.dncText}>🔒 Restricted</Text>
      ) : isRevealed ? (
        <View style={styles.revealedColumn}>
          {firstPhone && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); callPhone(firstPhone.normalized_number ?? firstPhone.number); }}
              style={styles.dataChipFull}
              activeOpacity={0.7}
            >
              <Text style={styles.dataChipIcon}>📞</Text>
              <Text style={styles.dataChipText} numberOfLines={1} ellipsizeMode="tail">
                {firstPhone.normalized_number ?? firstPhone.number}
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
              <Text style={styles.dataChipIcon}>✉</Text>
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
        <Text style={styles.protectedText}>
          🔒 This Contact's Info is Protected – Upgrade to Unlock Access
        </Text>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); revealMutation.mutate(); }}
            disabled={revealMutation.isPending}
            style={[styles.revealBtn, revealMutation.isPending && { opacity: 0.6 }]}
            activeOpacity={0.8}
          >
            <Text style={styles.revealBtnText}>
              {revealMutation.isPending ? 'Revealing…' : '🔓 Reveal Contact'}
            </Text>
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
const PURPLE_LIGHT = '#f0ecff';

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
    color: '#1a1a1a',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '400',
  },
  location: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
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
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#f9fafb',
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
    backgroundColor: '#f9fafb',
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
  dataChipIcon: {
    fontSize: 12,
  },
  dataChipText: {
    fontSize: 12,
    color: '#374151',
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
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 17,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
});
