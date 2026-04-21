# Lusha ToGo — Phase 3 Handoff

**Scope:** The remaining tail screens + the dark-mode foundation. Polishes the experience end-to-end and unlocks system-wide theming.

**Target screens:**
1. **Signals** — `app/(tabs)/signals.tsx` (teaser + preview for non-activated users, grouped feed for activated)
2. **Account** — `app/(tabs)/account.tsx` (credit hero + collapsed settings list)
3. **Upload Contacts** — `app/upload-contacts.tsx` (grouped picker + sticky selection bar)
4. **Login** — `app/(auth)/login.tsx` (dark gradient hero cover)
5. **List Detail + Recommendations** — `app/list/[id].tsx`, `app/recommendations.tsx` (large title, segment filter strip, infinite scroll)
6. **Dark mode foundations** — theme provider, `useColorScheme` wiring, Appearance setting

**Estimated effort:** ~2 weeks for one FE engineer (dark mode = ~½ of that).

**Prerequisite:** Phase 1 and Phase 2 must be merged. Primitives used here:
- From Phase 1: `LivePill`, `StatChip`, `SegmentFilter`, `Card`
- From Phase 2: `GradientHero`, `QuickActionButton`, `MaskedValueRow`, `CollapsibleSection`, `CleanBackHeader`, `ContactCard` (unified)

---

## 0. Pre-flight

- `expo-linear-gradient` installed (from Phase 2).
- `expo-haptics` installed (from Phase 2).
- `react-native-gesture-handler` installed.
- `@react-native-async-storage/async-storage` for persisting the Appearance preference.
- New dependency check: `nanoid` or similar for generating preview-signal IDs (optional — can reuse existing ID util).

---

## 1. New shared primitives to add first

### 1.1 `src/components/ui/Section.tsx`

Unified section header used on every tab screen (Signals, Account, List Detail, Recommendations). Replaces inline repeated header blocks.

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, space } from '@/theme/tokens';

