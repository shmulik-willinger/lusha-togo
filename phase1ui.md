# Lusha ToGo — Phase 1 Handoff

**Scope:** Tokens, primitives, icon migration. Zero flow changes. Low risk, ships visual consistency across the whole app.

**Target files:** `src/theme/tokens.ts`, `src/theme/index.ts`, `src/components/ui/*` (new), and surface-level edits in existing components to swap emoji for icons and align radii/shadows.

**Estimated effort:** ~1 week for one FE engineer.

**Out of scope for Phase 1:** screen-level redesigns (Home, Contact Detail, Company Detail). Those are Phase 2.

---

## 0. Prereqs

- `lucide-react-native` should already be installed. If not:
  ```bash
  npm i lucide-react-native react-native-svg
  ```
- NativeWind config stays as-is. We extend the theme through `tailwind.config.js` but also expose JS tokens for non-Tailwind surfaces (gradients, shadows).

---

## 1. `src/theme/tokens.ts` — full replacement

Replace the current file with this. If the path differs in your repo, put this at `src/theme/tokens.ts` and update imports.

```ts
// src/theme/tokens.ts
// Single source of truth for color, radius, shadow, spacing, type.
// Keep these in sync with tailwind.config.js (see §2).

export const color = {
  // Brand
  brand:       '#6F45FF',
  brandInk:    '#3B1E9A',
  brandTint:   '#F1ECFF',
  brandTint2:  '#E5DBFF',

  // Live / verified — NEW semantic token
  live:        '#00D27A',
  liveTint:    '#DCFBEC',
  liveInk:     '#003D23',

  // Warm / intent — NEW
  warm:        '#FF8A3D',
  warmTint:    '#FFF4E4',
  warmInk:     '#B54300',

  // Danger / DNC
  danger:      '#F43F5E',
  dangerTint:  '#FFE4E8',
  dangerInk:   '#A80025',

  // Neutrals
  ink:         '#0B0B10',
  ink2:        '#1C1C22',
  muted:       '#6E6E78',
  muted2:      '#A3A3AD',
  line:        '#E7E7EC',
  line2:       '#F1F1F4',
  canvas:      '#F5F5F7',
  surface:     '#FFFFFF',
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const space = {
  '0.5': 2,
  '1':   4,
  '2':   8,
  '3':   12,
  '4':   16,
  '6':   24,
  '8':   32,
  '12':  48,
} as const;

export const shadow = {
  // Use with React Native's elevation + shadowColor/Offset/Opacity/Radius.
  card: {
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0B0B10',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  livePulse: {
    shadowColor: '#00D27A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 0,
  },
} as const;

export const type = {
  display: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, lineHeight: 30 },
  h1:      { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, lineHeight: 24 },
  title:   { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20 },
  body:    { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, lineHeight: 14, textTransform: 'uppercase' as const },
  mono:    { fontSize: 11, fontFamily: 'JetBrainsMono-Regular' },
} as const;

export const hit = {
  min: 44, // never below this for tappable targets
} as const;

export type ColorToken  = keyof typeof color;
export type RadiusToken = keyof typeof radius;
```

**Deprecated tokens to remove** (search & remove usages):
- Any `disabled` middle-grey — use `color.muted2` at 60% opacity instead
- `radius: 12` hard-coded values — migrate to `radius.md` (14) or `radius.sm` (10)
- Inline `#7C3AED`/`#8B5CF6`/other purple shades — all → `color.brand`

---

## 2. `tailwind.config.js` — extension

Add these to `theme.extend` so NativeWind classes match JS tokens:

```js
// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        brand: '#6F45FF',
        'brand-ink': '#3B1E9A',
        'brand-tint': '#F1ECFF',
        'brand-tint-2': '#E5DBFF',
        live: '#00D27A',
        'live-tint': '#DCFBEC',
        'live-ink': '#003D23',
        warm: '#FF8A3D',
        'warm-tint': '#FFF4E4',
        danger: '#F43F5E',
        'danger-tint': '#FFE4E8',
        ink: '#0B0B10',
        'ink-2': '#1C1C22',
        muted: '#6E6E78',
        'muted-2': '#A3A3AD',
        line: '#E7E7EC',
        'line-2': '#F1F1F4',
        canvas: '#F5F5F7',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
      },
    },
  },
};
```

