import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/theme';
import { BRAND_NAVY } from '../../constants/branding';
import { MAP_HTML } from '../../services/maps/mapHtml';
import { canUseGoogleMaps } from '../../services/maps/mapProvider';
import { reverseGeocode } from '../../services/maps/osm';
import { reverseGeocodeGoogle } from '../../services/maps/googleMapsPlaces';
import { useLocationPermission } from '../../location/LocationPermissionProvider';
import { fetchCurrentPosition } from '../../location/fetchCurrentPosition';
import { usePremiumEntitlement } from '../../entitlement/usePremiumEntitlement';
import { estimateJourney } from '../../rideEstimate/estimateJourney';
import { formatDurationSeconds, formatMeters } from '../../rideEstimate/formatJourney';
import { PublicTransitTrips } from '../../components/ride/PublicTransitTrips';
import {
  olaLaunchCategory,
  overviewModeForCategory,
  platformsForCategory,
  primaryPlatformForCategory,
  productMatchesCategory,
  RIDE_CATEGORY_TABS,
  VEHICLE_CATEGORIES,
  type RideCategoryId,
  type VehicleCategoryId,
} from '../../rideEstimate/rideCategories';
import type { BlaBlaCarRideOffer } from '../../rideEstimate/blaBlaCarCatalog';
import {
  fetchBlaBlaCarProStatus,
  loginBlaBlaCarPro,
  logoutBlaBlaCarPro,
  searchBlaBlaCarProRides,
} from '../../rideEstimate/blaBlaCarPro';
import {
  ALL_PLATFORM_CARDS,
  type PlatformCard,
} from '../../rideEstimate/platformCatalog';
import { headlineOfficialFare } from '../../rideEstimate/providerCards';
import { fetchOlaRideCatalog } from '../../rideEstimate/olaApi';
import type { OlaProductOffer } from '../../rideEstimate/olaCatalog';
import {
  openAndroidPackageOrStore,
  openOla,
  openRapido,
  openTransitDirections,
  openUber,
} from '../../rideEstimate/rideDeepLinks';
import { searchPlacesForRide } from '../../rideEstimate/searchPlacesForRide';
import {
  disconnectUber,
  fetchUberConnection,
  fetchUberRideCatalog,
  startUberConnect,
  UBER_APP_RETURN_SCHEME,
} from '../../rideEstimate/uberAuth';
import type { UberProductOffer } from '../../rideEstimate/uberCatalog';
import type {
  JourneyEstimate,
  OverviewModeId,
  RidePlace,
} from '../../rideEstimate/types';
import type { MainTabParamList } from '../../types/navigation';

const WebView = require('react-native-webview').WebView;

type FieldId = 'pickup' | 'destination';

