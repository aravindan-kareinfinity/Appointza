import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Dimensions,
  Keyboard, Animated, Alert, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { ANDROID_APPLICATION_ID } from '../../constants/androidApplicationId';
import { COLORS } from '../../constants/theme';
import { MAP_HTML } from '../../services/maps/mapHtml';
import { canUseGoogleMaps } from '../../services/maps/mapProvider';
import Slider from '@react-native-community/slider';
import { reverseGeocode, searchPlaces as osmSearchPlaces, type NominatimSearchResult } from '../../services/maps/osm';
import { reverseGeocodeGoogle, searchPlacesGoogle } from '../../services/maps/googleMapsPlaces';
import { LazyPremiumGoogleMap } from '../../components/map/LazyPremiumGoogleMap';
import type { SearchPin } from '../../components/map/PremiumGoogleMap';
import { stopBackgroundTracking } from '../../services/alarm/backgroundTracking';
import { getActiveTracking, setActiveTracking, setTriggered } from '../../services/storage/trackingStorage';
import { TrackingServiceAPI } from '../../services/native/TrackingServiceModule';
import { useLocationPermission } from '../../location/LocationPermissionProvider';
import { useLocationStartupGate } from '../../location/LocationLaunchGate';
import { fetchCurrentPosition, fetchCurrentPositionDetailed } from '../../location/fetchCurrentPosition';
import { syncPlaceAlertToFirebase } from '../../services/firebase/userLocationSync';
import { openDeviceLocationSettings } from '../../location/deviceLocationSettings';
import {
  canStartNewTrip,
  clampRadiusForEntitlement,
  freeTripLimitRemaining,
  resolveAllowedAlarmSound,
} from '../../entitlement/PremiumGate';
import { FREE_TIER_LIMITS } from '../../entitlement/freeTierLimits';
import { showUpgradePrompt } from '../../entitlement/showUpgradePrompt';
import {
  getTripsStartedThisWeek,
  recordTripStarted,
} from '../../entitlement/tripUsageStorage';
import { usePremiumEntitlement } from '../../entitlement/usePremiumEntitlement';
import { startLiveCoordsWatch } from '../../location/liveCoordsWatch';
import {
  requestNotificationPermissionIfNeeded,
} from '../../location/LocationPermission';
import type { LocationPermissionOutcome } from '../../location/LocationPermission';

const WebView = require('react-native-webview').WebView;

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

type SearchResult = NominatimSearchResult;
type HomeScreenNavigationProp = NativeStackNavigationProp<any>;

const soundAssets: Record<string, string> = {
  classic: `android.resource://${ANDROID_APPLICATION_ID}/raw/classic`,
  radar:   `android.resource://${ANDROID_APPLICATION_ID}/raw/radar`,
  beacon:  `android.resource://${ANDROID_APPLICATION_ID}/raw/beacon`,
  gentle:  `android.resource://${ANDROID_APPLICATION_ID}/raw/gentle`,
  urgent:  `android.resource://${ANDROID_APPLICATION_ID}/raw/urgent`,
};

