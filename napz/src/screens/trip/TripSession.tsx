import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t } from '../../trip/i18n';
import type { Lang } from '../../trip/types';
import type { TripPlan } from '../../trip/types';

const UI_KEY = 'tripmate.ui.v1';

export type TripColors = {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  warnBg: string;
  warnText: string;
  danger: string;
};

/** Matches the account screen: navy, white cards, light gray page. */
export function tripColors(_dark?: boolean): TripColors {
  return {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#0D1B2A',
    muted: '#666666',
    border: '#E0E0E0',
    accent: '#002FA7',
    accentSoft: 'rgba(0,47,167,0.08)',
    onAccent: '#FFFFFF',
    warnBg: '#FEF3C7',
    warnText: '#92400E',
    danger: '#FF2A2A',
  };
}

type Session = {
  lang: Lang;
  dark: boolean;
  plan: TripPlan | null;
  setLang: (lang: Lang) => void;
  setDark: (dark: boolean) => void;
  setPlan: (plan: TripPlan | null | ((current: TripPlan | null) => TripPlan | null)) => void;
};

const Ctx = createContext<Session | null>(null);

export function TripSessionProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const [dark, setDark] = useState(false);
  const [plan, setPlanState] = useState<TripPlan | null>(null);
  const setPlan = useCallback((next: TripPlan | null | ((current: TripPlan | null) => TripPlan | null)) => {
    setPlanState((current) => (typeof next === 'function' ? next(current) : next));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(UI_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { lang?: Lang; dark?: boolean };
        if (saved.lang === 'ta' || saved.lang === 'en') setLang(saved.lang);
        if (typeof saved.dark === 'boolean') setDark(saved.dark);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(UI_KEY, JSON.stringify({ lang, dark })).catch(() => {});
  }, [lang, dark]);

  const value = useMemo(
    () => ({
      lang,
      dark,
      plan,
      setLang,
      setDark,
      setPlan,
    }),
    [lang, dark, plan, setPlan]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTripSession() {
  const value = useContext(Ctx);
  if (!value) throw new Error('Trip session missing');
  return value;
}

export function TripTopBar() {
  const { lang, setLang } = useTripSession();
  const colors = tripColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{t(lang, 'title')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
        style={[styles.chip, { backgroundColor: colors.accentSoft }]}
      >
        <Text style={[styles.chipText, { color: colors.accent }]}>{t(lang, 'language')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13, fontWeight: '800' },
});
