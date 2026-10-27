import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { ROUTES } from '../../constants/routes';
import { deleteStop, moveStop, setStopClock, togglePacking } from '../../trip/editTrip';
import { fill, t } from '../../trip/i18n';
import { tripMapHtml } from '../../trip/mapHtml';
import { buildTripPlan, packingFor } from '../../trip/planTrip';
import { fetchDestinationWeather, itineraryText, narratePlan, publishTrip, saveTrip } from '../../trip/remote';
import { attachRoutePlaces } from '../../trip/routePlaces';
import { formatHours, formatInr, localParts } from '../../trip/time';
import type { TripPlan, TripStop } from '../../trip/types';
import type { TripStackParamList } from '../../types/navigation';
import { TripTopBar, tripColors, useTripSession } from './TripSession';

export default function TripItineraryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const { lang, dark, plan, setPlan } = useTripSession();
  const colors = tripColors(dark);
  const [day, setDay] = useState(0);
  const [editing, setEditing] = useState<TripStop | null>(null);
  const [clock, setClock] = useState('08:00');
  const [regenOpen, setRegenOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [polishing, setPolishing] = useState(false);

  useEffect(() => {
    if (!plan) return;
    const id = plan.id;
    const dates = plan.days.map((item) => item.date);
    if (dates.length === 0) return;
    const { destination, lang: planLang, interests } = plan.request;
    const offset = plan.utcOffsetMinutes;
    let cancelled = false;
    fetchDestinationWeather(destination.lat, destination.lng, dates[0], dates[dates.length - 1], planLang)
      .then((weather) => {
        if (cancelled) return;
        setPlan((current) => {
          if (!current || current.id !== id) return current;
          const stops = current.days.flatMap((item) => item.stops);
          return {
            ...current,
            weather,
            packing: packingFor(planLang, interests, weather, stops, offset, current.packing),
          };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Fetch once per plan. Later edits merge into the current plan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  useEffect(() => {
    if (!plan) return;
    const id = plan.id;
    let cancelled = false;
    attachRoutePlaces(plan)
      .then((next) => {
        if (cancelled) return;
        setPlan((current) => (current && current.id === id ? { ...current, days: next.days } : current));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  if (!plan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }} edges={['top']}>
        <TripTopBar />
        <Text style={{ color: colors.text, fontSize: 16 }}>{t(lang, 'noPlan')}</Text>
        <Pressable onPress={() => navigation.navigate(ROUTES.trip.planner)} style={styles.link}>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'backToForm')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const current = plan.days[Math.min(day, plan.days.length - 1)] ?? plan.days[0];
  const fuelLabel = plan.request.mode === 'bus' || plan.request.mode === 'train' ? t(lang, 'tickets') : t(lang, 'fuel');
  const mapStops = (current?.stops ?? [])
    .filter((stop) => stop.kind !== 'drive')
    .map((stop) => ({ lat: stop.lat, lng: stop.lng, name: stop.name }));

  const update = (next: TripPlan) => {
    setPlan(next);
    setDay((index) => Math.min(index, Math.max(0, next.days.length - 1)));
  };

  const save = async () => {
    try {
      const where = await saveTrip(plan);
      setNote(where === 'cloud' ? t(lang, 'savedCloud') : t(lang, 'savedLocal'));
    } catch {
      Alert.alert(t(lang, 'saveFailed'));
    }
  };

  const share = async () => {
    try {
      const published = await publishTrip(plan);
      if (published.shareCode) setPlan(published);
      await Share.share({ message: itineraryText(published), title: 'TripMate' });
      if (!published.shareCode) setNote(t(lang, 'signedOutShare'));
    } catch {
      setNote(t(lang, 'signedOutShare'));
    }
  };

  const regenerate = (text: string) => {
    const next = buildTripPlan({
      request: { ...plan.request, lang, instruction: text },
      oneWayKm: plan.routeMeta.oneWayKm,
      oneWayMinutes: plan.routeMeta.oneWayMinutes,
      route: plan.routeMeta.route,
      ghatSpans: plan.routeMeta.ghatSpans,
      utcOffsetMinutes: plan.utcOffsetMinutes,
    });
    setPlan(next);
    setDay(0);
    setRegenOpen(false);
    setPolishing(true);
    void narratePlan(next).then((polished) => {
      if (polished) setPlan(polished);
      setPolishing(false);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <TripTopBar />
        <Text style={[styles.route, { color: colors.text }]}>
          {plan.request.origin.name} → {plan.request.destination.name}
        </Text>
        {polishing ? <Text style={{ color: colors.muted }}>{t(lang, 'polishing')}</Text> : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'summary')}</Text>
          <View style={styles.metrics}>
            <Metric label={t(lang, 'distance')} value={`${plan.distanceKm} km`} colors={colors} />
            <Metric label={t(lang, 'driveTime')} value={formatHours(plan.driveMinutes)} colors={colors} />
            <Metric label={t(lang, 'perPerson')} value={formatInr(plan.budget.perPerson)} colors={colors} />
          </View>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            {fill(t(lang, 'leaveDest'), {
              place: plan.request.destination.name,
              time: localParts(plan.latestLeaveAt, plan.utcOffsetMinutes).time,
            })}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            {fill(t(lang, 'homeBy'), { time: localParts(plan.homeAt, plan.utcOffsetMinutes).time })}
          </Text>
        </View>

        {!plan.fits ? (
          <View style={[styles.banner, { backgroundColor: colors.warnBg }]}>
            <Text style={{ color: colors.warnText, lineHeight: 20 }}>
              {fill(t(lang, 'fitsLate'), {
                hours: formatHours(plan.shortfallMin),
                home: localParts(plan.homeAt, plan.utcOffsetMinutes).time,
                back: localParts(plan.request.backBy, plan.utcOffsetMinutes).time,
              })}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'weather')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weatherRow}>
          {plan.weather.length === 0 ? (
            <Text style={{ color: colors.muted }}>{t(lang, 'weatherUnavailable')}</Text>
          ) : (
            plan.weather.map((item) => (
              <View key={item.date} style={[styles.weather, { backgroundColor: item.rainWarning ? colors.warnBg : colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{item.date.slice(5)}</Text>
                <Text style={{ color: colors.text }}>{item.label}</Text>
                <Text style={{ color: colors.muted }}>{item.tempMin}° / {item.tempMax}°</Text>
                <Text style={{ color: item.rainWarning ? colors.warnText : colors.muted }}>{item.precipProb}%</Text>
              </View>
            ))
          )}
        </ScrollView>
        {plan.weather.some((item) => item.rainWarning) ? (
          <Text style={{ color: colors.warnText, marginBottom: 8 }}>{t(lang, 'rainWarning')}</Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {plan.days.map((item) => (
            <Pressable
              key={item.date}
              onPress={() => setDay(item.index)}
              style={[styles.dayChip, { backgroundColor: item.index === current?.index ? colors.accent : colors.surface, borderColor: colors.border }]}
            >
              <Text style={{ color: item.index === current?.index ? colors.onAccent : colors.text, fontWeight: '800' }}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={{ color: colors.muted, marginBottom: 8 }}>{t(lang, 'editHint')}</Text>

        {current?.stops.map((stop, index) => (
          <View key={stop.id} style={styles.stopRow}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              {index < current.stops.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
            </View>
            <View style={[styles.stopCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ color: colors.accent, fontWeight: '800' }}>{localParts(stop.at, plan.utcOffsetMinutes).time}</Text>
              <Text style={[styles.stopName, { color: colors.text }]}>{stop.name}</Text>
              {stop.photoUrl ? (
                <Image source={{ uri: stop.photoUrl }} style={styles.photo} accessibilityIgnoresInvertColors />
              ) : null}
              <Text style={{ color: colors.muted, lineHeight: 20 }}>{stop.tip}</Text>
              {stop.kind === 'activity' || stop.kind === 'break' ? (
                <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{stop.description}</Text>
              ) : null}
              {stop.costPerPerson > 0 ? (
                <Text style={{ color: colors.text, marginTop: 4 }}>{fill(t(lang, 'costAbout'), { cost: formatInr(stop.costPerPerson) })}</Text>
              ) : null}
              {stop.confirmBeforeGoing ? <Text style={{ color: colors.warnText, marginTop: 4 }}>{t(lang, 'confirmNote')}</Text> : null}
              <View style={styles.stopActions}>
                <Mini label={t(lang, 'editTime')} colors={colors} onPress={() => { setEditing(stop); setClock(localParts(stop.at, plan.utcOffsetMinutes).time); }} />
                <Mini label={t(lang, 'moveUp')} colors={colors} onPress={() => update(moveStop(plan, stop.id, -1))} />
                <Mini label={t(lang, 'moveDown')} colors={colors} onPress={() => update(moveStop(plan, stop.id, 1))} />
                <Mini label={t(lang, 'remove')} colors={colors} onPress={() => update(deleteStop(plan, stop.id))} />
              </View>
            </View>
          </View>
        ))}

        <Text style={[styles.cardTitle, { color: colors.text, marginTop: 8 }]}>{t(lang, 'mapTitle')}</Text>
        <View style={[styles.map, { borderColor: colors.border, backgroundColor: colors.bg }]}>
          <WebView
            key={`${plan.id}-${current?.index ?? 0}`}
            originWhitelist={['*']}
            source={{ html: tripMapHtml(plan.routeMeta.route, mapStops), baseUrl: 'https://localhost/' }}
            style={styles.mapWeb}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            nestedScrollEnabled
            setSupportMultipleWindows={false}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'backupTitle')}</Text>
          <Text style={{ color: colors.text, lineHeight: 21 }}>{plan.backupPlan}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'packing')}</Text>
          {plan.packing.map((item) => (
            <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} onPress={() => update(togglePacking(plan, item.id))} style={styles.checkRow}>
              <View style={[styles.box, { borderColor: colors.accent, backgroundColor: item.checked ? colors.accent : 'transparent' }]}>
                {item.checked ? <Text style={{ color: colors.onAccent, fontWeight: '800' }}>✓</Text> : null}
              </View>
              <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'budgetTitle')}</Text>
          <BudgetRow label={fuelLabel} value={plan.budget.fuel} colors={colors} />
          <BudgetRow label={t(lang, 'tolls')} value={plan.budget.tolls} colors={colors} />
          <BudgetRow label={t(lang, 'stay')} value={plan.budget.stay} colors={colors} />
          <BudgetRow label={t(lang, 'activities')} value={plan.budget.activities} colors={colors} />
          <BudgetRow label={t(lang, 'foodCost')} value={plan.budget.food} colors={colors} />
          <BudgetRow label={t(lang, 'perPerson')} value={plan.budget.perPerson} colors={colors} strong />
          <Text style={{ color: colors.muted, marginTop: 6 }}>{t(lang, 'estimateNote')}</Text>
        </View>

        {note ? <Text style={{ color: colors.accent, marginBottom: 8 }}>{note}</Text> : null}
        <Pressable onPress={() => setRegenOpen(true)} style={[styles.primary, { backgroundColor: colors.accent }]}>
          <Text style={[styles.primaryText, { color: colors.onAccent }]}>{t(lang, 'regenerate')}</Text>
        </Pressable>
        <View style={styles.pair}>
          <Pressable onPress={save} style={[styles.half, { borderColor: colors.accent }]}>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'save')}</Text>
          </Pressable>
          <Pressable onPress={share} style={[styles.half, { borderColor: colors.accent }]}>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'share')}</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => navigation.navigate(ROUTES.trip.mine)} style={styles.link}>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'myTrips')}</Text>
        </Pressable>
      </ScrollView>

      {editing ? (
        <View style={styles.modal}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'editTime')}</Text>
            <TextInput value={clock} onChangeText={setClock} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
            <Pressable
              onPress={() => {
                update(setStopClock(plan, editing.id, clock));
                setEditing(null);
              }}
              style={[styles.primary, { backgroundColor: colors.accent }]}
            >
              <Text style={{ color: colors.onAccent, fontWeight: '800' }}>{t(lang, 'apply')}</Text>
            </Pressable>
            <Pressable onPress={() => setEditing(null)} style={styles.link}>
              <Text style={{ color: colors.muted }}>{t(lang, 'cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {regenOpen ? (
        <View style={styles.modal}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t(lang, 'regenerate')}</Text>
            <TextInput
              value={instruction}
              onChangeText={setInstruction}
              placeholder={t(lang, 'regenerateHint')}
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
            <View style={styles.wrap}>
              {[t(lang, 'presetAdventure'), t(lang, 'presetLess'), t(lang, 'presetFood'), t(lang, 'presetCheaper')].map((preset) => (
                <Pressable key={preset} onPress={() => setInstruction(preset)} style={[styles.preset, { backgroundColor: colors.accentSoft }]}>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>{preset}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => regenerate(instruction)} style={[styles.primary, { backgroundColor: colors.accent }]}>
              <Text style={{ color: colors.onAccent, fontWeight: '800' }}>{t(lang, 'regenerate')}</Text>
            </Pressable>
            <Pressable onPress={() => setRegenOpen(false)} style={styles.link}>
              <Text style={{ color: colors.muted }}>{t(lang, 'close')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof tripColors> }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{value}</Text>
    </View>
  );
}

function Mini({ label, onPress, colors }: { label: string; onPress: () => void; colors: ReturnType<typeof tripColors> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.mini, { backgroundColor: colors.accentSoft }]}>
      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function BudgetRow({ label, value, colors, strong }: { label: string; value: number; colors: ReturnType<typeof tripColors>; strong?: boolean }) {
  return (
    <View style={styles.budgetRow}>
      <Text style={{ color: colors.text, fontWeight: strong ? '800' : '500' }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '800' }}>{formatInr(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  route: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  metrics: { flexDirection: 'row', gap: 8 },
  banner: { borderRadius: 14, padding: 12, marginBottom: 12 },
  weatherRow: { gap: 8, paddingBottom: 10 },
  weather: { width: 108, borderWidth: 1, borderRadius: 14, padding: 10 },
  dayRow: { gap: 8, paddingBottom: 8 },
  dayChip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stopRow: { flexDirection: 'row', gap: 10 },
  rail: { width: 16, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 16 },
  line: { width: 2, flex: 1 },
  stopCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  stopName: { fontSize: 16, fontWeight: '800', marginVertical: 2 },
  photo: { width: '100%', height: 150, borderRadius: 12, marginTop: 8, backgroundColor: '#E0E0E0' },
  stopActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  mini: { minHeight: 36, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  map: { height: 240, borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 12 },
  mapWeb: { height: 240, backgroundColor: '#FAFAFA' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 32, alignItems: 'center' },
  primary: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { fontSize: 17, fontWeight: '800' },
  pair: { flexDirection: 'row', gap: 10, marginTop: 10 },
  half: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  modal: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { minHeight: 40, paddingHorizontal: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
