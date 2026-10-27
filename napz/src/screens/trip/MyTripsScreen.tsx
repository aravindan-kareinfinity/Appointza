import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROUTES } from '../../constants/routes';
import { t } from '../../trip/i18n';
import { deleteTrip, listTrips, openSharedTrip } from '../../trip/remote';
import { formatInr, localParts } from '../../trip/time';
import type { TripPlan } from '../../trip/types';
import type { TripStackParamList } from '../../types/navigation';
import { TripTopBar, tripColors, useTripSession } from './TripSession';

export default function MyTripsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const { lang, dark, setPlan } = useTripSession();
  const colors = tripColors(dark);
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listTrips().then(setTrips).catch(() => setTrips([]));
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const open = (plan: TripPlan) => {
    setPlan(plan);
    navigation.navigate(ROUTES.trip.itinerary);
  };

  const openCode = async () => {
    setError(null);
    try {
      const plan = await openSharedTrip(code);
      if (!plan) {
        setError(t(lang, 'notFound'));
        return;
      }
      open(plan);
    } catch {
      setError(t(lang, 'notFound'));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.pad}>
        <TripTopBar />
        <Pressable onPress={() => navigation.navigate(ROUTES.trip.planner)} style={styles.link}>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'backToForm')}</Text>
        </Pressable>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>{t(lang, 'sharePrompt')}</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="AB12CD34"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <Pressable onPress={openCode} style={[styles.primary, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.onAccent, fontWeight: '800' }}>{t(lang, 'open')}</Text>
          </Pressable>
          {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
        </View>
        {trips.length === 0 ? <Text style={{ color: colors.muted }}>{t(lang, 'emptyTrips')}</Text> : null}
        {trips.map((trip) => (
          <View key={trip.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
              {trip.request.origin.name} → {trip.request.destination.name}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {localParts(trip.request.departAt, trip.utcOffsetMinutes).key} · {formatInr(trip.budget.perPerson)}
            </Text>
            <View style={styles.row}>
              <Pressable onPress={() => open(trip)} style={[styles.small, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.onAccent, fontWeight: '800' }}>{t(lang, 'view')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Alert.alert(t(lang, 'delete'), trip.request.destination.name, [
                    { text: t(lang, 'cancel'), style: 'cancel' },
                    {
                      text: t(lang, 'delete'),
                      style: 'destructive',
                      onPress: () => {
                        deleteTrip(trip).then(refresh).catch(() => {});
                      },
                    },
                  ]);
                }}
                style={[styles.small, { backgroundColor: colors.accentSoft }]}
              >
                <Text style={{ color: colors.accent, fontWeight: '800' }}>{t(lang, 'delete')}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 16 },
  primary: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  link: { alignSelf: 'flex-start', minHeight: 40, justifyContent: 'center', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  small: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
