# Lusha ToGo — Phase 2 Handoff

**Scope:** Redesign the four highest-traffic screens using the Phase 1 token system + primitives.

**Target screens:**
1. **Home** — `app/(tabs)/home.tsx`
2. **Contact Detail** — `app/contact/[id].tsx`
3. **Company Detail** — `app/company/[id].tsx`
4. **Search result row** — `src/components/ContactCard.tsx` (shared by Search, Lists, Recommendations)

**Estimated effort:** ~2 weeks for one FE engineer.

**Prerequisite:** Phase 1 must be merged. This doc assumes the following are available:
- Tokens: `color.brand`, `color.live`, `color.brandTint`, `color.ink`, etc. from `src/theme/tokens.ts`
- Primitives: `LivePill`, `StatChip`, `SegmentFilter`, `Card` from `src/components/ui/*`
- `lucide-react-native` icons replacing emoji

**Out of scope for Phase 2:** Signals, Account, Upload Contacts, Login, List Detail. Those are Phase 3.

---

## 0. New primitives to add before starting

Before touching screens, add these reusable pieces to `src/components/ui/`.

### 0.1 `src/components/ui/GradientHero.tsx`

Used by: Home header, Contact reveal card, Signals teaser, Account credits card.

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radius } from '@/theme/tokens';

type Variant = 'brand' | 'dark' | 'reveal';

const GRADIENTS: Record<Variant, [string, string]> = {
  brand:  ['#6F45FF', '#8C6BFF'],
  dark:   ['#0B0B10', '#2B1A66'],
  reveal: ['#0B0B10', '#2B1A66'],
};

export function GradientHero({
  variant = 'brand',
  style,
  children,
  radius: r = radius.lg,
}: {
  variant?: Variant;
  style?: ViewStyle;
  children: React.ReactNode;
  radius?: number;
}) {
  return (
    <LinearGradient
      colors={GRADIENTS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: r, overflow: 'hidden' }, style]}
    >
      {children}
    </LinearGradient>
  );
}
```

> **Install note:** `expo-linear-gradient` ships with Expo SDK. If not installed: `npx expo install expo-linear-gradient`.

---

### 0.2 `src/components/ui/QuickActionButton.tsx`

Circular 28–32px action button used on result rows (Call / Reveal / Lock).

```tsx
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Phone, Lock, Mail } from 'lucide-react-native';
import { color } from '@/theme/tokens';

type Kind = 'call' | 'reveal' | 'locked' | 'email';

const CONFIG: Record<Kind, { bg: string; fg: string; Icon: any }> = {
  call:    { bg: color.live,      fg: color.liveInk,  Icon: Phone },
  email:   { bg: color.brand,     fg: '#FFFFFF',      Icon: Mail },
  reveal:  { bg: color.brandTint, fg: color.brand,    Icon: Lock },
  locked:  { bg: color.brandTint, fg: color.brand,    Icon: Lock },
};