---

## 3. New primitives — drop into `src/components/ui/`

### 3.1 `LivePill.tsx`

The green "verified / fresh" signal used throughout the app. Optional pulse dot.

```tsx
// src/components/ui/LivePill.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '@/theme/tokens';

type Variant = 'live' | 'brand' | 'ghost' | 'dnc' | 'warm';

type Props = {
  label: string;
  variant?: Variant;
  dot?: boolean; // show leading pulse dot (only meaningful for 'live')
};

const palette: Record<Variant, { bg: string; fg: string }> = {
  live:  { bg: color.liveTint,   fg: color.liveInk   },
  brand: { bg: color.brandTint,  fg: color.brand     },
  ghost: { bg: color.line2,      fg: color.muted     },
  dnc:   { bg: color.dangerTint, fg: color.dangerInk },
  warm:  { bg: color.warmTint,   fg: color.warmInk   },
};

export function LivePill({ label, variant = 'live', dot = variant === 'live' }: Props) {
  const p = palette[variant];
  return (
    <View style={[styles.pill, { backgroundColor: p.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: color.live }]} />}
      <Text style={[styles.label, { color: p.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
```

Usage:
```tsx
<LivePill label="Live" />
<LivePill label="Verified 2h ago" />
<LivePill label="DNC" variant="dnc" dot={false} />
<LivePill label="Following" variant="brand" dot={false} />
```

### 3.2 `StatChip.tsx`

The 3-up compact stat card used on Company Detail and Account.

```tsx
// src/components/ui/StatChip.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, radius } from '@/theme/tokens';

type Props = {
  value: string;   // e.g. "7,450"
  label: string;   // e.g. "Employees"
  trend?: 'up' | 'down' | 'flat';
};

export function StatChip({ value, label, trend }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.value}>
        {trend === 'up'   && '▲ '}
        {trend === 'down' && '▼ '}
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: color.canvas,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: color.ink,
    lineHeight: 16,
  },
  label: {
    fontSize: 9,
    color: color.muted2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
    marginTop: 2,
  },
});
```

Usage:
```tsx
<View style={{ flexDirection: 'row', gap: 6 }}>
  <StatChip value="7,450" label="Employees" />
  <StatChip value="$14B"  label="Revenue" />
  <StatChip value="8%"    label="6mo HC" trend="up" />
</View>
```

### 3.3 `SegmentFilter.tsx`

Horizontal filter-chip strip — one active, others ghost. Used on Search, Lists, List Detail.

```tsx
// src/components/ui/SegmentFilter.tsx
import React from 'react';
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { color, radius } from '@/theme/tokens';

export type Segment = { key: string; label: string; count?: number };

type Props = {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
};

export function SegmentFilter({ segments, value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {segments.map((s) => {
        const active = s.key === value;
        return (
          <Pressable
            key={s.key}
            onPress={() => onChange(s.key)}
            style={[styles.chip, active ? styles.chipActive : styles.chipGhost]}
            hitSlop={8}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelGhost]}>
              {s.label}
              {typeof s.count === 'number' && (
                <Text style={{ opacity: 0.7 }}> · {s.count.toLocaleString()}</Text>
              )}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipActive: { backgroundColor: color.ink },
  chipGhost:  { backgroundColor: color.line2 },
  label: {
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: { color: '#FFF' },
  labelGhost:  { color: color.muted },
});
```

Usage:
```tsx
const [tab, setTab] = useState('all');
<SegmentFilter
  value={tab}
  onChange={setTab}
  segments={[
    { key: 'all',       label: 'All',       count: 412 },
    { key: 'revealed',  label: 'Revealed',  count: 268 },
    { key: 'live',      label: 'Live',      count: 31  },
    { key: 'dnc',       label: 'DNC',       count: 4   },
  ]}
/>
```

### 3.4 `Card.tsx` (shadow unifier)

Stop re-declaring shadow values across ~20 files. One component.

```tsx
// src/components/ui/Card.tsx
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { color, radius, shadow } from '@/theme/tokens';

type Props = ViewProps & {
  elevated?: boolean;
  padded?: boolean;
};

export function Card({ elevated, padded, style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.base,
        elevated ? shadow.elevated : shadow.card,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
  },
  padded: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
```

---

