import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchContact } from '../api/search';
import { revealContact } from '../api/contacts';
import { callPhone } from './ContactActions';
import { useContactStore } from '../store/contactStore';
import { Avatar } from './ui/Avatar';
import { LivePill } from './ui/LivePill';
import { QuickActionButton } from './ui/QuickActionButton';
import { color, radius } from '../theme/tokens';

interface ContactCardProps {
  contact: SearchContact;
  onReveal?: (revealed: SearchContact) => void;
}

export function ContactCard({ contact: initialContact, onReveal }: ContactCardProps) {
  const setSelectedContact = useContactStore((s) => s.setSelectedContact);
  const setRevealedContact = useContactStore((s) => s.setRevealedContact);
  const getRevealedContact = useContactStore((s) => s.getRevealedContact);

  const [contact, setContact] = useState(() => {
    const cached = getRevealedContact(initialContact.contactId);
    return cached ?? initialContact;
  });
  const queryClient = useQueryClient();

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
  });

  const isRevealed = !!contact.isShown;
  const isDNC = !!contact.isContactFullDNC;
  const isBlocked = !!contact.isBlockedForShow;
  const firstPhone = contact.phones?.find((p) => !p.is_do_not_call) ?? contact.phones?.[0];

  const subtitle = [contact.job_title?.title, contact.company?.name].filter(Boolean).join(' · ');
  const location = [contact.location?.city, contact.location?.country].filter(Boolean).join(', ');

  const handlePress = () => {
    setSelectedContact(contact);
    router.push(`/contact/${contact.contactId}`);
  };

  const handleCall = () => {
    if (firstPhone) callPhone(firstPhone.normalized_number ?? firstPhone.number);
  };

  return (
    <Pressable onPress={handlePress} style={styles.row}>
      <Avatar name={contact.name.full} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{contact.name.full}</Text>
          {isDNC && <DncPill />}
        </View>
        {!!subtitle && (
          <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        )}
        {!!location && (
          <Text style={styles.loc} numberOfLines={1}>{location}</Text>
        )}
      </View>

      {isDNC || isBlocked ? null : isRevealed ? (
        <View style={styles.actionCol}>
          <QuickActionButton kind="call" onPress={handleCall} size={30} />
        </View>
      ) : (
        <View style={styles.actionCol}>
          {revealMutation.isPending ? (
            <View style={styles.revealPill}>
              <ActivityIndicator size="small" color={color.brand} />
            </View>
          ) : (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); revealMutation.mutate(); }}
              style={styles.revealPill}
            >
              <Text style={styles.revealText}>REVEAL</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

function DncPill() {
  return <LivePill label="DNC" variant="dnc" dot={false} size="xs" />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F5',
  },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '700', color: color.ink, flexShrink: 1 },
  sub: { fontSize: 12, color: color.muted, marginTop: 1 },
  loc: { fontSize: 11, color: color.muted2, marginTop: 2 },
  actionCol: { alignItems: 'center', justifyContent: 'center' },
  revealPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: color.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  revealText: { fontSize: 11, fontWeight: '700', color: color.brand, letterSpacing: 0.3 },
});