export function QuickActionButton({
  kind,
  onPress,
  size = 32,
}: {
  kind: Kind;
  onPress?: () => void;
  size?: number;
}) {
  const { bg, fg, Icon } = CONFIG[kind];
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon size={size * 0.45} color={fg} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
```

---

### 0.3 `src/components/ui/MaskedValueRow.tsx`

Used by Contact Detail and List Detail before reveal.

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { LivePill } from './LivePill';
import { color, radius, space } from '@/theme/tokens';

export function MaskedValueRow({
  label,
  masked,
  live = false,
}: {
  label: string;    // e.g. 'MOBILE', 'EMAIL · WORK'
  masked: string;   // e.g. '+1 ••• ••• ••••'
  live?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Lock size={13} color={color.brand} strokeWidth={2.2} />
      </View>
      <View style={styles.val}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.masked}>{masked}</Text>
      </View>
      {live && <LivePill size="sm" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    backgroundColor: 'rgba(111,69,255,0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(111,69,255,0.4)',
    borderRadius: radius.md,
    marginBottom: space.xs,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: color.brandTint,
    alignItems: 'center', justifyContent: 'center',
  },
  val: { flex: 1 },
  label: {
    fontSize: 9, fontWeight: '700', color: color.muted,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 2,
  },
  masked: {
    fontSize: 12, fontFamily: 'JetBrainsMono-Regular', letterSpacing: 1,
    color: color.muted2 ?? '#A3A3AD',
  },
});
```

> **If `JetBrainsMono` font isn't loaded**, fall back to `Platform.select({ ios: 'Menlo', android: 'monospace' })`.

---

## 1. Screen: Home (`app/(tabs)/home.tsx`)

**Current state:** Three equal sections (AI search / recommendations / upload) on grey canvas.

**Target state:** Briefing-style layout — personalized header, gradient hero with embedded AI prompt, hot signals stack, recommendations card, compact upload row.

### 1.1 Structure

```
<ScrollView>
  <HomeHero />              ← gradient · greeting · AI prompt (merge of old header + AI search)
  <Section title="Hot signals" count={3} link="See all">
    <SignalCard />          ← 2–3 recent items from signals store
  </Section>
  <Section title="Today's picks" brandCount={142} subtitle="Matched to your ICP">
    <RecommendationsSummaryCard />
  </Section>
  <UploadContactsRow />     ← dashed-border compact row (not full card)
</ScrollView>
```

### 1.2 `HomeHero` component — drop into `app/(tabs)/home.tsx` or extract to `src/components/home/HomeHero.tsx`

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { GradientHero } from '@/components/ui/GradientHero';
import { color, space, radius, type } from '@/theme/tokens';
import { useAuthStore } from '@/store/auth';       // adjust path
import { useSignalsStore } from '@/store/signals'; // adjust path

export function HomeHero() {
  const router = useRouter();
  const firstName = useAuthStore(s => s.user?.firstName ?? 'there');
  const hotSignals = useSignalsStore(s => s.recent?.length ?? 0);

  return (
    <GradientHero variant="brand" style={styles.hero} radius={0}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>GOOD MORNING, {firstName.toUpperCase()}</Text>
        <Text style={styles.title}>
          {hotSignals > 0
            ? `You've got ${hotSignals} warm signal${hotSignals === 1 ? '' : 's'} today.`
            : `Ready to find your next lead.`}
        </Text>

        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          style={styles.searchCard}
        >
          <View style={styles.searchRow1}>
            <Sparkles size={13} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.searchAsk}>Ask Lusha AI</Text>
          </View>
          <Text style={styles.searchPrompt}>
            "VP of Sales at Series B fintech in NYC…"
          </Text>
        </Pressable>
      </View>
    </GradientHero>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: space.lg, paddingBottom: space.xl },
  inner: { paddingHorizontal: space.md },
  eyebrow: {
    fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontSize: 22, fontWeight: '800', letterSpacing: -0.5,
    color: '#FFFFFF', marginTop: 4, marginBottom: 14,
  },
  searchCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.md,
    padding: space.md,
  },
  searchRow1: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchAsk: { fontSize: 11.5, color: '#FFFFFF', opacity: 0.95, fontWeight: '500' },
  searchPrompt: {
    fontSize: 13, fontWeight: '500',
    color: 'rgba(255,255,255,0.9)', marginTop: 6,
  },
});
```

### 1.3 `SignalCard` — new

`src/components/home/SignalCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TrendingUp, ArrowRight, Newspaper } from 'lucide-react-native';
import { LivePill } from '@/components/ui/LivePill';
import { color, radius, space } from '@/theme/tokens';

type SignalKind = 'funding' | 'jobChange' | 'news';

const ICON: Record<SignalKind, { Icon: any; bg: string; fg: string }> = {
  funding:   { Icon: TrendingUp, bg: color.liveTint,  fg: '#007A44' },
  jobChange: { Icon: ArrowRight, bg: color.warmTint,  fg: color.warmInk },
  news:      { Icon: Newspaper,  bg: color.brandTint, fg: color.brand },
};