## 4. Icon migration — emoji → `lucide-react-native`

Remove decorative emoji from the core UI. Keep emoji only inside user-generated content.

### Replacement map

| Where | Current emoji | New icon |
|---|---|---|
| Home AI search | `🔮` | `Sparkles` |
| Home recommendations | `✨` | `Target` |
| Home upload | `📤` | `Upload` |
| Tab bar home | `⌂`/`🏠` | `Home` |
| Tab bar search | `🔍` | `Search` |
| Tab bar lists | `📋` | `ListChecks` |
| Tab bar signals | `🔔` | `BellRing` |
| Tab bar account | `👤` | `CircleUser` |
| Contact detail reveal | `🔓` | `Unlock` |
| Contact call action | `📞` | `Phone` |
| Contact email action | `✉️` | `Mail` |
| Signals empty (API key) | `🔑` | `Key` |
| Signals activity | — | `Activity` |
| Back button | `‹` | `ChevronLeft` |
| Chevron row | `›` | `ChevronRight` |
| Follow/star | `⭐` | `Star` |
| Verified | `✓` | `Check` |
| Sign-out | `🚪` | `LogOut` |

### Icon size + color conventions

- **Size:** tab bar 22, action buttons 18, inline row glyphs 16, section headers 14.
- **Color:** `color.ink` for default, `color.brand` for active, `color.muted2` for inactive/decorative.
- **Stroke-width:** 2 (default) for actions, 1.75 for decorative.

Example:
```tsx
import { Phone } from 'lucide-react-native';
<Phone size={18} color={color.liveInk} strokeWidth={2.25} />
```

---

## 5. Touch-ups across existing screens

Keep these edits surgical — **no layout changes**, just alignment with tokens.

### 5.1 Radius unification
Grep for hard-coded `borderRadius: 12` / `borderRadius: 16` / `borderRadius: 8`. Replace:
- `8`  → `radius.sm` (10)
- `12` → `radius.md` (14)
- `16` → `radius.md` (14) or `radius.lg` (18) — pick by visual weight
- `20`/`24` → `radius.xl` (24)

### 5.2 Shadow unification
Grep for `shadowColor`. If shadow props are inline on a card-like view, replace with `<Card>` or spread `...shadow.card`.

### 5.3 Text scale
Swap inline font sizes to `type.*`:
- Screen titles (16–18) → `type.h1`
- Card titles (13–14)   → `type.title`
- Body copy (11–13)     → `type.body`
- Eyebrows / meta       → `type.label`

### 5.4 Pill usage
Anywhere you see a hand-rolled `View` with `borderRadius: 999` containing a `Text` — replace with `<LivePill>`.

---

## 6. Verification checklist (for the dev agent to tick)

### Build
- [ ] App builds on iOS simulator with no red-screen
- [ ] App builds on Android emulator with no red-screen
- [ ] `npm run lint` passes (no new warnings from the new files)
- [ ] `npm run tsc --noEmit` passes

### Visual
- [ ] Home screen: no emoji visible in default render
- [ ] Tab bar: 5 lucide icons, active = brand, inactive = muted2
- [ ] At least one live pill visible somewhere (e.g. on a contact card)
- [ ] Card shadows on Home/Lists/Account look consistent (no mismatched depths)
- [ ] Radii feel consistent (no 8/12/16 mix on one screen)

### Regression
- [ ] Login flow still works (normal + SSO + WebView fallback)
- [ ] Search → result → detail still opens the right contact
- [ ] Reveal still triggers the correct API call and consumes 1 credit
- [ ] Lists CRUD untouched
- [ ] Signals tab renders same empty/connected states as before

### Dark mode
- **Not in Phase 1.** Keep `color.canvas` hard-coded; dark-mode tokens arrive in Phase 3.

---

## 7. What to do if you hit something ambiguous

If your codebase has a token or component that doesn't map 1:1 to this brief:
1. Name it explicitly in a `PHASE_1_QUESTIONS.md` file.
2. Ship what's unambiguous first — don't block on edge cases.
3. Flag any place where a Phase 1 change would require touching screen-level layout; those move to Phase 2.

When Phase 1 is merged, ping me and I'll prepare the Phase 2 handoff (Home, Contact Detail, Company Detail redesigns) built on top of these primitives.

---

**End of Phase 1 handoff.**
