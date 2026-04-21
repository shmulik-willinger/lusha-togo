// src/theme/tokens.ts
// Single source of truth for color, radius, shadow, spacing, type.
// Keep these in sync with tailwind.config.js.

const lightColor = {
  // Brand
  brand:       '#6F45FF',
  brandInk:    '#3B1E9A',
  brandTint:   '#F1ECFF',
  brandTint2:  '#E5DBFF',

  // Live / verified
  live:        '#00D27A',
  liveTint:    '#DCFBEC',
  liveInk:     '#003D23',

  // Warm / intent
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

  // Extras
  linkedin:    '#0A66C2',
};

const darkColor: typeof lightColor = {
  brand:       '#8C6BFF',
  brandInk:    '#C7B3FF',
  brandTint:   '#2A1F4F',
  brandTint2:  '#3A2E65',

  live:        '#2CE98D',
  liveTint:    '#0E2E1F',
  liveInk:     '#A8F5CE',

  warm:        '#FFA663',
  warmTint:    '#3A2817',
  warmInk:     '#FFC794',

  danger:      '#FF6680',
  dangerTint:  '#3B1922',
  dangerInk:   '#FFB3BF',

  ink:         '#F5F5F7',
  ink2:        '#E7E7EC',
  muted:       '#A3A3AD',
  muted2:      '#6E6E78',
  line:        '#26262E',
  line2:       '#1C1C22',
  canvas:      '#0B0B10',
  surface:     '#14141A',

  linkedin:    '#0A66C2',
};

export const schemeColors = { light: lightColor, dark: darkColor };
export type ColorScheme = keyof typeof schemeColors;

// Default export — light palette. Wrap with useTheme() for scheme-aware access.
export const color = lightColor;

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
  min: 44,
} as const;

export type ColorToken  = keyof typeof color;
export type RadiusToken = keyof typeof radius;

// Backwards-compat alias
export const colors = color;