export function Section({
  title, subtitle, count, linkLabel, onLinkPress, children,
}: {
  title: string;
  subtitle?: string;
  count?: number | string;
  linkLabel?: string;
  onLinkPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {count != null && <Text style={styles.count}>· {count}</Text>}
          </View>
          {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
        </View>
        {linkLabel && (
          <Pressable onPress={onLinkPress} hitSlop={8}>
            <Text style={styles.link}>{linkLabel} →</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: color.ink, letterSpacing: -0.3 },
  count: { fontSize: 15, fontWeight: '800', color: color.brand, letterSpacing: -0.3 },
  sub:   { fontSize: 11, color: color.muted, marginTop: 2 },
  link:  { fontSize: 10, fontWeight: '700', color: color.brand, letterSpacing: 0.5 },
});
```

### 1.2 `src/components/ui/SettingsGroup.tsx`

iOS-style grouped list for Account settings.

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { color, radius, space } from '@/theme/tokens';

export type SettingsRow = {
  icon?: React.ComponentType<any>;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

export function SettingsGroup({ rows }: { rows: SettingsRow[] }) {
  return (
    <View style={styles.group}>
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        const Icon = r.icon;
        const textColor = r.danger ? color.danger : color.ink;
        return (
          <Pressable
            key={i}
            onPress={r.onPress}
            style={[styles.row, !isLast && styles.rowBorder]}
          >
            {Icon && (
              <Icon
                size={16}
                color={r.iconColor ?? (r.danger ? color.danger : color.muted)}
                strokeWidth={2.2}
                style={{ width: 22 }}
              />
            )}
            <Text style={[styles.label, { color: textColor }]}>{r.label}</Text>
            {r.value && <Text style={styles.value}>{r.value}</Text>}
            {!r.danger && <ChevronRight size={14} color={color.muted} strokeWidth={2.2} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    marginHorizontal: space.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F3F5' },
  label: { flex: 1, fontSize: 13 },
  value: { fontSize: 11, color: color.muted },
});
```

### 1.3 `src/components/ui/StickyActionBar.tsx`

Top- or bottom-docked purple action bar. Used by Upload Contacts selection state, can be reused for bulk actions elsewhere.

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { color, radius, space } from '@/theme/tokens';

export function StickyActionBar({
  count, caption, actionLabel, onPress,
}: {
  count: number;
  caption: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.countChip}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{count} selected</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <Pressable onPress={onPress} style={styles.action} hitSlop={8}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: color.brand,
    paddingHorizontal: space.md, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  countChip: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  title:     { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  caption:   { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  action: {
    backgroundColor: color.live,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: radius.sm,
  },
  actionText: { color: color.liveInk, fontWeight: '700', fontSize: 11 },
});
```

---

## 2. Screen: Signals (`app/(tabs)/signals.tsx`)

**Current state:** Cold empty state asking the user to paste an API key.

**Target state:** Rich teaser card when not activated; grouped-by-day feed when activated.

### 2.1 Structure

```
<Header title="Signals" subtitle="Real-time alerts on contacts & companies" />
<Tabs value={tab} options={[
  { value: 'activity',  label: 'Activity',  badge: unread },
  { value: 'following', label: 'Following · 12' },
]} />
{apiKey
  ? <ActivityFeed grouped />
  : <SignalsTeaser />}
```

### 2.2 `SignalsTeaser` component

`src/components/signals/SignalsTeaser.tsx`:

```tsx
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TrendingUp, ArrowRight, Zap, Users, Briefcase, Bell } from 'lucide-react-native';
import { GradientHero } from '@/components/ui/GradientHero';
import { color, radius, space } from '@/theme/tokens';

const SAMPLE_SIGNALS = [
  { Icon: TrendingUp, bg: color.liveTint,  fg: '#007A44',  title: 'Stripe raised Series I · $42M', sub: 'Nov 8 · 2 days ago' },
  { Icon: ArrowRight, bg: color.warmTint,  fg: color.warmInk, title: 'Sarah Chen · promoted to SVP',   sub: 'Nov 6 · 4 days ago' },
];

const FEATURES = [
  { Icon: Zap,      title: 'Funding rounds & IT-spend changes' },
  { Icon: ArrowRight, title: 'Job moves & promotions of followed contacts' },
  { Icon: Users,    title: 'Hiring surges by dept & location' },
  { Icon: Bell,     title: 'Push notifications when anything fires' },
];

export function SignalsTeaser({ onActivate }: { onActivate: () => void }) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xl }}>
      <View style={{ padding: space.md }}>
        <GradientHero variant="brand" style={styles.card}>
          <View style={styles.inner}>
            <Text style={styles.eyebrow}>▶ PREVIEW · NOT ACTIVATED</Text>
            <Text style={styles.title}>See the last 7 days.</Text>
            <Text style={styles.sub}>This is a sample of what you'd see.</Text>

            {SAMPLE_SIGNALS.map((s, i) => {
              const { Icon } = s;
              return (
                <View
                  key={i}
                  style={[styles.sampleRow, i === 1 && { opacity: 0.6 }]}
                >
                  <View style={[styles.sampleIcon, { backgroundColor: s.bg }]}>
                    <Icon size={14} color={s.fg} strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sampleTitle}>{s.title}</Text>
                    <Text style={styles.sampleSub}>{s.sub}</Text>
                  </View>
                </View>
              );
            })}

            <Pressable onPress={onActivate} style={styles.cta} hitSlop={6}>
              <Zap size={13} color={color.liveInk} strokeWidth={2.6} />
              <Text style={styles.ctaText}>Activate with API key →</Text>
            </Pressable>
          </View>
        </GradientHero>
      </View>

      <View style={styles.featureGrid}>
        {FEATURES.map((f, i) => {
          const { Icon } = f;
          return (
            <View key={i} style={styles.featureCard}>
              <Icon size={18} color={color.brand} strokeWidth={2.2} />
              <Text style={styles.featureText}>{f.title}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card:  { borderRadius: radius.lg },
  inner: { padding: space.lg },
  eyebrow: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1 },
  title:   { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 6, letterSpacing: -0.3 },
  sub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  sampleRow: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm, padding: 10,
  },
  sampleIcon: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  sampleTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sampleSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  cta: {
    marginTop: 14,
    backgroundColor: color.live,
    paddingVertical: 12,
    borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  ctaText: { fontSize: 12, fontWeight: '700', color: color.liveInk },

  featureGrid: {
    paddingHorizontal: space.md,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    shadowColor: '#0B0B10', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  featureText: { fontSize: 11, fontWeight: '700', color: color.ink, marginTop: 6, lineHeight: 15 },
});
```

### 2.3 `ActivityFeed` — grouped-by-day

Replace the current flat FlatList with day-grouped sections:

```tsx
import React, { useMemo } from 'react';
import { SectionList } from 'react-native';
import { SignalCard } from '@/components/home/SignalCard';
import { Section } from '@/components/ui/Section';
import { groupSignalsByDay } from '@/lib/signals';  // see helper below

export function ActivityFeed({ events }: { events: SignalEvent[] }) {
  const sections = useMemo(() => groupSignalsByDay(events), [events]);
  return (
    <SectionList
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Section title={section.label} count={section.data.length} />
      )}
      renderItem={({ item }) => <SignalCard {...item} />}
      contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: 80 }}
    />
  );
}
```

Helper — `src/lib/signals.ts`:

```ts
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';