export function SignalCard({
  kind,
  title,
  subtitle,
  live = false,
  onPress,
}: {
  kind: SignalKind;
  title: string;
  subtitle: string;
  live?: boolean;
  onPress?: () => void;
}) {
  const { Icon, bg, fg } = ICON[kind];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Icon size={18} color={fg} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {live && <LivePill size="sm" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // token: shadow.card
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  icon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: color.ink, lineHeight: 16 },
  subtitle: { fontSize: 11, color: color.muted, marginTop: 2 },
});
```

### 1.4 Upload row — compressed

Replace the current full-width `UploadContactsCard` on Home with:

```tsx
<Pressable
  onPress={() => router.push('/upload-contacts')}
  style={styles.uploadRow}
>
  <View style={styles.uploadIcon}>
    <Upload size={14} color={color.brand} strokeWidth={2.4} />
  </View>
  <View style={{ flex: 1 }}>
    <Text style={styles.uploadTitle}>Enrich phone contacts</Text>
    <Text style={styles.uploadSub}>Bulk-upload from device</Text>
  </View>
</Pressable>

// styles
uploadRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#D1D1DB',
  borderRadius: radius.md,
  marginHorizontal: space.md,
  marginTop: space.md,
},
uploadIcon: {
  width: 28, height: 28, borderRadius: 14,
  backgroundColor: color.brandTint,
  alignItems: 'center', justifyContent: 'center',
},
uploadTitle: { fontSize: 12, fontWeight: '700', color: color.ink },
uploadSub:   { fontSize: 10, color: color.muted, marginTop: 1, fontWeight: '500' },
```

### 1.5 Home QA checklist

- [ ] Header greeting pulls first name from auth store (fallback: "there")
- [ ] Signals count reflects live data (0 state shows "Ready to find…" copy)
- [ ] AI search card taps → opens Search tab with AI input focused
- [ ] Hot signals section shows 2–3 items, "See all →" navigates to Signals tab
- [ ] No emoji remain on screen (🔮 ✨ 📤 all replaced)
- [ ] Safe area insets respected on hero top
- [ ] Pull-to-refresh still works

---

## 2. Screen: Contact Detail (`app/contact/[id].tsx`)

**Current state:** Stacked InfoRows, purple "Reveal Contact Info" button, two buttons for Signals (Show / Register).

**Target state:** Hero with avatar + name + two primary actions (Call / Email), dark gradient "reveal hero" with masked previews, collapsed signals card.

### 2.1 Structure

```
<Stack.Screen header={CleanBackHeader} />
<ScrollView>
  <ContactHero {...c} />             ← new: avatar, name, role, 2 CTAs
  {!revealed && <RevealHeroCard />}  ← new: gradient card
  <Section title="Contact">
    {!revealed && <MaskedValueRow.../>}  ← new primitive
    {revealed  && <ContactInfoRow.../>}  ← existing
  </Section>
  <Section title="Recent signals">
    <SignalsCard compact />          ← collapse today's two-button layout
  </Section>
</ScrollView>
```

### 2.2 `ContactHero`

`src/components/contact/ContactHero.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Phone, Mail, Star } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';      // use existing if present
import { LivePill } from '@/components/ui/LivePill';
import { color, radius, space } from '@/theme/tokens';

export function ContactHero({
  name, role, company, verified = false, following = false,
  onCall, onEmail, onFollow,
}: {
  name: string; role: string; company: string;
  verified?: boolean; following?: boolean;
  onCall?: () => void; onEmail?: () => void; onFollow?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Avatar name={name} size={56} />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.role}>{role}</Text>
          <Text style={styles.company}>{company}</Text>
        </View>
      </View>

      <View style={styles.pills}>
        {verified && <LivePill label="LIVE · verified 2h ago" />}
        {following && (
          <View style={styles.followPill}>
            <Star size={10} color={color.brand} fill={color.brand} strokeWidth={2} />
            <Text style={styles.followText}>Following</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onCall} style={[styles.cta, styles.ctaCall]}>
          <Phone size={15} color={color.liveInk} strokeWidth={2.4} />
          <Text style={[styles.ctaText, { color: color.liveInk }]}>Call</Text>
        </Pressable>
        <Pressable onPress={onEmail} style={[styles.cta, styles.ctaEmail]}>
          <Mail size={15} color={color.brand} strokeWidth={2.4} />
          <Text style={[styles.ctaText, { color: color.brand }]}>Email</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', padding: space.md, paddingBottom: space.lg },
  row:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  info: { flex: 1 },
  name:    { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, color: color.ink },
  role:    { fontSize: 12, color: color.muted, marginTop: 2 },
  company: { fontSize: 12, fontWeight: '700', color: color.ink, marginTop: 2 },
  pills:   { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  followPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: color.brandTint,
    paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 999,
  },
  followText: { fontSize: 10, fontWeight: '700', color: color.brand },
  actions:    { flexDirection: 'row', gap: 8, marginTop: 14 },
  cta: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: radius.md,
  },
  ctaCall:  { backgroundColor: color.live },
  ctaEmail: { backgroundColor: color.brandTint },
  ctaText:  { fontSize: 12, fontWeight: '700' },
});
```

### 2.3 `RevealHeroCard`

`src/components/contact/RevealHeroCard.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { GradientHero } from '@/components/ui/GradientHero';
import { color, radius, space } from '@/theme/tokens';

