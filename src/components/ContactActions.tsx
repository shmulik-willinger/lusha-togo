import React from 'react';
import { View, TouchableOpacity, Text, Linking, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ContactPhone, ContactEmail } from '../api/search';
import { colors } from '../theme/tokens';

interface ContactActionsProps {
  phones?: ContactPhone[];
  emails?: ContactEmail[];
  linkedinUrl?: string;
  compact?: boolean;
}

async function openLinkedIn(url: string) {
  // Try LinkedIn deep link first, fall back to browser
  const username = url.replace(/.*\/in\//, '').replace(/\/$/, '');
  const appUrl = `linkedin://in/${username}`;
  const canOpen = await Linking.canOpenURL(appUrl);
  if (canOpen) {
    await Linking.openURL(appUrl);
  } else {
    await WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `https://${url}`);
  }
}

async function callPhone(number: string) {
  const tel = `tel:${number}`;
  const canOpen = await Linking.canOpenURL(tel);
  if (canOpen) {
    await Linking.openURL(tel);
  } else {
    Alert.alert('Cannot make call', 'This device cannot make phone calls.');
  }
}

async function sendEmail(address: string) {
  await Linking.openURL(`mailto:${address}`);
}

async function openWhatsApp(number: string) {
  const clean = number.replace(/[^\d+]/g, '');
  const url = `https://wa.me/${clean.replace(/^\+/, '')}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature.');
  }
}

export function ContactActions({ phones, emails, linkedinUrl, compact = false }: ContactActionsProps) {
  const primaryPhone = phones?.[0];
  const primaryEmail = emails?.[0];

  if (!primaryPhone && !primaryEmail && !linkedinUrl) return null;

  return (
    <View className={`flex-row items-center gap-2 ${compact ? '' : 'mt-3 pt-3 border-t border-neutral-100'}`}>
      {primaryPhone && !primaryPhone.is_do_not_call && (
        <TouchableOpacity
          onPress={() => callPhone(primaryPhone.normalized_number ?? primaryPhone.number)}
          className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full"
          activeOpacity={0.7}
        >
          <Text className="text-xs mr-1">📞</Text>
          <Text className="text-xs text-primary font-sans-semibold">Call</Text>
        </TouchableOpacity>
      )}
      {primaryEmail && (
        <TouchableOpacity
          onPress={() => sendEmail(primaryEmail.address)}
          className="flex-row items-center bg-primary-50 px-3 py-1.5 rounded-full"
          activeOpacity={0.7}
        >
          <Text className="text-xs mr-1">✉️</Text>
          <Text className="text-xs text-primary font-sans-semibold">Email</Text>
        </TouchableOpacity>
      )}
      {linkedinUrl && (
        <TouchableOpacity
          onPress={() => openLinkedIn(linkedinUrl)}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.linkedin }}
          activeOpacity={0.7}
        >
          <Text className="text-white text-xs font-sans-bold">in</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export { openLinkedIn, callPhone, sendEmail, openWhatsApp };
