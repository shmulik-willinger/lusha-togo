import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { schemeColors, type ColorScheme } from './tokens';

type Pref = 'system' | ColorScheme;

const KEY = 'lusha.appearance';

interface ThemeContextValue {
  scheme: ColorScheme;
  pref: Pref;
  setPref: (p: Pref) => void;
  color: typeof schemeColors.light;
}

const ThemeCtx = createContext<ThemeContextValue>({
  scheme: 'light',
  pref: 'system',
  setPref: () => {},
  color: schemeColors.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() ?? 'light';
  const [pref, setPrefState] = useState<Pref>('system');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'system' || v === 'light' || v === 'dark') setPrefState(v);
    }).catch(() => {});
  }, []);

  const setPref = (p: Pref) => {
    setPrefState(p);
    AsyncStorage.setItem(KEY, p).catch(() => {});
  };

  const scheme: ColorScheme = pref === 'system' ? (system as ColorScheme) : pref;
  const color = schemeColors[scheme];

  return (
    <ThemeCtx.Provider value={{ scheme, pref, setPref, color }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