export default function RideEstimateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'RideEstimate'>>();
  const webViewRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const { requestLocationAccess } = useLocationPermission();
  const { entitlement, premium, loading: entitlementLoading } = usePremiumEntitlement();

  const useGoogleMap =
    !entitlementLoading && premium && canUseGoogleMaps(entitlement);

  const [pickup, setPickup] = useState<RidePlace | null>(null);
  const [destination, setDestination] = useState<RidePlace | null>(null);
  const [pickupQuery, setPickupQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [activeField, setActiveField] = useState<FieldId>('destination');
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [selectedMode, setSelectedMode] = useState<OverviewModeId>('car');
  const [rideCategory, setRideCategory] = useState<RideCategoryId>('all');
  const [searching, setSearching] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [journey, setJourney] = useState<JourneyEstimate | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<RidePlace[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [uberConnected, setUberConnected] = useState(false);
  const [uberConnecting, setUberConnecting] = useState(false);
  const [uberProducts, setUberProducts] = useState<UberProductOffer[]>([]);
  const [olaProducts, setOlaProducts] = useState<OlaProductOffer[]>([]);
  const [partnerBusy, setPartnerBusy] = useState(false);
  const [bbcConfigured, setBbcConfigured] = useState(false);
  const [bbcLoggedIn, setBbcLoggedIn] = useState(false);
  const [bbcName, setBbcName] = useState<string | null>(null);
  const [bbcLogin, setBbcLogin] = useState('');
  const [bbcPassword, setBbcPassword] = useState('');
  const [bbcBusy, setBbcBusy] = useState(false);
  const [bbcRides, setBbcRides] = useState<BlaBlaCarRideOffer[]>([]);
  const [bbcMessage, setBbcMessage] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMapCommand = useCallback((command: object) => {
    const js = `window.cmd && window.cmd(${JSON.stringify(command)}); true;`;
    webViewRef.current?.injectJavaScript?.(js);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await (await import('@react-native-async-storage/async-storage')).default.getItem(
          'savedPlaces'
        );
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as { name?: string; lat?: number; lng?: number }[];
        setSavedPlaces(
          parsed
            .filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng))
            .map((place) => ({ name: place.name as string, lat: place.lat as number, lng: place.lng as number }))
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const incoming = route.params?.destination;
      if (!incoming) return;
      setDestination(incoming);
      setDestQuery(incoming.name);
      navigation.setParams({ destination: undefined });
    }, [route.params?.destination, navigation])
  );

  const applyGpsPickup = useCallback(async () => {
    const perm = await requestLocationAccess('foreground_only');
    if (perm.cancelled || !perm.foregroundGranted) {
      setGpsDenied(true);
      return;
    }
    const coords = await fetchCurrentPosition(true);
    if (!coords) {
      setGpsDenied(true);
      Alert.alert('Location', 'Could not read GPS. Search for a pickup instead.');
      return;
    }
    setGpsDenied(false);
    const lookup = useGoogleMap ? reverseGeocodeGoogle : reverseGeocode;
    const label = await lookup(coords.lat, coords.lng)
      .then((result) => result.display_name)
      .catch(() => 'Current location');
    const name = label || 'Current location';
    setPickup({ name, lat: coords.lat, lng: coords.lng });
    setPickupQuery(name);
  }, [requestLocationAccess, useGoogleMap]);

  const gpsTriedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (gpsTriedRef.current) return;
      gpsTriedRef.current = true;
      applyGpsPickup().catch(() => {});
    }, [applyGpsPickup])
  );

  const typedQuery = activeField === 'pickup' ? pickupQuery : destQuery;
  const selectedName = activeField === 'pickup' ? pickup?.name ?? '' : destination?.name ?? '';

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = typedQuery.trim();
    if (q.length < 2 || q === selectedName.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      setSearching(true);
      searchPlacesForRide(q, entitlement, pickup)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [typedQuery, selectedName, entitlement, pickup, activeField]);

  useEffect(() => {
    if (!pickup || !destination) {
      setJourney(null);
      setEstimateError(null);
      return;
    }
    if (
      pickupQuery.trim() !== pickup.name.trim() ||
      destQuery.trim() !== destination.name.trim()
    ) {
      return;
    }
    let cancelled = false;
    setLoadingEstimate(true);
    setEstimateError(null);
    estimateJourney(pickup, destination)
      .then((next) => {
        if (cancelled) return;
        setJourney(next);
        if (next.busRoutes.length > 0) {
          setSelectedMode('transit');
        } else {
          const prefer =
            next.overview.find((item) => item.mode === 'car') ??
            next.fastest ??
            next.overview[0];
          if (prefer) setSelectedMode(prefer.mode);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJourney(null);
          setEstimateError('Could not calculate routes. Check your network and try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEstimate(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, pickupQuery, destQuery]);

  useEffect(() => {
    if (!mapReady || useGoogleMap) return;
    if (pickup) {
      sendMapCommand({ type: 'setPickup', lat: pickup.lat, lng: pickup.lng });
    }
    if (destination) {
      sendMapCommand({
        type: 'setDestination',
        lat: destination.lat,
        lng: destination.lng,
        radius: 0,
      });
    }
    const selectedGeometry =
      journey?.overview.find((item) => item.mode === selectedMode)?.geometry ??
      journey?.previewGeometry ??
      [];
    const latlngs = selectedGeometry.map((point) => [point.lat, point.lng]);
    sendMapCommand({ type: 'setRoute', latlngs });
    if (pickup && destination && latlngs.length < 2) {
      sendMapCommand({ type: 'fitToUserAndDestination', padding: 60, maxZoom: 15 });
    }
  }, [mapReady, useGoogleMap, pickup, destination, journey, selectedMode, sendMapCommand]);

  const selectResult = (name: string, lat: number, lng: number) => {
    const place = { name, lat, lng };
    if (activeField === 'pickup') {
      setPickup(place);
      setPickupQuery(name);
    } else {
      setDestination(place);
      setDestQuery(name);
    }
    setResults([]);
    Keyboard.dismiss();
  };

  const swapPlaces = () => {
    setPickup(destination);
    setDestination(pickup);
    setPickupQuery(destQuery);
    setDestQuery(pickupQuery);
  };

  const setAlarmFromDestination = () => {
    if (!destination) return;
    navigation.navigate('Tracking', {
      screen: 'Home',
      params: {
        savedPlace: {
          name: destination.name,
          lat: destination.lat,
          lng: destination.lng,
        },
      },
    });
  };

  const refreshUberStatus = useCallback(async () => {
    try {
      const status = await fetchUberConnection();
      setUberConnected(status.connected);
      return status.connected;
    } catch {
      setUberConnected(false);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshUberStatus().catch(() => {});
  }, [refreshUberStatus]);

  useEffect(() => {
    fetchBlaBlaCarProStatus()
      .then((status) => {
        setBbcConfigured(status.configured);
        setBbcLoggedIn(status.loggedIn);
        setBbcName(status.firstName ?? status.login);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      if (!url.startsWith(UBER_APP_RETURN_SCHEME)) return;
      refreshUberStatus().catch(() => {});
    };
    const sub = Linking.addEventListener('url', onUrl);
    Linking.getInitialURL()
      .then((url) => {
        if (url) onUrl({ url });
      })
      .catch(() => {});
    return () => sub.remove();
  }, [refreshUberStatus]);

  useEffect(() => {
    if (!pickup || !destination) {
      setUberProducts([]);
      setOlaProducts([]);
      setBbcRides([]);
      return;
    }
    let cancelled = false;
    setPartnerBusy(true);
    (async () => {
      try {
        const [uber, ola] = await Promise.all([
          fetchUberRideCatalog(pickup, destination).catch(() => ({
            connected: false,
            products: [] as UberProductOffer[],
          })),
          fetchOlaRideCatalog(pickup, destination).catch(() => ({ configured: false, products: [] })),
        ]);
        if (cancelled) return;
        setUberConnected(uber.connected);
        setUberProducts(uber.products);
        setOlaProducts(ola.products);
      } finally {
        if (!cancelled) setPartnerBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, uberConnected]);

  useEffect(() => {
    if (!pickup || !destination || !bbcLoggedIn) {
      if (!bbcLoggedIn) setBbcRides([]);
      return;
    }
    let cancelled = false;
    const now = new Date();
    const departureDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    searchBlaBlaCarProRides(pickup, destination, departureDate)
      .then((result) => {
        if (cancelled) return;
        setBbcConfigured(result.configured);
        setBbcLoggedIn(result.loggedIn);
        setBbcRides(result.rides);
        setBbcMessage(result.message ?? (result.rides.length ? null : 'No BlaBlaCar Pro buses for this route today.'));
      })
      .catch(() => {
        if (!cancelled) setBbcMessage('Could not load BlaBlaCar Pro rides.');
      });
    return () => {
      cancelled = true;
    };
  }, [pickup, destination, bbcLoggedIn]);

  const submitBlaBlaCarLogin = async () => {
    setBbcBusy(true);
    try {
      const status = await loginBlaBlaCarPro(bbcLogin, bbcPassword);
      setBbcConfigured(status.configured);
      setBbcLoggedIn(status.loggedIn);
      setBbcName(status.firstName ?? status.login);
      setBbcPassword('');
    } catch (e) {
      Alert.alert('BlaBlaCar Pro', e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setBbcBusy(false);
    }
  };

  const connectUber = async () => {
    setUberConnecting(true);
    try {
      await startUberConnect();
    } catch (e) {
      Alert.alert('Uber', e instanceof Error ? e.message : 'Could not start Uber sign-in.');
    } finally {
      setUberConnecting(false);
    }
  };

  const openPlatform = async (card: PlatformCard, category?: string) => {
    try {
      if (card.id === 'uber') {
        if (!pickup || !destination) throw new Error('Set pickup and destination first.');
        await openUber(pickup, destination);
        return;
      }
      if (card.id === 'ola') {
        if (!pickup || !destination) throw new Error('Set pickup and destination first.');
        await openOla(pickup, destination, category);
        return;
      }
      if (card.id === 'rapido') {
        await openRapido();
        return;
      }
      if (card.id === 'google_maps') {
        if (!pickup || !destination) throw new Error('Set pickup and destination first.');
        await openTransitDirections(pickup, destination);
        return;
      }
      await openAndroidPackageOrStore(card.androidPackage);
    } catch {
      Alert.alert('Could not open app', `Install ${card.name} or try again.`);
    }
  };

  const selectedRoute =
    journey?.overview.find((item) => item.mode === selectedMode) ?? journey?.overview[0] ?? null;
  const mapRoute = selectedRoute?.geometry ?? journey?.previewGeometry ?? [];
  const shortest = journey?.shortest;
  const fastest = journey?.fastest;

  const selectCategory = (id: RideCategoryId) => {
    setRideCategory(id);
    if (id !== 'all') {
      const mode = overviewModeForCategory(id);
      if (journey?.overview.some((item) => item.mode === mode) || id === 'transit') {
        setSelectedMode(mode);
      }
    }
  };

  const categoryFare = (id: VehicleCategoryId): { fare: string; hint: string } => {
    const duration = journey?.overview.find((item) => item.mode === overviewModeForCategory(id));
    const durationLabel = duration
      ? duration.durationText ?? formatDurationSeconds(duration.durationSeconds)
      : null;
    if (id === 'transit') {
      const priced = journey?.busRoutes.find((route) => route.fareLabel)?.fareLabel;
      const count = journey?.busRoutes.length ?? 0;
      return {
        fare: priced ?? durationLabel ?? 'Price not shown',
        hint: count > 0 ? `${count} trip${count > 1 ? 's' : ''}` : 'No trip yet',
      };
    }
    const fare = headlineOfficialFare([
      ...olaProducts
        .filter((offer) => offer.available && productMatchesCategory(offer.displayName, id))
        .map((offer) => offer.estimate),
      ...uberProducts
        .filter((offer) => productMatchesCategory(offer.displayName, id))
        .map((offer) => offer.estimate),
    ]);
    return {
      fare: fare ?? 'Price not shown',
      hint: durationLabel ?? 'Time after you pick places',
    };
  };

  const visiblePlatforms: PlatformCard[] =
    rideCategory === 'all'
      ? []
      : ALL_PLATFORM_CARDS.filter((card) => platformsForCategory(rideCategory).includes(card.id));
  const primaryCard =
    rideCategory === 'all'
      ? null
      : ALL_PLATFORM_CARDS.find((card) => card.id === primaryPlatformForCategory(rideCategory));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.fullScroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Icon name="navigate-circle-outline" size={22} color={BRAND_NAVY} />
          <Text style={styles.headerTitle}>Napz Ride Compare</Text>
        </View>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchFields}>
          <View style={[styles.searchRow, activeField === 'pickup' && styles.searchRowFocus]}>
            <View style={styles.pickupDot} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pickup"
              placeholderTextColor={COLORS.textSecondary}
              value={pickupQuery}
              onChangeText={(text) => {
                setPickupQuery(text);
                setActiveField('pickup');
                setShowSaved(false);
              }}
              onFocus={() => {
                setActiveField('pickup');
                setShowSaved(false);
              }}
              returnKeyType="search"
            />
            {searching && activeField === 'pickup' ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <TouchableOpacity onPress={() => { applyGpsPickup().catch(() => {}); }} accessibilityLabel="Use current location">
                <Icon name="locate" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.searchRow, activeField === 'destination' && styles.searchRowFocus]}>
            <View style={styles.destDot} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination"
              placeholderTextColor={COLORS.textSecondary}
              value={destQuery}
              onChangeText={(text) => {
                setDestQuery(text);
                setActiveField('destination');
                setShowSaved(false);
              }}
              onFocus={() => {
                setActiveField('destination');
                setShowSaved(false);
              }}
              returnKeyType="search"
            />
            {searching && activeField === 'destination' ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : destQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setDestQuery('');
                  setDestination(null);
                  setResults([]);
                }}
                accessibilityLabel="Clear destination"
              >
                <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <TouchableOpacity style={styles.swapSide} onPress={swapPlaces} accessibilityLabel="Swap pickup and destination">
          <Icon name="swap-vertical" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      {gpsDenied ? (
        <Text style={styles.warnPad}>Location is off. Search pickup or tap the locate icon after enabling GPS.</Text>
      ) : null}
      <TouchableOpacity style={styles.savedLink} onPress={() => setShowSaved((value) => !value)}>
        <Icon name="bookmark-outline" size={16} color={COLORS.primary} />
        <Text style={styles.chipText}>Choose from saved places</Text>
      </TouchableOpacity>
      {showSaved ? (
        savedPlaces.length === 0 ? (
          <Text style={styles.mutedPad}>No saved places on this phone.</Text>
        ) : (
          savedPlaces.map((place) => (
            <TouchableOpacity
              key={`${place.name}-${place.lat}`}
              style={styles.resultRow}
              onPress={() => {
                selectResult(place.name, place.lat, place.lng);
                setShowSaved(false);
              }}
            >
              <Icon name="bookmark-outline" size={16} color={COLORS.primary} />
              <Text style={styles.resultText}>{place.name}</Text>
            </TouchableOpacity>
          ))
        )
      ) : null}
      {results.map((item) => (
        <TouchableOpacity
          key={`${item.lat}-${item.lon}-${item.display_name}`}
          style={styles.resultRow}
          onPress={() => selectResult(item.display_name, Number(item.lat), Number(item.lon))}
        >
          <Icon name="location-outline" size={16} color={COLORS.alarm} />
          <Text style={styles.resultText}>{item.display_name}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.mapWrap}>
        {useGoogleMap ? (
          <RideEstimateGoogleLazy
            mapRef={googleMapRef}
            pickup={pickup}
            destination={destination}
            route={mapRoute}
            onMapReady={() => setMapReady(true)}
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: MAP_HTML, baseUrl: 'https://localhost/' }}
            style={styles.map}
            onMessage={() => setMapReady(true)}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            originWhitelist={['*']}
          />
        )}
      </View>

      <View style={styles.sheetContent}>
        {loadingEstimate ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.muted}>Finding ways to go…</Text>
          </View>
        ) : null}
        {estimateError ? <Text style={styles.warn}>{estimateError}</Text> : null}

        {pickup && destination ? (
          <>
            <Text style={styles.compareHeading}>
              {rideCategory === 'transit' ? 'Bus, metro, and train' : 'Pick how to go'}
            </Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryStrip}
            >
              {RIDE_CATEGORY_TABS.map((tab) => {
                const on = tab.id === rideCategory;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.categoryTab, on && styles.categoryTabOn]}
                    onPress={() => selectCategory(tab.id)}
                  >
                    <Text style={[styles.categoryTabText, on && styles.categoryTabTextOn]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {partnerBusy ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.muted}>Looking up prices…</Text>
              </View>
            ) : null}

            {rideCategory !== 'transit'
              ? (rideCategory === 'all'
                  ? VEHICLE_CATEGORIES
                  : VEHICLE_CATEGORIES.filter((item) => item.id === rideCategory)
                ).map((item) => {
                  const summary = categoryFare(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.compareRow}
                      onPress={() => selectCategory(item.id)}
                    >
                      <View style={styles.compareIconWrap}>
                        <Icon name={item.icon} size={22} color={BRAND_NAVY} />
                      </View>
                      <View style={styles.compareCopy}>
                        <Text style={styles.compareTitle}>{item.label}</Text>
                        <Text style={styles.compareHint}>{item.hint}</Text>
                      </View>
                      <View style={styles.compareFareWrap}>
                        <Text style={styles.compareFare}>{summary.fare}</Text>
                        <Text style={styles.compareFareHint}>{summary.hint}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              : null}

            {rideCategory !== 'all' && rideCategory !== 'transit' && visiblePlatforms.map((card) => (
              <View key={card.id} style={styles.compareRow}>
                <View style={styles.compareCopy}>
                  <Text style={styles.compareTitle}>{card.name}</Text>
                  <Text style={styles.compareHint}>{card.hint}</Text>
                  {card.id === 'uber'
                    ? uberProducts
                        .filter((offer) =>
                          productMatchesCategory(offer.displayName, rideCategory)
                        )
                        .map((offer) => (
                          <Text key={offer.productId} style={styles.compareOffer}>
                            {offer.displayName}: {offer.estimate ?? 'See price in the app'}
                          </Text>
                        ))
                    : null}
                  {card.id === 'ola'
                    ? olaProducts
                        .filter((offer) =>
                          productMatchesCategory(offer.displayName, rideCategory)
                        )
                        .map((offer) => (
                          <Text key={offer.categoryId} style={styles.compareOffer}>
                            {offer.displayName}: {offer.available ? offer.estimate ?? 'See price in the app' : 'Not nearby'}
                          </Text>
                        ))
                    : null}
                  {card.id === 'uber' && !uberConnected && uberProducts.length === 0 ? (
                    <TouchableOpacity onPress={() => { connectUber().catch(() => {}); }} disabled={uberConnecting}>
                      <Text style={styles.secondaryActionText}>
                        {uberConnecting ? 'Opening Uber…' : 'Connect Uber for prices'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {card.id === 'blablacar' && bbcLoggedIn ? (
                    bbcRides.map((ride) => (
                      <Text key={ride.id} style={styles.compareOffer}>
                        {ride.summary}: {ride.fareLabel ?? 'See price in the app'}
                      </Text>
                    ))
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    openPlatform(
                      card,
                      rideCategory === 'all' ? undefined : olaLaunchCategory(rideCategory)
                    ).catch(() => {});
                  }}
                >
                  <Icon name="open-outline" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}

            {rideCategory === 'transit' ? (
              <PublicTransitTrips
                routes={journey?.busRoutes ?? []}
                destinationName={destination?.name}
                onStart={() => {
                  const maps = ALL_PLATFORM_CARDS.find((card) => card.id === 'google_maps');
                  if (maps) openPlatform(maps).catch(() => {});
                }}
              />
            ) : null}

            {rideCategory === 'car' && selectedRoute?.mode === 'car' ? (
              <Text style={styles.note}>
                {selectedRoute.distanceText ?? formatMeters(selectedRoute.distanceMeters)} ·{' '}
                {selectedRoute.durationText ?? formatDurationSeconds(selectedRoute.durationSeconds)}
                {selectedRoute.durationIsTrafficAware ? ' · traffic' : ''}
              </Text>
            ) : null}

            {rideCategory !== 'transit' && shortest ? (
              <Text style={styles.muted}>
                Shortest {formatMeters(shortest.distanceMeters)}
                {fastest ? ` · Fastest ${formatDurationSeconds(fastest.durationSeconds)}` : ''}
              </Text>
            ) : null}

            {primaryCard && rideCategory !== 'transit' ? (
              <TouchableOpacity
                style={styles.blackCta}
                onPress={() => {
                  openPlatform(
                    primaryCard,
                    rideCategory === 'all' ? undefined : olaLaunchCategory(rideCategory)
                  ).catch(() => {});
                }}
              >
                <Text style={styles.blackCtaText}>Open {primaryCard.name}</Text>
                <Icon name="open-outline" size={16} color="#FFF" />
              </TouchableOpacity>
            ) : null}

            <Text style={styles.footerNote}>
              {rideCategory === 'transit'
                ? 'Ticket price is shown only when Google sends it. If not, pay on the bus or metro.'
                : 'A price is shown only when the ride app sends it.'}
            </Text>
          </>
        ) : null}

        {destination ? (
          <TouchableOpacity style={styles.alarmBtn} onPress={setAlarmFromDestination}>
            <Icon name="alarm-outline" size={18} color="#FFF" />
            <Text style={styles.alarmText}>Set destination alarm</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RideEstimateGoogleLazy(props: {
  mapRef: RefObject<any>;
  pickup: RidePlace | null;
  destination: RidePlace | null;
  route: { lat: number; lng: number }[];
  onMapReady: () => void;
}) {
  const Map = require('../../components/map/RideEstimateGoogleMap').RideEstimateGoogleMap;
  return <Map {...props} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  fullScroll: { paddingBottom: 48, flexGrow: 1 },
  header: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
    minHeight: 40,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: BRAND_NAVY },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 4,
  },
  searchFields: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  searchRowFocus: { backgroundColor: 'rgba(0,47,167,0.06)' },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.alarm,
  },
  searchInput: { flex: 1, height: 40, color: COLORS.textPrimary, fontSize: 15 },
  swapSide: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  savedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  warnPad: { color: COLORS.alarm, fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  mutedPad: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 16 },
  mapWrap: { height: 168, backgroundColor: '#DCE6F5', marginTop: 4 },
  map: { flex: 1 },
  categoryStrip: { paddingVertical: 8, paddingRight: 16, gap: 8, alignItems: 'center' },
  categoryTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 6,
  },
  categoryTabOn: { backgroundColor: '#EEF1F6' },
  categoryTabText: { fontSize: 14, fontWeight: '700', color: '#9AA3B2' },
  categoryTabTextOn: { color: BRAND_NAVY },
  compareHeading: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compareIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareCopy: { flex: 1 },
  compareTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  compareHint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  compareOffer: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  compareFareWrap: { alignItems: 'flex-end', maxWidth: 140 },
  compareFare: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'right' },
  compareFareHint: { fontSize: 11, color: '#9AA3B2', marginTop: 2, textAlign: 'right' },
  blackCta: {
    marginTop: 18,
    backgroundColor: '#111',
    borderRadius: 28,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  blackCtaText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  footerNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 12, lineHeight: 16 },
  sheetContent: { paddingHorizontal: 16, paddingTop: 8 },
  shortestCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  shortestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  shortestValue: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginTop: 2 },
  selectedStats: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 6 },
  resultRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  resultText: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  section: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  liveBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  nextBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  fare: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginTop: 6 },
  note: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16 },
  leg: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineSwatch: { width: 10, height: 28, borderRadius: 4 },
  legTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  action: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: { color: '#FFF', fontWeight: '800' },
  secondaryAction: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryActionText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  alarmBtn: {
    marginTop: 8,
    backgroundColor: COLORS.alarm,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  alarmText: { color: '#FFF', fontWeight: '800' },
  warn: { color: COLORS.alarm, fontSize: 12, marginTop: 8, lineHeight: 16 },
  muted: { color: COLORS.textSecondary, fontSize: 13, marginTop: 8 },
});
