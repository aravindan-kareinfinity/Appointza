import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY } from '../../constants/branding';
import { simpleLineName, simpleVehicleWord } from '../../rideEstimate/formatJourney';
import {
  firstWalk,
  lastWalk,
  lineChips,
  rideStopsLabel,
  scheduledFrom,
  transitLegs,
  tripMinutesLabel,
  tripTimeRange,
  walkMinutesForRoute,
  walkSummary,
} from '../../rideEstimate/transitUi';
import type { BusRouteOption, TransitLeg } from '../../rideEstimate/types';

const TEAL = '#4ECDC4';
const LINE_BLUE = '#5B8DEF';

function LineChip({ name, color }: { name: string; color?: string }) {
  return (
    <View style={[styles.chip, color ? { backgroundColor: color } : null]}>
      <Text style={[styles.chipText, color ? { color: '#FFF' } : null]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function TimelineDot({ color, last }: { color: string; last?: boolean }) {
  return (
    <View style={styles.railCol}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {last ? null : <View style={[styles.rail, { backgroundColor: color }]} />}
    </View>
  );
}

function WalkRow({ label }: { label: string }) {
  return (
    <View style={styles.timelineRow}>
      <TimelineDot color="#9AA3B2" />
      <View style={styles.timelineBody}>
        <View style={styles.walkLine}>
          <Icon name="walk-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.walkText}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

function TransitBlock({ leg }: { leg: TransitLeg }) {
  const color = leg.lineColor || LINE_BLUE;
  const line = simpleLineName(leg);
  return (
    <View style={styles.timelineRow}>
      <View style={styles.railCol}>
        <View style={[styles.busIcon, { backgroundColor: color }]}>
          <Icon
            name={simpleVehicleWord(leg.vehicleType) === 'Bus' ? 'bus' : 'train'}
            size={14}
            color="#FFF"
          />
        </View>
        <View style={[styles.railThick, { backgroundColor: color }]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      <View style={styles.timelineBody}>
        {leg.boardingStop ? <Text style={styles.stopName}>{leg.boardingStop.name}</Text> : null}
        <View style={styles.boardMeta}>
          <LineChip name={line} color={color} />
          {leg.headsign ? (
            <Text style={styles.headsign} numberOfLines={1}>
              {leg.headsign}
            </Text>
          ) : null}
          {leg.departureTime ? <Text style={styles.clock}>{leg.departureTime}</Text> : null}
        </View>
        <Text style={styles.scheduled}>Scheduled</Text>
        <Text style={styles.rideStops}>{rideStopsLabel(leg)}</Text>
        {leg.alightingStop ? (
          <View style={styles.alightRow}>
            <Text style={styles.stopName}>{leg.alightingStop.name}</Text>
            {leg.arrivalTime ? <Text style={styles.clock}>{leg.arrivalTime}</Text> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function TripListRow({
  route,
  onPress,
}: {
  route: BusRouteOption;
  onPress: () => void;
}) {
  const walkMin = walkMinutesForRoute(route);
  const chips = lineChips(route);
  const range = tripTimeRange(route);
  const scheduled = scheduledFrom(route);
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.durationCol}>
        <Text style={styles.durationNum}>{tripMinutesLabel(route)}</Text>
        <Text style={styles.durationUnit}>min</Text>
      </View>
      <View style={styles.listBody}>
        <View style={styles.listTop}>
          {range ? <Text style={styles.range}>{range}</Text> : <View />}
          {route.fareLabel ? <Text style={styles.fare}>{route.fareLabel}</Text> : null}
        </View>
        <View style={styles.chipRow}>
          {walkMin != null ? (
            <>
              <Icon name="walk-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.walkMin}>{walkMin}</Text>
              <Text style={styles.chevron}>›</Text>
            </>
          ) : null}
          {chips.map((name) => (
            <LineChip key={name} name={name} />
          ))}
        </View>
        {scheduled ? <Text style={styles.scheduledLine}>{scheduled}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

function TripDetail({
  route,
  destinationName,
  onClose,
  onStart,
}: {
  route: BusRouteOption;
  destinationName?: string;
  onClose: () => void;
  onStart?: () => void;
}) {
  const startWalk = walkSummary(firstWalk(route));
  const endWalk = walkSummary(lastWalk(route));
  const buses = transitLegs(route);
  const chips = lineChips(route);
  const walkMin = walkMinutesForRoute(route);
  const lastArrival = buses.at(-1)?.arrivalTime ?? route.arrivalTime;

  return (
    <View>
      <View style={styles.detailHeader}>
        <View style={styles.chipRow}>
          {walkMin != null ? (
            <>
              <Icon name="walk-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.walkMin}>{walkMin}</Text>
              <Text style={styles.chevron}>›</Text>
            </>
          ) : null}
          {chips.map((name) => (
            <LineChip key={name} name={name} />
          ))}
        </View>
        <TouchableOpacity onPress={onClose} accessibilityLabel="Close trip">
          <Icon name="close" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {startWalk ? <WalkRow label={startWalk} /> : null}
      {buses.map((leg, index) => (
        <TransitBlock key={`${route.id}-t-${index}`} leg={leg} />
      ))}
      {endWalk && lastWalk(route) !== firstWalk(route) ? <WalkRow label={endWalk} /> : null}

      <View style={styles.timelineRow}>
        <View style={styles.railCol}>
          <View style={styles.endPin} />
        </View>
        <View style={styles.alightRow}>
          <Text style={styles.stopName}>{destinationName ?? buses.at(-1)?.alightingStop?.name ?? 'Destination'}</Text>
          {lastArrival ? <Text style={styles.clock}>{lastArrival}</Text> : null}
        </View>
      </View>

      <View style={styles.detailFooter}>
        <TouchableOpacity style={styles.startBtn} onPress={onStart}>
          <Icon name="navigate" size={16} color={BRAND_NAVY} />
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
        <View style={styles.totalWrap}>
          <Text style={styles.totalMin}>{tripMinutesLabel(route)} min</Text>
          {lastArrival ? <Text style={styles.totalArrive}>{lastArrival}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export function PublicTransitTrips({
  routes,
  destinationName,
  onStart,
}: {
  routes: BusRouteOption[];
  destinationName?: string;
  onStart?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = routes.find((route) => route.id === selectedId) ?? null;

  if (routes.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon name="bus-outline" size={28} color={BRAND_NAVY} />
        <Text style={styles.emptyTitle}>No bus or metro found</Text>
        <Text style={styles.emptyBody}>Try a nearby pickup or a different destination.</Text>
      </View>
    );
  }

  if (selected) {
    return (
      <TripDetail
        route={selected}
        destinationName={destinationName}
        onClose={() => setSelectedId(null)}
        onStart={onStart}
      />
    );
  }

  return (
    <View>
      {routes.map((route) => (
        <TripListRow key={route.id} route={route} onPress={() => setSelectedId(route.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  emptyBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  listRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  durationCol: { width: 52, alignItems: 'flex-start' },
  durationNum: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 32 },
  durationUnit: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  listBody: { flex: 1 },
  listTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  range: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  fare: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: '#EEF1F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 120,
  },
  chipText: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  walkMin: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  chevron: { fontSize: 16, color: COLORS.textSecondary, marginHorizontal: 2 },
  scheduledLine: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineRow: { flexDirection: 'row', minHeight: 44 },
  railCol: { width: 28, alignItems: 'center' },
  rail: { flex: 1, width: 3, backgroundColor: '#D5DBE6', marginVertical: 2 },
  railThick: { flex: 1, width: 8, borderRadius: 4, marginVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9AA3B2' },
  busIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineBody: { flex: 1, paddingBottom: 16, paddingLeft: 8 },
  walkLine: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  walkText: { fontSize: 15, color: COLORS.textSecondary },
  stopName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  boardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  headsign: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  clock: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  scheduled: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  rideStops: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12, marginBottom: 12 },
  alightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  endPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.alarm,
    marginTop: 4,
  },
  detailFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  startBtn: {
    backgroundColor: TEAL,
    borderRadius: 24,
    paddingHorizontal: 22,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startText: { fontSize: 16, fontWeight: '800', color: BRAND_NAVY },
  totalWrap: { alignItems: 'flex-end' },
  totalMin: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  totalArrive: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
});
