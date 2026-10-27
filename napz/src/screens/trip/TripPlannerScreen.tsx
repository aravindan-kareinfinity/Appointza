import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchPlaces } from '../../services/maps/osm';
import { BUDGETS, INTERESTS, MODES, t } from '../../trip/i18n';
import { buildTripPlan } from '../../trip/planTrip';
import { fetchTripRoute, narratePlan } from '../../trip/remote';
import { isoFromLocal } from '../../trip/time';
import type { BudgetLevel, Interest, TravelMode, TripPlace } from '../../trip/types';
import type { TripStackParamList } from '../../types/navigation';
import { ROUTES } from '../../constants/routes';
import { TripTopBar, tripColors, useTripSession } from './TripSession';

type PlaceHit = { name: string; lat: number; lng: number };

function tomorrow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shortName(display: string) {
  const parts = display.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.slice(0, 2).join(', ') || display;
}

export default function TripPlannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const { lang, dark, setPlan } = useTripSession();
  const colors = tripColors(dark);
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [origin, setOrigin] = useState<TripPlace | null>(null);
  const [destination, setDestination] = useState<TripPlace | null>(null);
  const [active, setActive] = useState<'origin' | 'dest'>('origin');
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [departDate, setDepartDate] = useState(tomorrow(1));
  const [departTime, setDepartTime] = useState('06:00');
  const [backDate, setBackDate] = useState(tomorrow(2));
  const [backTime, setBackTime] = useState('21:00');
  const [mode, setMode] = useState<TravelMode>('car');
  const [travellers, setTravellers] = useState(2);
  const [drivers, setDrivers] = useState(1);
  const [interests, setInterests] = useState<Interest[]>(['sightseeing', 'food']);
  const [budget, setBudget] = useState<BudgetLevel>('medium');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = active === 'origin' ? originQuery : destQuery;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      return;
    }
    const timer = setTimeout(() => {
      searchPlaces(trimmed)
        .then((rows) =>
          setHits(
            rows.slice(0, 5).map((row) => ({
              name: shortName(row.display_name),
              lat: Number(row.lat),
              lng: Number(row.lon),
            }))
          )
        )
        .catch(() => setHits([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = (hit: PlaceHit) => {
    if (active === 'origin') {
      setOrigin(hit);
      setOriginQuery(hit.name);
    } else {
      setDestination(hit);
      setDestQuery(hit.name);
    }
    setHits([]);
  };

  const toggleInterest = (interest: Interest) => {
    setInterests((current) =>
      current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]
    );
  };

  const generate = async () => {
    if (!origin || !destination) {
      setError(t(lang, 'needPlaces'));
      return;
    }
    const departAt = isoFromLocal(departDate, departTime, 330);
    const backBy = isoFromLocal(backDate, backTime, 330);
    if (!departAt || !backBy) {
      setError(t(lang, 'needTime'));
      return;
    }
    if (new Date(backBy).getTime() <= new Date(departAt).getTime()) {
      setError(t(lang, 'timeOrder'));
      return;
    }
    if (travellers < 1 || drivers > travellers || ((mode === 'car' || mode === 'bike') && drivers < 1)) {
      setError(t(lang, 'driversRange'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const route = await fetchTripRoute(origin, destination, mode);
      const plan = buildTripPlan({
        request: {
          origin,
          destination,
          departAt,
          backBy,
          mode,
          travellers,
          drivers,
          interests,
          budget,
          lang,
          instruction: '',
        },
        ...route,
      });
      setPlan(plan);
      navigation.navigate(ROUTES.trip.itinerary);
      void narratePlan(plan).then((polished) => {
        if (polished) setPlan(polished);
      });
    } catch {
      setError(t(lang, 'routeFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          <TripTopBar />
          <Text style={[styles.tag, { color: colors.muted }]}>{t(lang, 'tagline')}</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.muted }]}>{t(lang, 'start')}</Text>
            <TextInput
              value={originQuery}
              onFocus={() => setActive('origin')}
              onChangeText={(text) => {
                setOriginQuery(text);
                setOrigin(null);
                setActive('origin');
              }}
              placeholder={t(lang, 'searchPlaceholder')}
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <Text style={[styles.label, { color: colors.muted }]}>{t(lang, 'destination')}</Text>
            <TextInput
              value={destQuery}
              onFocus={() => setActive('dest')}
              onChangeText={(text) => {
                setDestQuery(text);
                setDestination(null);
                setActive('dest');
              }}
              placeholder={t(lang, 'searchPlaceholder')}
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            {hits.map((hit) => (
              <Pressable key={`${hit.lat}-${hit.lng}`} onPress={() => pick(hit)} style={styles.hit}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{hit.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.pair}>
              <Field label={t(lang, 'departDate')} value={departDate} onChange={setDepartDate} colors={colors} />
              <Field label={t(lang, 'departTime')} value={departTime} onChange={setDepartTime} colors={colors} />
            </View>
            <View style={styles.pair}>
              <Field label={t(lang, 'backDate')} value={backDate} onChange={setBackDate} colors={colors} />
              <Field label={t(lang, 'backTime')} value={backTime} onChange={setBackTime} colors={colors} />
            </View>
            <Text style={{ color: colors.muted, marginTop: 6 }}>{t(lang, 'timeNote')}</Text>
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>{t(lang, 'mode')}</Text>
          <View style={styles.wrap}>
            {MODES.map((item) => (
              <Chip key={item} label={t(lang, item)} on={mode === item} onPress={() => setMode(item)} colors={colors} />
            ))}
          </View>

          <View style={styles.pair}>
            <Stepper label={t(lang, 'travellers')} value={travellers} min={1} max={12} onChange={setTravellers} colors={colors} />
            <Stepper
              label={t(lang, 'drivers')}
              value={drivers}
              min={mode === 'bus' || mode === 'train' ? 0 : 1}
              max={travellers}
              onChange={setDrivers}
              colors={colors}
            />
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>{t(lang, 'interests')}</Text>
          <View style={styles.wrap}>
            {INTERESTS.map((item) => (
              <Chip
                key={item}
                label={t(lang, item)}
                on={interests.includes(item)}
                onPress={() => toggleInterest(item)}
                colors={colors}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted }]}>{t(lang, 'budget')}</Text>
          <View style={styles.wrap}>
            {BUDGETS.map((item) => (
              <Chip key={item} label={t(lang, item)} on={budget === item} onPress={() => setBudget(item)} colors={colors} />
            ))}
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={generate}
            style={[styles.primary, { backgroundColor: colors.accent, opacity: busy ? 0.7 : 1 }]}
          >
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t(lang, 'generate')}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate(ROUTES.trip.mine)} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: colors.accent }]}>{t(lang, 'myTrips')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  colors: ReturnType<typeof tripColors>;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </View>
  );
}

function Chip({
  label,
  on,
  onPress,
  colors,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  colors: ReturnType<typeof tripColors>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.choice, { backgroundColor: on ? colors.accent : colors.surface, borderColor: on ? colors.accent : colors.border }]}
    >
      <Text style={{ color: on ? colors.onAccent : colors.text, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  colors,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  colors: ReturnType<typeof tripColors>;
}) {
  return (
    <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ color: colors.muted, fontWeight: '700' }}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable accessibilityRole="button" onPress={() => onChange(Math.max(min, value - 1))} style={[styles.stepBtn, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800' }}>−</Text>
        </Pressable>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{value}</Text>
        <Pressable accessibilityRole="button" onPress={() => onChange(Math.min(max, value + 1))} style={[styles.stepBtn, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ color: colors.accent, fontSize: 22, fontWeight: '800' }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  tag: { fontSize: 15, marginBottom: 14, lineHeight: 21 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  hit: { minHeight: 44, justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  choice: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepper: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  stepBtn: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primary: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { fontSize: 17, fontWeight: '800' },
  secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '800' },
  error: { marginTop: 8, fontSize: 14, lineHeight: 20 },
});
