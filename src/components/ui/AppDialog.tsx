import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { color, radius } from '../../theme/tokens';

export type DialogTone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface DialogAction {
  label: string;
  onPress?: () => void;
}

interface AppDialogProps {
  visible: boolean;
  /** Controls the icon circle tint and (optionally) the primary button color when `destructive`. */
  tone?: DialogTone;
  /** Lucide icon rendered in the tinted circle at the top. */
  icon?: LucideIcon;
  title: string;
  message?: string;
  /** Primary CTA — styled as the tone's solid fill color (or danger if `destructive`). Defaults to "OK". */
  primary?: DialogAction;
  /** Optional secondary CTA — rendered as a muted pill to the left of primary. */
  secondary?: DialogAction;
  /** When true, the primary button takes the danger color regardless of tone. */
  destructive?: boolean;
  /** Called when the user taps the scrim or dismisses via back. */
  onClose: () => void;
}

// Centered card dialog with a tinted icon circle, bold title, muted body,
// and one or two buttons. Replaces the native Alert where we want the
// app's visual language (brand/live/warm/danger tokens, proper padding,
// rounded corners, shadow). Used for notifications ("Registered!"),
// confirmations ("Unfollow?"), and permission/restriction messages.
export function AppDialog({
  visible,
  tone = 'brand',
  icon: Icon,
  title,
  message,
  primary = { label: 'OK' },
  secondary,
  destructive = false,
  onClose,
}: AppDialogProps) {
  const tint = TONE_TINT[tone];
  const ink = TONE_INK[tone];
  const primaryBg = destructive ? color.danger : TONE_FILL[tone];

  const handlePrimary = () => {
    primary.onPress?.();
    onClose();
  };
  const handleSecondary = () => {
    secondary?.onPress?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {Icon && (
            <View style={[styles.iconWrap, { backgroundColor: tint }]}>
              <Icon size={24} color={ink} strokeWidth={2.25} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.body}>{message}</Text>}

          <View style={styles.actions}>
            {secondary && (
              <Pressable
                onPress={handleSecondary}
                style={[styles.btn, styles.btnSecondary]}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
              >
                <Text style={styles.btnSecondaryText}>{secondary.label}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handlePrimary}
              style={[styles.btn, { backgroundColor: primaryBg }]}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            >
              <Text style={styles.btnPrimaryText}>{primary.label}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const TONE_TINT: Record<DialogTone, string> = {
  brand: color.brandTint,
  success: color.liveTint,
  warning: color.warmTint,
  danger: color.dangerTint,
  info: color.line2,
};

const TONE_INK: Record<DialogTone, string> = {
  brand: color.brand,
  success: color.liveInk,
  warning: color.warmInk,
  danger: color.dangerInk,
  info: color.ink,
};

const TONE_FILL: Record<DialogTone, string> = {
  brand: color.brand,
  success: color.live,
  warning: color.warm,
  danger: color.danger,
  info: color.brand,
};

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(11,11,16,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: color.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: color.muted,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 18,
  },
  btn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: color.line2,
  },
  btnSecondaryText: {
    color: color.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