export function RevealHeroCard({
  contactName,
  valueCount,    // e.g. { phones: 1, emails: 2, social: ['LinkedIn'] }
  creditCost = 1,
  onReveal,
}: {
  contactName: string;
  valueCount: { phones: number; emails: number; social?: string[] };
  creditCost?: number;
  onReveal?: () => void;
}) {
  const { phones, emails, social = [] } = valueCount;
  const summary = [
    phones  && `${phones} mobile${phones > 1 ? 's' : ''}`,
    emails  && `${emails} work email${emails > 1 ? 's' : ''}`,
    ...social,
  ].filter(Boolean).join(' · ');

  return (
    <GradientHero variant="dark" style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>◆ PREMIUM DATA</Text>
        </View>
        <Text style={styles.title}>Unlock {contactName.split(' ')[0]}'s direct line.</Text>
        <Text style={styles.sub}>{summary}</Text>
        <Pressable onPress={onReveal} style={styles.cta}>
          <Zap size={14} color={color.liveInk} strokeWidth={2.6} fill={color.liveInk} />
          <Text style={styles.ctaText}>
            Reveal · {creditCost} credit{creditCost > 1 ? 's' : ''}
          </Text>
        </Pressable>
      </View>
    </GradientHero>
  );
}

const styles = StyleSheet.create({
  card:  { marginHorizontal: space.md, marginTop: space.sm },
  inner: { padding: space.lg, alignItems: 'center' },
  chip:  {
    backgroundColor: color.liveTint,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    marginBottom: 10,
  },
  chipText: { fontSize: 10, fontWeight: '700', color: color.liveInk, letterSpacing: 0.3 },
  title: {
    fontSize: 15, fontWeight: '700', letterSpacing: -0.3,
    color: '#FFFFFF', textAlign: 'center', marginBottom: 3,
  },
  sub: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', marginBottom: 14,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: color.live,
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: radius.md,
    alignSelf: 'stretch',
  },
  ctaText: { fontSize: 12, fontWeight: '700', color: color.liveInk },
});
```

### 2.4 Wiring it up

In `app/contact/[id].tsx`, replace current section structure:

```tsx
// BEFORE
<Stack.Screen options={{ title: contact.name }} />
<View>{/* old hero with tiny name */}</View>
<Section title="CONTACT INFO">
  {!revealed
    ? <PrimaryButton icon="🔓" onPress={handleReveal}>Reveal Contact Info</PrimaryButton>
    : <InfoRow label="Mobile" value={phone} />}
</Section>
<Section title="SIGNALS">
  <ButtonRow>
    <GhostButton>Show Signals</GhostButton>
    <PrimaryButton>Register</PrimaryButton>
  </ButtonRow>
</Section>

// AFTER
<Stack.Screen options={{ headerShown: false }} />
<CleanBackHeader
  onBack={router.back}
  rightActions={[
    { icon: Star, onPress: toggleFollow, active: following },
    { icon: MoreHorizontal, onPress: openMenu },
  ]}