export function groupSignalsByDay(events: SignalEvent[]) {
  const buckets = new Map<string, { label: string; data: SignalEvent[] }>();
  for (const e of events) {
    const d = new Date(e.occurredAt);
    const key = format(d, 'yyyy-MM-dd');
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d');
    if (!buckets.has(key)) buckets.set(key, { label, data: [] });
    buckets.get(key)!.data.push(e);
  }
  return [...buckets.values()].sort((a, b) =>
    a.data[0].occurredAt < b.data[0].occurredAt ? 1 : -1,
  );
}
```

### 2.4 "Following" tab — entity-first layout

Card per followed entity with a per-entity signal count.

```tsx
<FollowingList>
  {entities.map(e => (
    <Pressable key={e.id} onPress={() => navigate(e)} style={styles.followRow}>
      <Avatar name={e.name} size={40} kind={e.type /* 'contact' | 'company' */} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{e.name}</Text>
        <Text style={styles.sub}>{e.role ?? e.industry} · {e.signalCount} signals</Text>
      </View>
      <Pressable onPress={() => unfollow(e)}>
        <Text style={styles.unfollow}>UNFOLLOW</Text>
      </Pressable>
    </Pressable>
  ))}
</FollowingList>
```

### 2.5 Signals QA checklist

- [ ] No API key → teaser card renders, "Activate" opens the key-setup sheet from Account
- [ ] With API key + 0 events → activity tab shows "Catching up…" skeleton, then empty state
- [ ] With events → grouped by Today / Yesterday / date
- [ ] Unread badge on tab accurately reflects `unreadCount`
- [ ] Following tab shows all entities with correct counts
- [ ] Tapping an entity goes to contact or company detail (matched by type)
- [ ] Pull-to-refresh re-fetches and resets grouping

---

## 3. Screen: Account (`app/(tabs)/account.tsx`)

**Current state:** 5 equal-weight sections.

**Target state:** Profile + dark gradient credit hero + compact Signals-status row + grouped settings list.

### 3.1 Structure

```
<ScrollView>
  <ProfileHeader />
  <CreditsHero />                ← dark gradient, big number
  <SignalsStatusRow />           ← single card replacing old section
  <Section title="Settings" />
  <SettingsGroup rows={[
    { icon: Bell,       label: 'Notifications',    onPress: ... },
    { icon: Moon,       label: 'Appearance',       value: 'Light', onPress: ... },  // see §7
    { icon: HelpCircle, label: 'Help & Support',   onPress: ... },
    { icon: LogOut,     label: 'Sign out',         onPress: ..., danger: true },
  ]} />
  <VersionFooter />
</ScrollView>
```

### 3.2 `CreditsHero`

`src/components/account/CreditsHero.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientHero } from '@/components/ui/GradientHero';
import { color, radius, space } from '@/theme/tokens';

export function CreditsHero({
  used, total, resetsOn, dailyPace,
}: {
  used: number; total: number; resetsOn: string; dailyPace: number;
}) {
  const remaining = Math.max(total - used, 0);
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <View style={{ paddingHorizontal: space.md }}>
      <GradientHero variant="dark" style={styles.card}>
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>MONTHLY CREDITS</Text>
            <Text style={styles.resets}>resets {resetsOn}</Text>
          </View>
          <View style={styles.numberRow}>
            <Text style={styles.big}>{remaining.toLocaleString()}</Text>
            <Text style={styles.of}>of {total.toLocaleString()} left</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.caption}>
            {Math.round(pct)}% remaining · ~{dailyPace} reveals/day pace
          </Text>
        </View>
      </GradientHero>
    </View>
  );
}

