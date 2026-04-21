import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Phone, Mail, Star } from 'lucide-react-native';
import { Avatar } from '../ui/Avatar';
import { LivePill } from '../ui/LivePill';
import { color, radius } from '../../theme/tokens';

interface ContactHeroProps {
  name: string;
  role: string;
  company: string;
  verified?: boolean;
  following?: boolean;
  onCall?: () => void;
  onEmail?: () => void;
  callDisabled?: boolean;
  emailDisabled?: boolean;
}

export function ContactHero({
  name,
  role,
  company,
  verified = false,
  following = false,
  onCall,
  onEmail,
  callDisabled,
  emailDisabled,
}: ContactHeroProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Avatar name={name} size={56} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          {!!role && <Text style={styles.role} numberOfLines={2}>{role}</Text>}
          {!!company && <Text style={styles.company} numberOfLines={1}>{company}</Text>}
        </View>
      </View>

      {(verified || following) && (
        <View style={styles.pills}>
          {verified && <LivePill label="LIVE · Verified" />}
          {following && (
            <View style={styles.followPill}>
              <Star size={10} color={color.brand} fill={color.brand} strokeWidth={2} />
              <Text style={styles.followText}>Following</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onCall}
          disabled={callDisabled}
          style={[styles.cta, styles.ctaCall, callDisabled && styles.ctaDisabled]}
        >
          <Phone size={15} color={color.liveInk} strokeWidth={2.4} />
          <Text style={[styles.ctaText, { color: color.liveInk }]}>Call</Text>
        </Pressable>
        <Pressable
          onPress={onEmail}
          disabled={emailDisabled}
          style={[styles.cta, styles.ctaEmail, emailDisabled && styles.ctaDisabled]}
        >
          <Mail size={15} color={color.brand} strokeWidth={2.4} />
          <Text style={[styles.ctaText, { color: color.brand }]}>Email</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  info: { flex: 1 },
  name:    { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: color.ink },
  role:    { fontSize: 12, color: color.muted, marginTop: 2 },
  company: { fontSize: 12, fontWeight: '700', color: color.brand, marginTop: 2 },
  pills: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  followPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.brandTint,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  followText: { fontSize: 10, fontWeight: '700', color: color.brand },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  ctaCall:  { backgroundColor: color.live },
  ctaEmail: { backgroundColor: color.brandTint },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: 12, fontWeight: '700' },
});