/>
<ContactHero
  name={c.name} role={c.role} company={c.company}
  verified={c.verifiedAt && isRecent(c.verifiedAt)}
  following={following}
  onCall={handleCall}
  onEmail={handleEmail}
/>
{!revealed && (
  <RevealHeroCard
    contactName={c.name}
    valueCount={{ phones: c.phoneCount, emails: c.emailCount, social: c.hasLinkedIn ? ['LinkedIn'] : [] }}
    creditCost={1}
    onReveal={handleReveal}
  />
)}
<Section title="Contact">
  {!revealed ? (
    <>
      {c.phoneCount > 0 && <MaskedValueRow label="MOBILE" masked="+1 ••• ••• ••••" live />}
      {c.emailCount > 0 && <MaskedValueRow label="EMAIL · WORK" masked={maskEmail(c)} />}
    </>
  ) : (
    <ContactInfoList phones={phones} emails={emails} />
  )}
</Section>
<Section title="Recent signals">
  <SignalsCompactCard events={c.signalEvents} />
</Section>
```

> **`CleanBackHeader`** is new — a transparent header with just chevron-back + icon slot on the right. Replaces Stack.Screen's default. If you prefer, you can keep the built-in header and just hide the title. It's in `src/components/ui/CleanBackHeader.tsx`:

```tsx
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { color, space } from '@/theme/tokens';