/** Built-in raw asset URI, or file URI from Sounds → Custom (AsyncStorage). */
async function resolveAlarmSoundUriForTracking(selectedKey: string): Promise<string> {
  if (selectedKey === 'custom') {
    try {
      const uri = await AsyncStorage.getItem('customSoundUri');
      if (uri) return uri;
    } catch {}
    return soundAssets.classic;
  }
  return soundAssets[selectedKey] ?? soundAssets.classic;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function isValidDestination(dest: Destination): boolean {
  return Number.isFinite(dest.lat)
    && Number.isFinite(dest.lng)
    && dest.lat >= -90
    && dest.lat <= 90
    && dest.lng >= -180
    && dest.lng <= 180;
}

const SCREEN_H = Dimensions.get('window').height;
const SHEET_EXPANDED_H = Math.min(260, Math.round(SCREEN_H * 0.32));
export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const nativeMapRef = useRef<{
    animateToRegion?: (region: object, duration?: number) => void;
    fitToCoordinates?: (
      coordinates: { latitude: number; longitude: number }[],
      options?: {
        edgePadding?: { top: number; right: number; bottom: number; left: number };
        animated?: boolean;
      }
    ) => void;
  } | null>(null);
  const useGoogleMapRef = useRef(false);
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const destinationRef = useRef<Destination | null>(null);
  const radiusRef = useRef(1000);
  const isTrackingRef = useRef(false);
  const jsAlarmTriggeredRef = useRef(false);

  const [destination, setDestination] = useState<Destination | null>(null);
  const [radius, setRadius] = useState(1000);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [selectedSound, setSelectedSound] = useState('classic');
  const [mapReady, setMapReady] = useState(false);
  const [searchPins, setSearchPins] = useState<SearchPin[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const pendingRestoreRef = useRef<Destination | null>(null);
  const pendingRestoreRadiusRef = useRef<number | null>(null);
  const pendingMapCommandsRef = useRef<object[]>([]);
  const { requestLocationAccess } = useLocationPermission();
  const { locationDisclosureAccepted, refreshLocationDisclosureState } =
    useLocationStartupGate();
  const {
    entitlement,
    loading: entitlementLoading,
    premium,
    refreshEntitlement,
    radiusBounds,
    searchResultLimit,
  } = usePremiumEntitlement();
  const [tripsRemaining, setTripsRemaining] = useState<number | null>(null);
  const [googleMapFallback, setGoogleMapFallback] = useState(false);
  /** Free → OSM WebView. Premium → Google Maps (fallback to OSM if tiles fail). */
  const useGoogleMap =
    !entitlementLoading &&
    premium &&
    canUseGoogleMaps(entitlement) &&
    !googleMapFallback;

  const clampRadius = useCallback(
    (value: number) => clampRadiusForEntitlement(entitlement, value),
    [entitlement]
  );
  const canMountGoogleMap =
    useGoogleMap && (Platform.OS !== 'android' || locationDisclosureAccepted);

  useEffect(() => {
    setRadius((prev) => clampRadiusForEntitlement(entitlement, prev));
  }, [entitlement]);

  useEffect(() => {
    if (premium) {
      setTripsRemaining(null);
      return;
    }
    getTripsStartedThisWeek()
      .then((count) => setTripsRemaining(freeTripLimitRemaining(entitlement, count)))
      .catch(() => setTripsRemaining(null));
  }, [entitlement, premium]);

  useEffect(() => { destinationRef.current = destination; }, [destination]);
  useEffect(() => { radiusRef.current = radius; }, [radius]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { useGoogleMapRef.current = useGoogleMap; }, [useGoogleMap]);

  useEffect(() => {
    setMapReady(false);
    pendingMapCommandsRef.current = [];
    setGoogleMapFallback(false);
  }, [useGoogleMap, premium, entitlementLoading]);

  useEffect(() => {
    if (!useGoogleMap || mapReady) return;
    const timer = setTimeout(() => {
      setGoogleMapFallback(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [useGoogleMap, mapReady]);

  // Slide bottom sheet open after a place is selected (or while tracking).
  useEffect(() => {
    const open = destination != null;
    Animated.spring(sheetAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 70,
    }).start();
  }, [destination, sheetAnim]);

  // Pulse animation while tracking
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isTracking) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { anim?.stop(); };
  }, [isTracking, pulseAnim]);

  // Cold start only — do not re-run on tab focus (would re-trigger restore / disclosure).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadSettings(); }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshEntitlement();
    }, [refreshEntitlement])
  );

  useEffect(() => {
    if (!mapReady) return;
    // Flush any commands queued before the WebView reported ready.
    const queued = pendingMapCommandsRef.current;
    if (queued.length) {
      pendingMapCommandsRef.current = [];
      queued.forEach(cmd => sendMapCommand(cmd));
    }
    const dest = pendingRestoreRef.current;
    const r = pendingRestoreRadiusRef.current;
    if (dest && r != null) {
      sendMapCommand({ type: 'setView', lat: dest.lat, lng: dest.lng, zoom: 14 });
      sendMapCommand({ type: 'setDestination', lat: dest.lat, lng: dest.lng, radius: r });
      sendMapCommand({ type: 'updateRadius', radius: r });
      pendingRestoreRef.current = null;
      pendingRestoreRadiusRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (locationSubRef.current) {
        try { locationSubRef.current(); } catch {}
        locationSubRef.current = null;
      }
      TrackingServiceAPI.stopPositionWatch().catch(() => {});
    };
  }, []);

  const applyDestinationToMapUi = (dest: Destination, r: number) => {
    if (mapReady) {
      sendMapCommand({ type: 'setView', lat: dest.lat, lng: dest.lng, zoom: 14 });
      sendMapCommand({ type: 'setDestination', lat: dest.lat, lng: dest.lng, radius: r });
      sendMapCommand({ type: 'updateRadius', radius: r });
    } else {
      pendingRestoreRef.current = dest;
      pendingRestoreRadiusRef.current = r;
    }
  };

  const resumeActiveTrackingAfterDisclosure = async (active: NonNullable<Awaited<ReturnType<typeof getActiveTracking>>>) => {
    const dest: Destination = {
      name: active.destinationName,
      lat: active.destinationLat,
      lng: active.destinationLng,
    };
    const r = clampRadiusForEntitlement(entitlement, active.radiusMeters);
    setDestination(dest);
    setRadius(r);
    const resumedSound = resolveAllowedAlarmSound(entitlement, active.alarmSound || 'classic');
    setSelectedSound(resumedSound);
    applyDestinationToMapUi(dest, r);

    const perm = await requestLocationAccess('tracking');
    await refreshLocationDisclosureState();
    if (
      perm.cancelled ||
      !perm.foregroundGranted ||
      (Platform.OS === 'android' && !perm.backgroundGranted)
    ) {
      setIsTracking(false);
      isTrackingRef.current = false;
      setLocationError(
        perm.cancelled
          ? 'Tracking not resumed.'
          : 'Location permission required to resume tracking.'
      );
      return;
    }

    setIsTracking(true);
    isTrackingRef.current = true;
    jsAlarmTriggeredRef.current = false;

    let nativeServiceStarted = Platform.OS === 'android';
    if (Platform.OS === 'android') {
      try {
        const soundUri = await resolveAlarmSoundUriForTracking(resumedSound);
        await TrackingServiceAPI.startTrackingService({
          destinationName: dest.name,
          destinationLat: dest.lat,
          destinationLng: dest.lng,
          radiusMeters: r,
          soundUri,
        });
      } catch (e) {
        console.warn('Could not restart native tracking service:', e);
        nativeServiceStarted = false;
      }
    }

    try {
      const currentCoords = await fetchCurrentPosition(false);
      if (currentCoords) {
        setUserLocation(currentCoords);
        sendMapCommand({ type: 'setUserLocation', lat: currentCoords.lat, lng: currentCoords.lng });
        setDistance(haversineDistance(currentCoords.lat, currentCoords.lng, dest.lat, dest.lng));
      }
      const shouldUseJsAlarmFallback = Platform.OS !== 'android' || !nativeServiceStarted;
      startDistanceWatch({ effectiveRadius: r, shouldUseJsAlarmFallback });
    } catch {}
  };

  const loadSettings = async () => {
    try {
      const sound = await AsyncStorage.getItem('alarmSound');
      if (sound) {
        setSelectedSound(resolveAllowedAlarmSound(entitlement, sound));
      }
    } catch {}

    try {
      const active = await getActiveTracking();
      if (active) {
        await resumeActiveTrackingAfterDisclosure(active);
        return;
      }
    } catch (e) {
      console.warn('Restore active tracking failed:', e);
    }
  };

  // Auto-load a saved place passed from SavedPlacesScreen
  useFocusEffect(useCallback(() => {
    const savedPlace = route.params?.savedPlace;
    if (!savedPlace) return;

    // Clear the param so it doesn't re-trigger on next focus
    navigation.setParams({ savedPlace: undefined });

    const dest: Destination = {
      name: savedPlace.name,
      lat: savedPlace.lat,
      lng: savedPlace.lng,
    };

    setDestination(dest);
    if (savedPlace.radius) {
      setRadius(clampRadiusForEntitlement(entitlement, savedPlace.radius));
    }

    // Wait for map to be ready before sending commands
    const applyOnMap = () => {
      sendMapCommand({ type: 'setView', lat: dest.lat, lng: dest.lng, zoom: 14 });
      sendMapCommand({ type: 'setDestination', lat: dest.lat, lng: dest.lng, radius: savedPlace.radius ?? radius });
    };

    if (mapReady) {
      applyOnMap();
    } else {
      const t = setTimeout(applyOnMap, 1200);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.savedPlace]));

  const showLocationOnMap = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    sendMapCommand({ type: 'setView', lat: coords.lat, lng: coords.lng, zoom: 16 });
    sendMapCommand({ type: 'setUserLocation', lat: coords.lat, lng: coords.lng });
    if (destinationRef.current) {
      sendMapCommand({ type: 'fitToUserAndDestination', padding: 80, maxZoom: 16 });
    }
  };

  const centerOnMyLocation = async () => {
    setLocationError(null);
    if (userLocation) {
      showLocationOnMap(userLocation);
      return;
    }

    // Single Flow Modal: full disclosure → Continue → FINE permission → GPS.
    const perm = await requestLocationAccess('foreground_only');
    await refreshLocationDisclosureState();
    if (perm.cancelled || !perm.foregroundGranted) {
      setLocationError('Location permission denied.');
      return;
    }
    const result = await fetchCurrentPositionDetailed(true);
    if (!result.ok) {
      const message =
        result.reason === 'position_unavailable'
          ? 'Location is turned off or unavailable. Turn on Location in Android Settings, then try again.'
          : result.reason === 'permission'
            ? 'Location permission denied.'
            : 'Could not get your current location. Please try again.';
      setLocationError(message);
      if (result.reason === 'position_unavailable' && Platform.OS === 'android') {
        Alert.alert('Location unavailable', message, [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open Location Settings',
            onPress: openDeviceLocationSettings,
          },
        ]);
      } else if (result.reason === 'permission') {
        Alert.alert('Location permission', message, [
          { text: 'Not Now', style: 'cancel' },
          {
            text: 'Open App Settings',
            onPress: () => Linking.openSettings().catch(() => {}),
          },
        ]);
      }
      return;
    }
    showLocationOnMap(result.coords);
  };

  const applyNativeMapCommand = (command: {
    type?: string;
    lat?: number;
    lng?: number;
    zoom?: number;
    results?: SearchPin[];
    padding?: number;
  }) => {
    const map = nativeMapRef.current;
    const zoomToDelta = (zoom: number) => {
      const delta = Math.max(0.004, 360 / Math.pow(2, zoom));
      return { latitudeDelta: delta, longitudeDelta: delta };
    };
    switch (command.type) {
      case 'setView':
        if (command.lat != null && command.lng != null) {
          const delta = zoomToDelta(command.zoom ?? 13);
          map?.animateToRegion?.({
            latitude: command.lat,
            longitude: command.lng,
            ...delta,
          }, 400);
        }
        break;
      case 'showSearchResults':
        setSearchPins(command.results || []);
        if (command.results && command.results.length > 0) {
          map?.fitToCoordinates?.(
            command.results.map((r) => ({ latitude: r.lat, longitude: r.lng })),
            {
              edgePadding: { top: 80, right: 48, bottom: 120, left: 48 },
              animated: true,
            },
          );
        }
        break;
      case 'clearSearchResults':
        setSearchPins([]);
        break;
      case 'clearAll':
        setSearchPins([]);
        break;
      case 'fitToUserAndDestination': {
        const user = userLocationRef.current;
        const dest = destinationRef.current;
        if (!user || !dest) break;
        const pad = command.padding ?? 80;
        map?.fitToCoordinates?.(
          [
            { latitude: user.lat, longitude: user.lng },
            { latitude: dest.lat, longitude: dest.lng },
          ],
          {
            edgePadding: { top: pad, right: pad, bottom: pad, left: pad },
            animated: true,
          },
        );
        break;
      }
      default:
        break;
    }
  };

  const sendMapCommand = (command: object) => {
    if (useGoogleMapRef.current) {
      if (!mapReady) {
        pendingMapCommandsRef.current.push(command);
        return;
      }
      applyNativeMapCommand(command);
      return;
    }
    if (!mapReady) {
      pendingMapCommandsRef.current.push(command);
    }
    webViewRef.current?.injectJavaScript(
      `try{window.cmd(${JSON.stringify(command)})}catch(e){};true;`
    );
  };

  const startDistanceWatch = (params: { effectiveRadius: number; shouldUseJsAlarmFallback: boolean }) => {
    const { effectiveRadius, shouldUseJsAlarmFallback } = params;

    // Live UI distance: Android uses LocationManager (no Play Services Accuracy dialog).
    if (locationSubRef.current != null) {
      try { locationSubRef.current(); } catch {}
      locationSubRef.current = null;
    }
    TrackingServiceAPI.stopPositionWatch().catch(() => {});

    const onCoords = (coords: { lat: number; lng: number }) => {
      if (!isTrackingRef.current) return;
      setUserLocation(coords);
      sendMapCommand({ type: 'setUserLocation', lat: coords.lat, lng: coords.lng });

      const current = destinationRef.current;
      if (!current) return;
      const dist = haversineDistance(coords.lat, coords.lng, current.lat, current.lng);
      setDistance(dist);

      if (shouldUseJsAlarmFallback && dist <= effectiveRadius) {
        triggerAlarmFromJsFallback(current.name).catch(() => {});
      }
    };

    locationSubRef.current = startLiveCoordsWatch(onCoords);
  };

  const runTrackingStartAfterDisclosure = async (
    dest: Destination,
    perm: LocationPermissionOutcome
  ) => {
    if (!isValidDestination(dest)) {
      setLocationError('Invalid destination selected. Please pick a valid place.');
      return;
    }

    const effectiveRadius = clampRadius(radiusRef.current);
    radiusRef.current = effectiveRadius;
    const currentCoords = await fetchCurrentPosition(true);
    if (!currentCoords) {
      setLocationError('Could not verify your current location. Please try again.');
      Alert.alert('Location Unavailable', 'Unable to check if you are already inside the alert radius.');
      return;
    }

    setUserLocation(currentCoords);
    sendMapCommand({ type: 'setUserLocation', lat: currentCoords.lat, lng: currentCoords.lng });
    const initialDistance = haversineDistance(currentCoords.lat, currentCoords.lng, dest.lat, dest.lng);
    setDistance(initialDistance);

    if (initialDistance <= effectiveRadius) {
      Alert.alert('Already Within Radius', `You are already within ${formatDistance(effectiveRadius)} of ${dest.name}.`);
      await triggerAlarmFromJsFallback(dest.name);
      return;
    }

    if (!perm.backgroundGranted) {
      Alert.alert(
        'Background location required',
        'Without Background Location, Napz cannot monitor your destination when the app is closed or not in use. Tracking was not started.',
        [{ text: 'OK' }]
      );
      return;
    }

    await requestNotificationPermissionIfNeeded();
    await proceedWithTracking(dest, { effectiveRadius, initialDistance });
  };

  const triggerAlarmFromJsFallback = async (destName: string) => {
    if (jsAlarmTriggeredRef.current) return;
    jsAlarmTriggeredRef.current = true;

    isTrackingRef.current = false;
    setIsTracking(false);
    if (locationSubRef.current != null) {
      try { locationSubRef.current(); } catch {}
      locationSubRef.current = null;
    }
    TrackingServiceAPI.stopPositionWatch().catch(() => {});

    await Promise.allSettled([
      setTriggered({ destinationName: destName }),
      setActiveTracking(null),
      stopBackgroundTracking(),
      TrackingServiceAPI.stopTrackingService(),
    ]);

    navigation.navigate('Alarm', { destinationName: destName, triggeredByService: false });
  };

  const handleNativeMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapReady') {
        setMapReady(true);
      } else if (data.type === 'mapTap') {
        handleMapTap(data.lat, data.lng);
      } else if (data.type === 'userLocationUpdate') {
        setUserLocation({ lat: data.lat, lng: data.lng });
      } else if (data.type === 'searchResultClicked') {
        selectDestination(data.name || `Location (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`, data.lat, data.lng);
      }
    } catch {}
  };

  function handleMapTap(lat: number, lng: number) {
    if (isTrackingRef.current) return;
    const fallbackName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    const lookup = useGoogleMap ? reverseGeocodeGoogle : reverseGeocode;
    lookup(lat, lng)
      .then(result => selectDestination(result.display_name || fallbackName, lat, lng))
      .catch(() => selectDestination(fallbackName, lat, lng));
  }

  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      sendMapCommand({ type: 'clearSearchResults' });
      return;
    }
    setIsSearching(true);
    try {
      const nearForBias =
        userLocation && isTrackingRef.current ? userLocation : null;
      const results = await (useGoogleMap
        ? searchPlacesGoogle(query, nearForBias)
        : osmSearchPlaces(query));
      const limited = results.slice(0, searchResultLimit);
      setSearchResults(limited);
      setShowResults(true);
      sendMapCommand({
        type: 'showSearchResults',
        results: limited.map(r => ({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          name: r.display_name,
        })),
      });
    } catch {}
    setIsSearching(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchPlaces(text), 400);
  };

  const selectDestination = (name: string, lat: number, lng: number) => {
    const dest = { name, lat, lng };
    setDestination(dest);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
    sendMapCommand({ type: 'clearSearchResults' });
    sendMapCommand({ type: 'setView', lat, lng, zoom: 15 });
    sendMapCommand({ type: 'setDestination', lat, lng, radius });
    // If user location is known, zoom out/in to show both points together.
    if (userLocation) {
      sendMapCommand({ type: 'fitToUserAndDestination', padding: 80, maxZoom: 16 });
    }
  };

  const startTracking = async () => {
    if (!destination) return;
    const dest = destination;
    setLocationError(null);
    jsAlarmTriggeredRef.current = false;

    const tripsThisWeek = await getTripsStartedThisWeek();
    if (!canStartNewTrip(entitlement, tripsThisWeek)) {
      showUpgradePrompt(
        navigation,
        `Free plan includes ${FREE_TIER_LIMITS.MAX_TRIPS_PER_ROLLING_WEEK} destination alarms per week. Upgrade for unlimited trips.`
      );
      return;
    }

    if (!isFocused) {
      setLocationError('Screen not ready. Please try again.');
      return;
    }

    try {
      await new Promise<void>(resolve => setTimeout(() => resolve(), 250));

      // Single Flow Modal: Location Access → FINE → Background Location → BACKGROUND → FGS.
      const perm = await requestLocationAccess('tracking');
      await refreshLocationDisclosureState();
      if (
        perm.cancelled ||
        !perm.foregroundGranted ||
        (Platform.OS === 'android' && !perm.backgroundGranted)
      ) {
        setLocationError(
          perm.cancelled
            ? 'Tracking cancelled.'
            : !perm.foregroundGranted
              ? 'Location permission denied.'
              : 'Background location is required for destination tracking.'
        );
        return;
      }

      await runTrackingStartAfterDisclosure(dest, perm);
    } catch (e) {
      console.error('Tracking start error:', e);
      setLocationError('Could not start tracking. Please try again.');
    }
  };

  const proceedWithTracking = async (
    dest: Destination,
    options?: { effectiveRadius?: number; initialDistance?: number }
  ) => {
    if (!isValidDestination(dest)) {
      setLocationError('Invalid destination selected. Please pick a valid place.');
      return;
    }

    const effectiveRadius = options?.effectiveRadius ?? clampRadius(radiusRef.current);
    radiusRef.current = effectiveRadius;
    const effectiveSound = resolveAllowedAlarmSound(entitlement, selectedSound);

    setIsTracking(true);
    isTrackingRef.current = true;
    jsAlarmTriggeredRef.current = false;
    setDistance(options?.initialDistance ?? null);

    await setTriggered(null);
    await setActiveTracking({
      destinationName: dest.name,
      destinationLat: dest.lat,
      destinationLng: dest.lng,
      radiusMeters: effectiveRadius,
      alarmSound: effectiveSound,
      startedAt: new Date().toISOString(),
    });
    if (premium) {
      void syncPlaceAlertToFirebase({
        placeName: dest.name,
        lat: dest.lat,
        lng: dest.lng,
        alertRadius: effectiveRadius,
      }).catch(() => {});
    }

    let nativeServiceStarted = Platform.OS === 'android';
    try {
      const soundUri = await resolveAlarmSoundUriForTracking(effectiveSound);
      await TrackingServiceAPI.startTrackingService({
        destinationName: dest.name,
        destinationLat: dest.lat,
        destinationLng: dest.lng,
        radiusMeters: effectiveRadius,
        soundUri,
      });
    } catch (e: any) {
      console.error('Foreground service error:', e);
      nativeServiceStarted = false;
      setLocationError('Background service unavailable. Alarm works while app is open.');
    }

    const shouldUseJsAlarmFallback = Platform.OS !== 'android' || !nativeServiceStarted;
    startDistanceWatch({ effectiveRadius, shouldUseJsAlarmFallback });

    await recordTripStarted();
    if (!premium) {
      const count = await getTripsStartedThisWeek();
      setTripsRemaining(freeTripLimitRemaining(entitlement, count));
    }

    Alert.alert('Tracking Started', `Monitoring distance to ${dest.name}`);
  };

  const stopTracking = (options?: { clearTriggered?: boolean }) => {
    const clearTriggered = options?.clearTriggered ?? true;
    isTrackingRef.current = false;
    jsAlarmTriggeredRef.current = false;
    setIsTracking(false);
    setDistance(null);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    if (locationSubRef.current != null) {
      try { locationSubRef.current(); } catch {}
      locationSubRef.current = null;
    }
    TrackingServiceAPI.stopPositionWatch().catch(() => {});
    setActiveTracking(null).catch(() => {});
    if (clearTriggered) setTriggered(null).catch(() => {});
    stopBackgroundTracking().catch(() => {});
    TrackingServiceAPI.stopTrackingService().catch(() => {});
  };

  const clearDestination = () => {
    if (isTracking) stopTracking();
    setDestination(null);
    setDistance(null);
    sendMapCommand({ type: 'clearAll' });
  };

  const handleRadiusChange = (value: number) => {
    setLocationError(null);
    const next = clampRadius(value);
    setRadius(next);
    sendMapCommand({ type: 'updateRadius', radius: next });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.flex}>
        <View style={styles.mapContainer} collapsable={false}>
          {canMountGoogleMap ? (
            <LazyPremiumGoogleMap
              mapRef={nativeMapRef}
              userLocation={userLocation}
              destination={destination}
              radius={radius}
              searchPins={searchPins}
              onMapReady={() => setMapReady(true)}
              onPress={handleMapTap}
              onSearchPinPress={(name, lat, lng) => selectDestination(name, lat, lng)}
            />
          ) : (
            <WebView
              ref={webViewRef}
              key={
                useGoogleMap
                  ? 'osm-until-disclosure'
                  : googleMapFallback
                    ? 'osm-google-fallback'
                    : 'osm-map'
              }
              testID="map-webview"
              source={{
                html: MAP_HTML,
                baseUrl: 'https://localhost/',
              }}
              style={styles.map}
              onMessage={handleNativeMapMessage}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              bounces={false}
              geolocationEnabled={false}
              originWhitelist={['*']}
            />
          )}

          {/* Search overlay */}
          <View style={styles.searchOverlay}>
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                ref={searchInputRef}
                testID="search-location-input"
                style={styles.searchInput}
                placeholder={
                  premium ? 'Search with Google Maps...' : 'Search destination (OpenStreetMap)'
                }
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                onFocus={() => { if (searchQuery.length >= 2) setShowResults(true); }}
                returnKeyType="search"
              />
              {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  testID="clear-search-btn"
                  onPress={() => {
                    setSearchQuery('');
                    setShowResults(false);
                    setSearchResults([]);
                    sendMapCommand({ type: 'clearSearchResults' });
                  }}
                >
                  <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.planChip}>
              {premium
                ? 'Google Maps · advanced search'
                : 'Free · OpenStreetMap · upgrade for Google Maps'}
            </Text>
            {showResults && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                  {searchResults.map((result, idx) => (
                    <TouchableOpacity
                      key={`${result.place_id}-${idx}`}
                      testID={`search-result-${idx}`}
                      style={styles.searchResultItem}
                      onPress={() => selectDestination(
                        result.display_name,
                        parseFloat(result.lat),
                        parseFloat(result.lon),
                      )}
                    >
                      <Icon name="location" size={16} color={COLORS.alarm} style={{ marginTop: 2 }} />
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {result.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Tracking badge */}
          {isTracking && (
            <Animated.View style={[styles.trackingBadge, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingBadgeText}>TRACKING</Text>
            </Animated.View>
          )}

          {/* My location button */}
          <TouchableOpacity
            testID="my-location-btn"
            style={[styles.myLocationBtn, { bottom: destination ? SHEET_EXPANDED_H + 12 : 24 }]}
            onPress={() => {
              centerOnMyLocation().catch(() => {});
            }}
          >
            <Icon name="locate" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Bottom sheet — only after a place is selected */}
        <Animated.View
          pointerEvents={destination ? 'auto' : 'none'}
          style={[
            styles.bottomSheet,
            {
              height: SHEET_EXPANDED_H + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SHEET_EXPANDED_H + insets.bottom + 24, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.panelHandle} />

          {destination ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.panelContent}
            >
              {!isTracking ? (
                <View testID="destination-panel">
                  <View style={styles.destCard}>
                    <View style={styles.destCardLeft}>
                      <View style={styles.destIconWrap}>
                        <Icon name="location" size={20} color={COLORS.alarm} />
                      </View>
                      <View style={styles.destCardInfo}>
                        <Text style={styles.destCardName} numberOfLines={2}>{destination.name}</Text>
                      </View>
                    </View>
                    <TouchableOpacity testID="clear-destination-btn" onPress={clearDestination} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Icon name="close-circle" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.section}>
                    <View style={styles.radiusHeader}>
                      <Text style={styles.sectionLabel}>ALERT RADIUS</Text>
                      <Text style={styles.radiusValue}>{formatDistance(radius)}</Text>
                    </View>
                    <Slider
                      testID="radius-slider"
                      style={styles.radiusSlider}
                      minimumValue={radiusBounds.min}
                      maximumValue={radiusBounds.max}
                      step={50}
                      value={radius}
                      onValueChange={handleRadiusChange}
                      minimumTrackTintColor={COLORS.primary}
                      maximumTrackTintColor={COLORS.border}
                      thumbTintColor={COLORS.primary}
                    />
                    <View style={styles.radiusRangeRow}>
                      <Text style={styles.radiusRangeText}>
                        {formatDistance(radiusBounds.min)}
                      </Text>
                      <Text style={styles.radiusRangeText}>
                        {formatDistance(radiusBounds.max)}
                      </Text>
                    </View>
                    {!premium ? (
                      <Text style={styles.radiusHint}>
                        Free: {formatDistance(radiusBounds.min)}–
                        {formatDistance(radiusBounds.max)} radius. Premium: 50m–5km.
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    testID="panel-ride-estimate-btn"
                    style={styles.rideEstimatePanelBtn}
                    onPress={() =>
                      navigation.getParent()?.navigate('RideEstimate', {
                        destination: {
                          name: destination.name,
                          lat: destination.lat,
                          lng: destination.lng,
                        },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Icon name="bus-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.rideEstimatePanelText}>ESTIMATE RIDE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="start-tracking-button"
                    style={styles.startBtn}
                    onPress={startTracking}
                    activeOpacity={0.8}
                  >
                    <Icon name="navigate" size={20} color="#FFF" />
                    <Text style={styles.startBtnText}>START TRACKING</Text>
                  </TouchableOpacity>

                  {locationError && <Text style={styles.errorText}>{locationError}</Text>}
                </View>
              ) : (
                <View testID="tracking-panel">
                  <View style={styles.distanceBlock}>
                    <Text style={styles.distanceLabel}>DISTANCE TO DESTINATION</Text>
                    <Text style={styles.distanceValue}>
                      {distance !== null ? formatDistance(distance) : '---'}
                    </Text>
                    <Text style={styles.destNameSmall} numberOfLines={1}>{destination.name}</Text>
                  </View>

                  <View style={styles.radiusInfo}>
                    <Icon name="radio-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.radiusInfoText}>Alert within {formatDistance(radius)}</Text>
                  </View>

                  <TouchableOpacity
                    testID="stop-tracking-button"
                    style={styles.stopBtn}
                    onPress={() => stopTracking()}
                    activeOpacity={0.8}
                  >
                    <Icon name="stop-circle" size={22} color={COLORS.primary} />
                    <Text style={styles.stopBtnText}>STOP TRACKING</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  mapContainer: {
    flex: 1,
    width: '100%',
    minHeight: 1,
    position: 'relative' as const,
    backgroundColor: '#DCE6F5',
  },
  map: { flex: 1, width: '100%', height: '100%' },
  searchOverlay: { position: 'absolute' as const, top: 12, left: 14, right: 14, zIndex: 10 },
  planChip: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700' as const,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
  },
  rideEstimatePanelBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    marginBottom: 10,
  },
  rideEstimatePanelText: { fontSize: 13, fontWeight: '800' as const, color: COLORS.primary },
  searchBar: {
    flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: COLORS.surface,
    borderRadius: 14, paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  } as any,
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, marginLeft: 8, marginRight: 8 },
  searchResults: {
    marginTop: 4, backgroundColor: COLORS.surface, borderRadius: 12,
    overflow: 'hidden' as const, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  } as any,
  searchResultItem: {
    flexDirection: 'row' as const, paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'flex-start' as const, gap: 10,
  },
  searchResultText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },

  trackingBadge: {
    position: 'absolute' as const, top: 68, alignSelf: 'center' as const,
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  trackingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 8 },
  trackingBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.5 },

  myLocationBtn: {
    position: 'absolute' as const, right: 14,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surface, alignItems: 'center' as const, justifyContent: 'center' as const,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  } as any,

  bottomSheet: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 16,
    zIndex: 20,
  } as any,
  panelHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center' as const, marginTop: 10, marginBottom: 4,
  },
  panelContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },

  destCard: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
    backgroundColor: COLORS.background, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  destCardLeft: { flexDirection: 'row' as const, flex: 1, marginRight: 10 },
  destIconWrap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,42,42,0.1)',
    alignItems: 'center' as const, justifyContent: 'center' as const, marginRight: 10,
  },
  destCardInfo: { flex: 1 },
  destCardName: { fontSize: 13, fontWeight: '700' as const, color: COLORS.textPrimary, lineHeight: 17 },

  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800' as const, color: COLORS.textSecondary, letterSpacing: 1.5 },
  radiusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  radiusValue: { fontSize: 15, fontWeight: '800' as const, color: COLORS.primary },
  radiusSlider: { width: '100%', height: 36 },
  radiusRangeRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: -4,
  },
  radiusRangeText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' as const },
  radiusHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  tripLimitHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },

  startBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: COLORS.primary, borderRadius: 12, height: 48, gap: 8,
  },
  startBtnText: { fontSize: 14, fontWeight: '900' as const, color: '#FFF', letterSpacing: 1.2 },

  errorText: { fontSize: 12, color: COLORS.alarm, textAlign: 'center' as const, marginTop: 8 },

  distanceBlock: { alignItems: 'center' as const, paddingVertical: 4, marginBottom: 10 },
  distanceLabel: { fontSize: 10, fontWeight: '800' as const, color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 2 },
  distanceValue: { fontSize: 36, fontWeight: '900' as const, color: COLORS.textPrimary, letterSpacing: -1 },
  destNameSmall: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  radiusInfo: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,47,167,0.06)', borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12, marginBottom: 12, gap: 6,
  },
  radiusInfoText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' as const },

  stopBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    backgroundColor: COLORS.surface, borderRadius: 12, height: 48, gap: 8,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  stopBtnText: { fontSize: 14, fontWeight: '900' as const, color: COLORS.primary, letterSpacing: 1.2 },
});