const styles = StyleSheet.create({
  card:   { borderRadius: radius.lg, marginVertical: space.md },
  inner:  { padding: space.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow:{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1 },
  resets: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  numberRow: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontSize: 32, fontWeight: '800', letterSpacing: -1, color: '#FFFFFF' },
  of:  { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  track: {
    height: 6, marginTop: 10, borderRadius: 3, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fill:   { height: '100%', backgroundColor: color.live, borderRadius: 3 },
  caption:{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
});
```

### 3.3 `SignalsStatusRow`

Replaces the old full "Signals setup" section with a single card:

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Radar, ChevronRight } from 'lucide-react-native';
import { color, radius, space } from '@/theme/tokens';

export function SignalsStatusRow({
  connected, entityCount, maskedKey, onPress,
}: {
  connected: boolean;
  entityCount?: number;
  maskedKey?: string;       // e.g. '••••f7e2'
  onPress: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: space.md, marginBottom: space.sm }}>
      <Pressable onPress={onPress} style={styles.card}>
        <View style={[styles.icon, { backgroundColor: connected ? color.liveTint : color.brandTint }]}>
          <Radar
            size={15}
            color={connected ? '#007A44' : color.brand}
            strokeWidth={2.2}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Signals · {connected ? 'connected' : 'not connected'}
          </Text>
          <Text style={styles.sub}>
            {connected
              ? `${entityCount} entities · API key ${maskedKey}`
              : 'Set up your API key to start receiving signals'}
          </Text>
        </View>
        <ChevronRight size={18} color={color.muted} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: radius.md, padding: 14,
  },
  icon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '700', color: color.ink },
  sub:   { fontSize: 11, color: color.muted, marginTop: 2 },
});
```

### 3.4 Account QA checklist

- [ ] Credits hero big number = `total - used`, not "used"
- [ ] Progress bar color flips to `warm` when remaining < 20%, `danger` when < 5%
- [ ] Daily pace = `used / daysElapsedInPeriod` rounded
- [ ] Signals row opens the same setup sheet previously used in the section
- [ ] Appearance row reflects current scheme (Light / Dark / System)
- [ ] Sign-out row shows the confirmation alert (no regression)
- [ ] Version footer shows `Constants.expoConfig.version` dynamically
- [ ] User ID and technical fields are only visible under Help → About

---

## 4. Screen: Upload Contacts (`app/upload-contacts.tsx`)

**Current state:** Flat checkbox list with bottom upload bar.

**Target state:** Grouped picker (Recently contacted / By company / A–Z), sticky purple action bar at top.

### 4.1 Structure

```
<ScreenHeader
  leftLabel="Cancel" onLeft={router.back}
  rightLabel={allSelected ? 'Clear' : `Select all ${total}`} onRight={toggleAll}
  title="Enrich contacts"
  subtitle="Pick contacts to enrich with Lusha data"
/>
{selected.length > 0 && (
  <StickyActionBar
    count={selected.length}
    caption={`${selected.length} credit${selected.length > 1 ? 's' : ''} · ~${eta} to enrich`}
    actionLabel="Upload →"
    onPress={handleUpload}
  />
)}
<SectionList
  sections={[
    { label: 'RECENTLY CONTACTED', data: recents },
    ...Array.from(byCompany.entries()).map(([co, rows]) => ({ label: `FROM ${co.toUpperCase()} · ${rows.length}`, data: rows })),
    { label: 'A–Z', data: rest },
  ]}
  ...
/>
```

### 4.2 `ContactPickerRow`

```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { color, radius, space } from '@/theme/tokens';

export function ContactPickerRow({
  contact, selected, onToggle,
}: {
  contact: { id: string; name: string; role?: string; company?: string };
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.box, selected ? styles.boxOn : styles.boxOff]}>
        {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <Avatar name={contact.name} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{contact.name}</Text>
        {(contact.role || contact.company) && (
          <Text style={styles.sub} numberOfLines={1}>
            {[contact.role, contact.company].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  box: {
    width: 22, height: 22, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  boxOn:  { backgroundColor: color.brand },
  boxOff: { borderWidth: 1.5, borderColor: '#D1D1DB' },
  name: { fontSize: 12, fontWeight: '700', color: color.ink },
  sub:  { fontSize: 10, color: color.muted },
});
```

### 4.3 Grouping logic — `src/lib/contactGrouping.ts`

```ts
import type { DeviceContact } from '@/types';

export function groupForPicker(
  contacts: DeviceContact[],
  recentIds: Set<string>,
): Array<{ label: string; key: string; data: DeviceContact[] }> {
  const recents = contacts.filter(c => recentIds.has(c.id));
  const remaining = contacts.filter(c => !recentIds.has(c.id));

  // Group remaining by company
  const byCompany = new Map<string, DeviceContact[]>();
  const noCompany: DeviceContact[] = [];
  for (const c of remaining) {
    if (c.company && c.company.trim()) {
      if (!byCompany.has(c.company)) byCompany.set(c.company, []);
      byCompany.get(c.company)!.push(c);
    } else {
      noCompany.push(c);
    }
  }

  // Only surface companies with >=3 contacts — rest goes into A–Z
  const companyGroups: Array<{ label: string; key: string; data: DeviceContact[] }> = [];
  const azPile: DeviceContact[] = [...noCompany];
  for (const [co, rows] of byCompany) {
    if (rows.length >= 3) {
      companyGroups.push({
        label: `FROM ${co.toUpperCase()} · ${rows.length}`,
        key: `co:${co}`,
        data: rows.sort((a, b) => a.name.localeCompare(b.name)),
      });
    } else {
      azPile.push(...rows);
    }
  }

  return [
    ...(recents.length > 0
      ? [{ label: 'RECENTLY CONTACTED', key: 'recent', data: recents }]
      : []),
    ...companyGroups.sort((a, b) => b.data.length - a.data.length),
    ...(azPile.length > 0
      ? [{ label: 'A–Z', key: 'az', data: azPile.sort((a, b) => a.name.localeCompare(b.name)) }]
      : []),
  ];
}
```

### 4.4 Success screen

Replace the current emoji + "Done" screen with:

```tsx
<SuccessView
  title="12 contacts queued"
  subtitle="Enrichment in progress. Check the list for results."
  primaryLabel="View list"
  onPrimary={() => router.replace(`/list/${newListId}`)}
  secondaryLabel="Done"
  onSecondary={router.back}
/>
```

### 4.5 Upload QA checklist

- [ ] Header "Select all N" toggles to "Clear" when all selected
- [ ] Sticky action bar hides when nothing selected (the list reclaims the space)
- [ ] Credits equal to selection count (unless skipping invalid/already-enriched)
- [ ] ETA heuristic: `ceil(selected.length / 5) minutes`
- [ ] Groups appear only if relevant (no empty "Recently contacted" if none)
- [ ] Large lists (>500) still scroll smoothly — `getItemLayout` on SectionList
- [ ] Success → "View list" navigates to the actual created list

---

## 5. Screen: Login (`app/(auth)/login.tsx`)

**Current state:** Centered form on grey canvas, SSO inside a collapsible.

**Target state:** Dark gradient hero cover with brand mark + value prop, form in a rounded white sheet pulled over the hero.

### 5.1 Structure

```
<KeyboardAvoidingView>
  <LoginHeroCover />              ← dark, gradient, brand mark + tagline
  <LoginFormSheet />              ← white rounded top, pulled up
</KeyboardAvoidingView>
```

### 5.2 `LoginHeroCover`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, space } from '@/theme/tokens';

export function LoginHeroCover() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#0B0B10', '#0B0B10']}
        style={StyleSheet.absoluteFill}
      />
      {/* Two overlay gradients for the color wash */}
      <LinearGradient
        colors={['rgba(111,69,255,0.55)', 'transparent']}
        start={{ x: 0.2, y: 0.15 }}
        end={{ x: 1, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,210,122,0.25)']}
        start={{ x: 0.3, y: 0.4 }}
        end={{ x: 0.9, y: 0.85 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        <View style={styles.mark}><Text style={styles.markText}>L</Text></View>
        <Text style={styles.title}>Sell smarter. From anywhere.</Text>
        <Text style={styles.sub}>
          Verified B2B contacts in your pocket. Sign in to sync your pipeline.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: '55%', overflow: 'hidden' },
  inner: { flex: 1, padding: space.xl, justifyContent: 'flex-end' },
  mark: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: color.brand,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 'auto',
  },
  markText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  title: {
    color: '#FFFFFF', fontSize: 28, fontWeight: '800',
    letterSpacing: -1, lineHeight: 30, maxWidth: 260,
  },
  sub: {
    color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18,
    maxWidth: 260, marginTop: 8,
  },
});
```

### 5.3 `LoginFormSheet`

```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import { color, radius, space } from '@/theme/tokens';

export function LoginFormSheet({
  onSubmit, onSso, onSaml, busy = false,
}: {
  onSubmit: (email: string, password: string) => void;
  onSso: () => void;
  onSaml: () => void;
  busy?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  return (
    <View style={styles.sheet}>
      <Text style={styles.label}>SIGN IN</Text>

      <View style={styles.input}>
        <Mail size={14} color={color.muted} strokeWidth={2.2} />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="work email"
          placeholderTextColor={color.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={styles.inputText}
        />
      </View>
      <View style={styles.input}>
        <Lock size={14} color={color.muted} strokeWidth={2.2} />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="password"
          placeholderTextColor={color.muted}
          secureTextEntry={!showPw}
          autoComplete="password"
          style={styles.inputText}
        />
        <Pressable onPress={() => setShowPw(v => !v)} hitSlop={8}>
          <Text style={styles.showBtn}>{showPw ? 'HIDE' : 'SHOW'}</Text>
        </Pressable>
      </View>

      <Pressable
        disabled={busy}
        onPress={() => onSubmit(email, password)}
        style={[styles.primary, busy && { opacity: 0.5 }]}
      >
        <Text style={styles.primaryText}>{busy ? 'Signing in…' : 'Sign In'}</Text>
        {!busy && <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.4} />}
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.ssoRow}>
        <Pressable onPress={onSso} style={styles.ssoBtn}>
          <Text style={styles.ssoText}>SSO</Text>
        </Pressable>
        <Pressable onPress={onSaml} style={styles.ssoBtn}>
          <Text style={styles.ssoText}>SAML</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: space.lg,
    marginTop: -22,
  },
  label: {
    fontSize: 10, fontWeight: '700', color: color.muted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 8,
  },
  inputText: { flex: 1, fontSize: 13, color: color.ink, padding: 0 },
  showBtn: { fontSize: 10, color: color.brand, fontWeight: '700' },
  primary: {
    marginTop: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: color.brand,
    paddingVertical: 13, borderRadius: radius.md,
  },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, marginBottom: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEEEEE' },
  dividerText: { fontSize: 10, color: color.muted, letterSpacing: 0.3 },
  ssoRow: { flexDirection: 'row', gap: 8 },
  ssoBtn: {
    flex: 1, backgroundColor: '#F5F5F7',
    paddingVertical: 11, borderRadius: radius.md,
    alignItems: 'center',
  },
  ssoText: { fontSize: 11, fontWeight: '700', color: color.ink },
});
```

### 5.4 Wiring

Replace the current `login.tsx` body:

```tsx
return (
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#0B0B10' }}>
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <LoginHeroCover />
      <LoginFormSheet
        onSubmit={handleEmailLogin}
        onSso={handleSso}
        onSaml={handleSaml}
        busy={loading}
      />
    </ScrollView>
  </KeyboardAvoidingView>
);
```

**Keep** all existing auth logic — `loginWithEmail`, CAPTCHA WebView fallback, cookie polling, `setTokens`. Only the visual shell changes.

### 5.5 Login QA checklist

- [ ] Gradient visible on iOS + Android
- [ ] Keyboard open: form sheet scrolls up; hero cover compresses but stays visible
- [ ] Password visibility toggle works; "SHOW"/"HIDE" toggles correctly
- [ ] SSO / SAML buttons route to existing flows
- [ ] Error state (wrong password) still displays under inputs
- [ ] "Sign in" button disabled + label changes during network call
- [ ] CAPTCHA WebView fallback still appears when triggered

---

## 6. Screens: List Detail + Recommendations

These share a pattern — collapsing them into one section.

### 6.1 Target structure (both screens)

```
<CleanBackHeader />
<ScreenTitle
  title="Enterprise Prospects"     // list name or "Recommendations"
  meta="412 contacts · 268 revealed (65%) · last add 2d ago"
/>
<SegmentFilter
  value={filter}
  options={[
    { value: 'all',       label: 'All' },
    { value: 'revealed',  label: `Revealed · ${counts.revealed}` },
    { value: 'live',      label: `Live · ${counts.live}` },
    { value: 'dnc',       label: `DNC · ${counts.dnc}` },
  ]}
/>
<FlatList
  data={filtered}
  renderItem={({ item }) => <ContactCard contact={item} ... />}
  onEndReached={loadMore}
  onEndReachedThreshold={0.4}
  ListFooterComponent={isLoading ? <Spinner /> : null}
/>
```

### 6.2 `ScreenTitle`

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, space } from '@/theme/tokens';

export function ScreenTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {meta && <Text style={styles.meta}>{meta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { backgroundColor: '#FFFFFF', paddingHorizontal: space.md, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: color.ink },
  meta:  { fontSize: 11, color: color.muted, marginTop: 2 },
});
```

### 6.3 Drop "Load More" button

Replace the full-width "Load More" CTA with `onEndReached` + a footer spinner. No more manual pagination button.

### 6.4 Recommendations: drop the purple pill toggle

Today Recommendations uses a custom contacts/companies toggle. Replace with the same `SegmentFilter` as List Detail — the options become `[{value:'contacts'}, {value:'companies'}]`.

### 6.5 QA checklist

- [ ] Meta line pluralizes correctly ("1 contact" vs "2 contacts")
- [ ] Filter chip counts update when list changes
- [ ] "DNC" chip hidden if count is 0
- [ ] Infinite scroll triggers before reaching the end (4/10 threshold)
- [ ] Filter selection persists across pull-to-refresh
- [ ] Recommendations "Companies" filter swaps `ContactCard` for `CompanyCard` (if that exists — else reuse the same component with a variant prop)

---

## 7. Dark mode foundations

**Goal:** Light stays default. Add a Theme provider + `useColorScheme` wiring so Appearance = System / Light / Dark works end-to-end. Initial dark palette is a straight invert of the light one; we don't commit to dark-mode polish on every screen.

### 7.1 Step 1 — extend tokens

`src/theme/tokens.ts` already exports a single `color` object. Wrap it into a per-scheme pair:

```ts
// src/theme/tokens.ts
const lightColor = {
  brand: '#6F45FF',
  brandInk: '#3B1E9A',
  brandTint: '#F1ECFF',
  live: '#00D27A',
  liveTint: '#DCFBEC',
  liveInk: '#003D23',
  warm: '#FF8A3D',
  warmTint: '#FFF4E4',
  warmInk: '#B54300',
  danger: '#F43F5E',
  ink: '#0B0B10',
  ink2: '#1C1C22',
  muted: '#6E6E78',
  muted2: '#A3A3AD',
  line: '#E7E7EC',
  line2: '#F1F1F4',
  bg: '#F5F5F7',
  surface: '#FFFFFF',
};

const darkColor: typeof lightColor = {
  brand: '#8C6BFF',
  brandInk: '#C7B3FF',
  brandTint: '#2A1F4F',
  live: '#2CE98D',
  liveTint: '#0E2E1F',
  liveInk: '#A8F5CE',
  warm: '#FFA663',
  warmTint: '#3A2817',
  warmInk: '#FFC794',
  danger: '#FF6680',
  ink: '#F5F5F7',
  ink2: '#E7E7EC',
  muted: '#A3A3AD',
  muted2: '#6E6E78',
  line: '#26262E',
  line2: '#1C1C22',
  bg: '#0B0B10',
  surface: '#14141A',
};

export const colors = { light: lightColor, dark: darkColor };
// Keep existing named export for backwards compat during the migration:
export const color = lightColor;

// Radius, spacing, type, shadow from Phase 1 stay unchanged.
```

### 7.2 Step 2 — Theme provider

`src/theme/ThemeProvider.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './tokens';

type Scheme = 'light' | 'dark';
type Pref = 'system' | Scheme;

const KEY = 'lusha.appearance';

const ThemeCtx = createContext<{
  scheme: Scheme;
  pref: Pref;
  setPref: (p: Pref) => void;
  color: typeof colors.light;
}>({
  scheme: 'light', pref: 'system', setPref: () => {}, color: colors.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() ?? 'light';
  const [pref, setPrefState] = useState<Pref>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v === 'system' || v === 'light' || v === 'dark') setPrefState(v);
    });
  }, []);

  const setPref = (p: Pref) => {
    setPrefState(p);
    AsyncStorage.setItem(KEY, p);
  };

  const scheme: Scheme = pref === 'system' ? (system as Scheme) : pref;
  const color = colors[scheme];

  return (
    <ThemeCtx.Provider value={{ scheme, pref, setPref, color }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
```

Wrap the root layout:

```tsx
// app/_layout.tsx
<ThemeProvider>
  <Stack />
</ThemeProvider>
```

### 7.3 Step 3 — migrate a few surfaces (scope-limit)

Do **not** migrate every component in Phase 3. Only:
- Root background: read from `useTheme().color.bg`
- `Card` primitive: read `surface` and `line`
- `ContactCard`: read `ink`, `muted`, `surface`
- Account screen (since it hosts the Appearance toggle)
- Home hero (gradients stay the same — they're always-dark anyway)

Other screens keep their hardcoded palette; dark mode shows them as "good enough" on dark backgrounds. A subsequent polish pass fixes the rest.

### 7.4 Step 4 — Appearance settings row

In Account's `SettingsGroup`, the Appearance row opens a sheet:

```tsx
<AppearanceSheet
  value={pref}
  onChange={setPref}
  onClose={close}
/>
```

Where `AppearanceSheet` is a simple bottom sheet with 3 options (System / Light / Dark) and a radio indicator. Label on the Account row reads `pref === 'system' ? 'System' : pref === 'dark' ? 'Dark' : 'Light'`.

### 7.5 Dark mode QA checklist

- [ ] System toggle follows OS setting live (no app restart needed)
- [ ] Explicit Light/Dark persists through app restart
- [ ] Status bar style flips to match (light-content on dark, dark-content on light)
- [ ] Gradients render identically in both modes (they're always dark)
- [ ] No white flashes on screen navigation in dark mode
- [ ] `<ActivityIndicator>` color reads from theme
- [ ] Text input placeholder color readable in dark mode
- [ ] Safe area backgrounds match bg color in dark mode

---

## 8. End-to-end QA checklist (full Phase 3)

### Signals
- [ ] Teaser renders for no-API-key users
- [ ] Activated state shows grouped feed
- [ ] Following tab has per-entity counts

### Account
- [ ] Credit hero dominates visual hierarchy
- [ ] Settings list replaces the four equal sections
- [ ] Appearance setting works (all three modes)
- [ ] Sign out flow unchanged

### Upload Contacts
- [ ] Grouped picker renders correct groups
- [ ] Sticky action bar shows selection count + credit cost + ETA
- [ ] Large contact libraries (500+) scroll smoothly
- [ ] Success → "View list" navigates correctly

### Login
- [ ] Dark hero renders on cold start
- [ ] Form sheet keyboard behavior correct on both platforms
- [ ] SSO/SAML equal-weight buttons route to existing flows

### List Detail + Recommendations
- [ ] Both use `ContactCard` from Phase 2
- [ ] Segment filter updates counts live
- [ ] Infinite scroll replaces "Load More"

### Dark mode
- [ ] System-following works out of the box
- [ ] Explicit overrides persist
- [ ] No rendering bugs on migrated surfaces

---

## 9. Rollout strategy

Recommended order within Phase 3:

| Step | Change | Why this order |
|------|--------|----------------|
| 1 | Login hero cover | Highest first-impression leverage, zero risk to business logic |
| 2 | Account credit hero + settings group | Touches auth + settings but very visible |
| 3 | List Detail + Recommendations + `ContactCard` reuse | Consolidation, low risk |
| 4 | Signals teaser + grouped feed | New surface area — requires data plumbing |
| 5 | Upload Contacts grouped picker | Most logic-heavy, ship last |
| 6 | Dark mode foundation + Appearance toggle | Cross-cutting — do after the other surfaces are stable |

Feature flags: `login_v2`, `account_v2`, `upload_v2`, `signals_v2`, `list_detail_v2`, `dark_mode_enabled`.

---

## 10. Open questions for the dev agent

If any of these block implementation, pause and log in `PHASE_3_QUESTIONS.md`:

1. **Device contacts API** — which library is used today (`expo-contacts`?) and does it return a `lastContactedAt` field? Without it, "Recently contacted" group has to fall back to another heuristic.
2. **Recents heuristic fallback** — if `lastContactedAt` isn't available, is there a "favorites" / starred signal on iOS/Android we can use? Or fall back to first page of device-ordering.
3. **Signals API key setup sheet** — does a modal/sheet component already exist for this, or does it navigate to a dedicated route? The new `SignalsStatusRow` should reuse the same path.
4. **Billing portal** — does tapping the CreditsHero need to link anywhere ("Upgrade plan")? If yes, what URL / in-app route?
5. **Plan resetsOn date** — where does that come from? JWT? A plan endpoint? Hardcoded "1st of month"?
6. **ETA for enrichment** — is there an API field giving an expected time-per-contact, or is it safe to ship `ceil(N/5) min` as a heuristic?
7. **Dark mode audit scope** — which screens MUST be dark-mode-perfect for v1 (Login? Account? just the migrated surfaces?) vs. "acceptable on dark bg" for tail screens?

---

## 11. Files you'll touch

### New files
- `src/components/ui/Section.tsx`
- `src/components/ui/SettingsGroup.tsx`
- `src/components/ui/StickyActionBar.tsx`
- `src/components/ui/ScreenTitle.tsx`
- `src/components/signals/SignalsTeaser.tsx`
- `src/components/signals/ActivityFeed.tsx`
- `src/components/signals/FollowingList.tsx`
- `src/components/account/CreditsHero.tsx`
- `src/components/account/SignalsStatusRow.tsx`
- `src/components/account/AppearanceSheet.tsx`
- `src/components/login/LoginHeroCover.tsx`
- `src/components/login/LoginFormSheet.tsx`
- `src/components/upload/ContactPickerRow.tsx`
- `src/components/upload/SuccessView.tsx`
- `src/lib/signals.ts`
- `src/lib/contactGrouping.ts`
- `src/theme/ThemeProvider.tsx`

### Modified files
- `app/_layout.tsx` — wrap in `ThemeProvider`
- `app/(auth)/login.tsx` — swap shell
- `app/(tabs)/signals.tsx` — teaser + grouped feed
- `app/(tabs)/account.tsx` — new layout
- `app/upload-contacts.tsx` — grouped picker
- `app/list/[id].tsx` — `ContactCard` + segment filter
- `app/recommendations.tsx` — `ContactCard` + segment filter
- `src/theme/tokens.ts` — per-scheme palette

### Untouched (Phases 1 & 2)
- Phase 1 primitives (LivePill, StatChip, SegmentFilter, Card)
- Phase 2 primitives (GradientHero, QuickActionButton, MaskedValueRow, CollapsibleSection, CleanBackHeader, ContactCard)
- `app/(tabs)/home.tsx`, `app/contact/[id].tsx`, `app/company/[id].tsx` (already Phase 2)

---

## 12. After Phase 3

Once this is merged, the full redesign from the proposal is live. Possible next steps (no handoff prepared yet):

- **Polish pass for dark mode** — migrate remaining surfaces for proper dark palettes
- **Animations pass** — reveal-moment celebrate animation, pull-to-refresh micro-interactions
- **Empty-state system** — dedicated empty states for 0-results (Search, Lists, Following)
- **Widget + Lock Screen surface** (iOS 17+) — quick "add to list" from the home screen
- **Tablet layout** — iPad-specific split view for search + detail

If any of these are on your roadmap, ping me and I'll scope a Phase 4.

---

**End of Phase 3 handoff.** This completes the redesign. When the dev agent finishes, the Lusha ToGo app should feel consistent, modern, and distinctly Lusha from first launch through every daily interaction.