export function CleanBackHeader({
  onBack,
  rightActions = [],
}: {
  onBack: () => void;
  rightActions?: { icon: any; onPress: () => void; active?: boolean }[];
}) {
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <ChevronLeft size={22} color={color.brand} strokeWidth={2.4} />
      </Pressable>
      <View style={styles.right}>
        {rightActions.map(({ icon: Icon, onPress, active }, i) => (
          <Pressable key={i} onPress={onPress} hitSlop={8}>
            <Icon
              size={18}
              color={active ? color.brand : color.muted}
              strokeWidth={2.2}
              fill={active ? color.brand : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: space.sm, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  back:  { padding: 4 },
  right: { marginLeft: 'auto', flexDirection: 'row', gap: 14, paddingRight: 8 },
});
```

### 2.5 Contact Detail QA checklist

- [ ] Pre-reveal: dark gradient card shows correct count of phones/emails + LinkedIn if present
- [ ] Pre-reveal: masked values match shape of actual data (not just "•••")
- [ ] Post-reveal: hero CTAs (Call / Email) remain visible, data appears in place of masked rows
- [ ] "LIVE · verified 2h ago" pill shows only when `verifiedAt` is within 24h
- [ ] Follow star toggles without navigating
- [ ] DNC contacts show a different hero variant (red-outlined, no reveal card)
- [ ] Old signals two-button layout is gone
- [ ] Haptic feedback on reveal tap (`Haptics.impactAsync(Medium)`)

---

## 3. Screen: Company Detail (`app/company/[id].tsx`)

**Current state:** Hero + facts table + decision-makers + signals + funding. All sections equal weight.

**Target state:** Tight hero with banner + logo + 3-up stat grid, Decision-makers promoted to section #1 with inline Call/Reveal, facts table collapsed behind "See more."

### 3.1 Structure

```
<CleanBackHeader />
<CompanyHero />              ← banner + logo + name + 3 StatChips
<Section title="Decision makers · N" link="See all">
  <DecisionMakerRow />       ← avatar + name/role + QuickActionButton
</Section>
<Section title="Signals · last 30d">
  <SignalsCompactCard />
</Section>
<CollapsibleSection title="Company info">
  <InfoTable />              ← existing, moved behind a toggle
</CollapsibleSection>
```

### 3.2 `CompanyHero`

`src/components/company/CompanyHero.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatChip } from '@/components/ui/StatChip';  // from Phase 1
import { color, radius, space } from '@/theme/tokens';

export function CompanyHero({
  name, industry, location, domain,
  stats,
}: {
  name: string; industry: string; location: string; domain: string;
  stats: { employees: string; revenue: string; headcountDelta: string };
}) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[color.brandTint, '#E0F5E5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      />
      <View style={styles.logo}>
        <Text style={styles.logoText}>{name.charAt(0)}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>
          {[industry, location, domain].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={styles.stats}>
        <StatChip value={stats.employees}     label="Employees" />
        <StatChip value={stats.revenue}       label="Revenue" />
        <StatChip value={stats.headcountDelta} label="6mo headcount" tone="live" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { backgroundColor: '#FFFFFF', padding: space.md },
  banner: { height: 48, borderRadius: radius.md, marginBottom: -24 },
  logo: {
    width: 56, height: 56, borderRadius: radius.md,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEEE',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0B0B10', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: color.brand },
  name:     { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: color.ink },
  meta:     { fontSize: 12, color: color.muted, marginTop: 2 },
  stats:    { flexDirection: 'row', gap: 6, marginTop: 12 },
});
```

> **`StatChip` from Phase 1** must accept `tone="live"` to color the value green when heading up. If it doesn't yet, add:
> ```tsx
> const TONE = { default: color.ink, live: '#007A44', warm: color.warmInk, danger: color.danger };
> ```

### 3.3 `DecisionMakerRow`

`src/components/company/DecisionMakerRow.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { LivePill } from '@/components/ui/LivePill';
import { QuickActionButton } from '@/components/ui/QuickActionButton';
import { color, space } from '@/theme/tokens';

export function DecisionMakerRow({
  contact,
  onCall,
  onReveal,
}: {
  contact: { id: string; name: string; role: string; seniority?: string; revealed: boolean; live: boolean };
  onCall?: () => void;
  onReveal?: () => void;
}) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/contact/${contact.id}`)}
      style={styles.row}
    >
      <Avatar name={contact.name} size={36} />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.live && <LivePill size="xs" />}
        </View>
        <Text style={styles.role}>
          {contact.role}{contact.seniority ? ` · ${contact.seniority}` : ''}
        </Text>
      </View>
      {contact.revealed
        ? <QuickActionButton kind="call"   onPress={onCall} size={28} />
        : <Pressable onPress={onReveal} style={styles.revealPill}>
            <Text style={styles.revealText}>REVEAL</Text>
          </Pressable>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F3F5',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { fontSize: 13, fontWeight: '700', color: color.ink },
  role:    { fontSize: 11, color: color.muted, marginTop: 1 },
  revealPill: {
    paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: 10, backgroundColor: color.brandTint,
  },
  revealText: { fontSize: 11, fontWeight: '700', color: color.brand, letterSpacing: 0.3 },
});
```

### 3.4 Company info collapsible

Wrap the current facts InfoTable:

```tsx
<CollapsibleSection title="Company info" initiallyCollapsed>
  <InfoRow label="Primary industry" value={c.industry} />
  <InfoRow label="SIC"              value={c.sic} />
  <InfoRow label="NAICS"            value={c.naics} />
  <InfoRow label="Specialties"      value={c.specialties?.join(', ')} />
  <InfoRow label="Founded"          value={c.foundedYear} />
  <InfoRow label="Revenue"          value={c.revenueBand} />
</CollapsibleSection>
```

`src/components/ui/CollapsibleSection.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { color, space } from '@/theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function CollapsibleSection({
  title, initiallyCollapsed = true, children,
}: { title: string; initiallyCollapsed?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!initiallyCollapsed);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };
  const Chev = open ? ChevronUp : ChevronDown;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Chev size={16} color={color.muted} strokeWidth={2.2} />
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { backgroundColor: '#FFFFFF', paddingHorizontal: space.md },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title:  { fontSize: 13, fontWeight: '700', color: color.ink },
  body:   { paddingBottom: space.md },
});
```

### 3.5 Company QA checklist

- [ ] 3-up stat grid fits on one line at 320px width without clipping
- [ ] Decision-makers shows sorted by seniority (SVP > VP > Director > …)
- [ ] Revealed contacts show green Call button, others show "REVEAL" pill
- [ ] Tapping row navigates to contact detail; tapping Call/Reveal does NOT (stopPropagation)
- [ ] Banner gradient renders on iOS + Android
- [ ] Company info collapsed by default; opens with animation
- [ ] Signals auto-fetch if API key present, hide section otherwise

---

## 4. Shared: `ContactCard` unification

**Why:** Search, Lists, Recommendations all render contact rows. Today they use slightly different layouts. Unify into one `ContactCard` variant used by all three.

### 4.1 Replace `src/components/ContactCard.tsx`

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { LivePill } from '@/components/ui/LivePill';
import { QuickActionButton } from '@/components/ui/QuickActionButton';
import { color, space } from '@/theme/tokens';

export type Contact = {
  id: string;
  name: string;
  role: string;
  company: string;
  location?: string;
  revealed: boolean;
  live: boolean;
  dnc?: boolean;
};

export function ContactCard({
  contact, onCall, onReveal, onSave,
}: {
  contact: Contact;
  onCall?: () => void;
  onReveal?: () => void;
  onSave?: () => void;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/contact/${contact.id}`)}
      style={styles.row}
    >
      <Avatar name={contact.name} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
          {contact.live && <LivePill size="xs" />}
          {contact.dnc && <DncPill />}
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {contact.role} · {contact.company}
        </Text>
        {contact.location && (
          <Text style={styles.loc} numberOfLines={1}>{contact.location}</Text>
        )}
      </View>
      {contact.dnc ? null : contact.revealed ? (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <QuickActionButton kind="call" onPress={onCall} size={28} />
          <Text style={styles.saveHint}>SAVE →</Text>
        </View>
      ) : (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <QuickActionButton kind="reveal" onPress={onReveal} size={28} />
          <Text style={styles.revealHint}>REVEAL</Text>
        </View>
      )}
    </Pressable>
  );
}

function DncPill() {
  return (
    <View style={styles.dnc}>
      <Text style={styles.dncText}>DNC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12, paddingHorizontal: space.md,
    borderBottomWidth: 1, borderBottomColor: '#F3F3F5',
  },
  body:    { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:    { fontSize: 13, fontWeight: '700', color: color.ink },
  sub:     { fontSize: 11, color: color.muted, marginTop: 1 },
  loc:     { fontSize: 10, color: color.muted, marginTop: 2 },
  dnc:     {
    backgroundColor: '#FFE4E8',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  dncText:    { fontSize: 8.5, fontWeight: '700', color: '#A80025', letterSpacing: 0.3 },
  saveHint:   { fontSize: 9, color: color.muted, fontWeight: '600' },
  revealHint: { fontSize: 9, color: color.brand, fontWeight: '700' },
});
```

### 4.2 Swipe-to-save gesture (nice-to-have, can defer)

Wrap `ContactCard` in `react-native-gesture-handler`'s `Swipeable`:

```tsx
import { Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <Pressable style={styles.saveAction} onPress={onSave}>
      <Plus size={18} color="#FFFFFF" />
      <Text style={styles.saveActionText}>Save</Text>
    </Pressable>
  )}
>
  <ContactCard {...props} />
</Swipeable>
```

### 4.3 Migration checklist

- [ ] Search results use new `ContactCard`
- [ ] List Detail uses new `ContactCard`
- [ ] Recommendations uses new `ContactCard`
- [ ] No other ContactCard variants exist (grep for `ContactCard`, `ContactRow`, `ContactItem`)
- [ ] Row heights are consistent across all three screens
- [ ] One-tap call works on already-revealed contacts
- [ ] One-tap reveal shows credit-cost confirm sheet

---

## 5. End-to-end QA checklist (full Phase 2)

Run these after all four changes land:

### Visual consistency
- [ ] Hero gradient (purple → lilac) appears on Home header and Contact reveal card
- [ ] Dark gradient (black → purple) appears on Contact reveal + Company hero (if adopted) + Account credits (Phase 3)
- [ ] Every contact row across the app uses the same `ContactCard`
- [ ] All primary CTAs use radius 10 (`radius.md`)
- [ ] Section labels use 11px uppercase + muted color
- [ ] No emoji remain on Home, Contact, Company, or Search rows

### Behavior
- [ ] Home pull-to-refresh reloads signals + recommendations
- [ ] AI search card on Home navigates to Search with focus on AI input
- [ ] Reveal hero on Contact Detail shows correct credit cost
- [ ] Reveal → haptic + credit decrement + masked rows replaced with real data
- [ ] Contact star-follow toggles without navigating away
- [ ] Company hero stat "6mo headcount" shows ▲/▼ arrow based on delta sign
- [ ] Decision-maker row inline actions do not trigger row navigation
- [ ] Collapsible "Company info" animates open/close

### Performance
- [ ] No dropped frames when scrolling a 100+ item list with new ContactCard
- [ ] Gradient components memoized (no re-render on parent state changes)
- [ ] Avatars memoized by name hash

### Accessibility
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Color contrast: white text on `color.brand` ≥ 4.5:1 ✓ (already passes)
- [ ] Live pill color-independent (text "LIVE" + dot, not color alone)
- [ ] Minimum hit target 44×44 on all tap areas

### Edge cases
- [ ] DNC contact on Contact Detail: red-outlined hero, no reveal card
- [ ] Contact with 0 phones + 0 emails: reveal hero shows "Social profiles only"
- [ ] Company with no decision makers: empty state with "Find contacts" CTA
- [ ] Company with no signals API key: hide Signals section entirely

---

## 6. Rollout strategy

Recommend this order within Phase 2:

| Step | Change | Why first |
|------|--------|-----------|
| 1 | `ContactCard` unification | Unblocks visual consistency on 3 screens at once |
| 2 | Company Detail | Lowest-risk full-screen redesign; exercises `StatChip` + new primitives |
| 3 | Contact Detail | Highest value but most complex; leverages `RevealHeroCard` |
| 4 | Home | Needs signals-on-home data plumbing; most dependencies |

Each step is independently shippable behind a feature flag if you want to A/B test. Suggested flag names: `home_v2`, `contact_detail_v2`, `company_detail_v2`, `contact_card_v2`.

---

## 7. Open questions for the dev agent

If any of these block implementation, pause and log in `PHASE_2_QUESTIONS.md`:

1. **Auth store shape** — does `useAuthStore().user` have `firstName` / `givenName`? If not, what's the best source for a first-name-only greeting?
2. **Signals store** — is there a `recent` or `today` selector that returns signals from the last 24h? If not, we need to add one.
3. **`verifiedAt` field on Contact** — does the API return this? If not, is there a `lastValidatedAt` or similar?
4. **Credit cost per reveal** — hardcoded to 1, or variable per contact tier?
5. **Haptics** — is `expo-haptics` already imported elsewhere? If not, `npx expo install expo-haptics`.
6. **LinearGradient** — is `expo-linear-gradient` in use? If not, `npx expo install expo-linear-gradient`.

---

## 8. Files you'll touch

### New files
- `src/components/ui/GradientHero.tsx`
- `src/components/ui/QuickActionButton.tsx`
- `src/components/ui/MaskedValueRow.tsx`
- `src/components/ui/CollapsibleSection.tsx`
- `src/components/ui/CleanBackHeader.tsx`
- `src/components/home/HomeHero.tsx`
- `src/components/home/SignalCard.tsx`
- `src/components/contact/ContactHero.tsx`
- `src/components/contact/RevealHeroCard.tsx`
- `src/components/contact/SignalsCompactCard.tsx`
- `src/components/company/CompanyHero.tsx`
- `src/components/company/DecisionMakerRow.tsx`

### Modified files
- `app/(tabs)/home.tsx` — replace layout with new Hero + sections
- `app/contact/[id].tsx` — new hero + reveal card + masked rows
- `app/company/[id].tsx` — new hero + DM-first order + collapsible facts
- `src/components/ContactCard.tsx` — unified row

### Untouched (Phase 1 only)
- `src/theme/tokens.ts`
- `tailwind.config.js`
- `src/components/ui/LivePill.tsx`
- `src/components/ui/StatChip.tsx`
- `src/components/ui/SegmentFilter.tsx`
- `src/components/ui/Card.tsx`

---

**End of Phase 2 handoff.** When this is merged, ping me and I'll prepare Phase 3 (Signals teaser, Account credit hero, Upload picker, Login hero cover, dark-mode foundations).
