import { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Linking, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import { fetchCurrentPosition } from '../../location/fetchCurrentPosition';
import { useLocationPermission } from '../../location/LocationPermissionProvider';
import {
  canAddSavedPlace,
  canUseCloudBackup,
  clampRadiusForEntitlement,
  hiddenSavedPlaceCount,
  maxSavedPlaces,
  visibleSavedPlaces,
} from '../../entitlement/PremiumGate';
import { FreeBannerAd } from '../../ads/FreeBannerAd';
import { initAdMob } from '../../ads/initAdMob';
import { showUpgradePrompt } from '../../entitlement/showUpgradePrompt';
import { usePremiumEntitlement } from '../../entitlement/usePremiumEntitlement';
import {
  deleteSavedPlaceFromFirebase,
  fetchSavedPlacesFromFirebase,
  upsertSavedPlaceToFirebase,
} from '../../services/firebase/userLocationSync';

interface SavedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  createdAt: string;
}

function mapsGoogleUrl(place: SavedPlace): string {
  const q = encodeURIComponent(`${place.lat},${place.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function mapsAppleUrl(place: SavedPlace): string {
  const label = encodeURIComponent(place.name);
  return `http://maps.apple.com/?ll=${place.lat},${place.lng}&q=${label}`;
}

/** Android: opens a chooser for installed map apps. */
function mapsGeoUrl(place: SavedPlace): string {
  const label = encodeURIComponent(place.name);
  return `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}(${label})`;
}

async function openExternalUrl(url: string, fallbackMessage: string) {
  try {
    // On Android 11+, canOpenURL can be false even when an app can handle the URL.
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', fallbackMessage);
  }
}

export default function SavedPlacesScreen() {
  const navigation = useNavigation<any>();
  const { entitlement, savedPlacesLimit, premium, radiusBounds } = usePremiumEntitlement();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const shownPlaces = visibleSavedPlaces(places, entitlement);
  const hiddenCount = hiddenSavedPlaceCount(places.length, entitlement);
  const [showModal, setShowModal] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeRadius, setPlaceRadius] = useState('1000');
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { requestLocationAccess } = useLocationPermission();

  useEffect(() => {
    initAdMob();
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (!user) {
        setPlaces([]);
        return;
      }
      loadPlaces().catch(() => {});
    });
    return unsubscribe;
  // loadPlaces closes over the latest entitlement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitlement]);

  const loadPlaces = async () => {
    try {
      const placesStr = await AsyncStorage.getItem('savedPlaces');
      const local: SavedPlace[] = placesStr ? JSON.parse(placesStr) : [];
      if (!canUseCloudBackup(entitlement)) {
        setPlaces(local);
        return;
      }
      let cloud: SavedPlace[] = [];
      try {
        cloud = await fetchSavedPlacesFromFirebase();
      } catch {
        cloud = [];
      }
      const byId = new Map<string, SavedPlace>();
      for (const p of local) byId.set(p.id, p);
      for (const p of cloud) {
        const existing = byId.get(p.id);
        if (!existing || String(p.createdAt) >= String(existing.createdAt)) {
          byId.set(p.id, p);
        }
      }
      const merged = Array.from(byId.values());
      setPlaces(merged);
      await AsyncStorage.setItem('savedPlaces', JSON.stringify(merged));
    } catch (e) {
      console.error('Error loading places:', e);
    }
  };

  const getCurrentLocation = async () => {
    if (!canAddSavedPlace(entitlement, places.length)) {
      showUpgradePrompt(
        navigation,
        `This plan includes up to ${maxSavedPlaces(entitlement)} saved places. Upgrade for more cloud storage.`
      );
      return;
    }

    setLoading(true);
    try {
      const perm = await requestLocationAccess('foreground_only');
      if (perm.cancelled || !perm.foregroundGranted) {
        setLoading(false);
        return;
      }
      const coords = await fetchCurrentPosition(true);
      if (!coords) {
        Alert.alert('Error', 'Could not get current location. Please try again.');
        return;
      }
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      setShowModal(true);
    } catch {
      Alert.alert('Error', 'Could not get current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePlace = async () => {
    if (!placeName.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return;
    }

    if (currentLat === null || currentLng === null) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    if (!canAddSavedPlace(entitlement, places.length)) {
      showUpgradePrompt(
        navigation,
        `This plan includes up to ${maxSavedPlaces(entitlement)} saved places. Upgrade for more cloud storage.`
      );
      return;
    }

    const parsedRadius = parseInt(placeRadius, 10) || 1000;
    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      name: placeName,
      lat: currentLat,
      lng: currentLng,
      radius: clampRadiusForEntitlement(entitlement, parsedRadius),
      createdAt: new Date().toISOString(),
    };

    try {
      const updatedPlaces = [...places, newPlace];
      await AsyncStorage.setItem('savedPlaces', JSON.stringify(updatedPlaces));
      setPlaces(updatedPlaces);
      if (canUseCloudBackup(entitlement)) {
        void upsertSavedPlaceToFirebase(newPlace).catch(() => {});
      }
      setShowModal(false);
      setPlaceName('');
      setPlaceRadius('1000');
      setCurrentLat(null);
      setCurrentLng(null);
      Alert.alert('Success', `"${placeName}" saved successfully!`);
    } catch {
      Alert.alert('Error', 'Failed to save place');
    }
  };

  const deletePlace = async (id: string) => {
    Alert.alert('Delete', 'Remove this place?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedPlaces = places.filter((p) => p.id !== id);
            await AsyncStorage.setItem('savedPlaces', JSON.stringify(updatedPlaces));
            setPlaces(updatedPlaces);
            if (canUseCloudBackup(entitlement)) {
              void deleteSavedPlaceFromFirebase(id).catch(() => {});
            }
            Alert.alert('Success', 'Place deleted');
          } catch {
            Alert.alert('Error', 'Failed to delete place');
          }
        },
      },
    ]);
  };

  const trackPlace = (place: SavedPlace) => {
    navigation.navigate('Tracking', {
      screen: 'Home',
      params: {
        savedPlace: {
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          radius: place.radius,
        },
      },
    });
  };

  const estimateRide = (place: SavedPlace) => {
    navigation.navigate('RideEstimate', {
      destination: { name: place.name, lat: place.lat, lng: place.lng },
    });
  };

  const sharePlaceViaSystem = async (place: SavedPlace) => {
    const mapsUrl = mapsGoogleUrl(place);
    const message = `${place.name}\n${mapsUrl}`;
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: place.name, url: mapsUrl }
          : { message, title: place.name }
      );
    } catch {
      // User cancelled or share unavailable
    }
  };

  const sharePlace = (place: SavedPlace) => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
      {
        text: 'Google Maps',
        onPress: () =>
          openExternalUrl(mapsGoogleUrl(place), 'Could not open Google Maps.'),
      },
    ];

    if (Platform.OS === 'ios') {
      buttons.push({
        text: 'Apple Maps',
        onPress: () =>
          openExternalUrl(mapsAppleUrl(place), 'Could not open Apple Maps.'),
      });
    } else {
      buttons.push({
        text: 'Other map apps',
        onPress: () =>
          openExternalUrl(
            mapsGeoUrl(place),
            'No map app found that can open this location.',
          ),
      });
    }

    buttons.push(
      {
        text: 'Share…',
        onPress: () => {
          sharePlaceViaSystem(place).catch(() => {});
        },
      },
      { text: 'Cancel', style: 'cancel' },
    );

    Alert.alert('Share place', place.name, buttons);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Icon name="location" size={22} color={COLORS.primary} />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Saved Places</Text>
            <Text style={styles.headerSubtitle}>
              {canUseCloudBackup(entitlement)
                ? `${shownPlaces.length}/${savedPlacesLimit} cloud-saved · Google Maps`
                : hiddenCount > 0
                  ? `${shownPlaces.length}/${savedPlacesLimit} shown · ${hiddenCount} more kept in cloud until you upgrade`
                  : `${shownPlaces.length}/${savedPlacesLimit} on this device · OSM`}
            </Text>
          </View>
        </View>

        <View style={styles.adSlot}>
          <FreeBannerAd />
        </View>

        {shownPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="map-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Saved Places</Text>
            <Text style={styles.emptySubtitle}>Add your first location to get started</Text>
          </View>
        ) : (
          <View style={styles.placesContainer}>
            {shownPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                onPress={() => trackPlace(place)}
                activeOpacity={0.75}
              >
                <View style={styles.placeLeft}>
                  <View style={styles.placeIcon}>
                    <Icon name="location" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.placeDetails}>
                      <Icon name="radio-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.placeRadius}>{place.radius}m radius</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.placeActions}>
                  <View style={styles.trackBtn}>
                    <Icon name="navigate" size={14} color="#FFF" />
                    <Text style={styles.trackBtnText}>Track</Text>
                  </View>
                  <View style={styles.iconRow}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        estimateRide(place);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Estimate ride to ${place.name}`}
                    >
                      <Icon name="bus-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        sharePlace(place);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Share ${place.name}`}
                    >
                      <MaterialIcon name="share" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        deletePlace(place.id);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={`Delete ${place.name}`}
                    >
                      <Icon name="trash" size={18} color={COLORS.alarm} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabButton}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <Icon name="add" size={28} color="#FFF" />
            <Text style={styles.fabText}>Add Place</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Save This Location</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.locationBox}>
                <Icon name="location-sharp" size={24} color={COLORS.primary} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Current Location</Text>
                  <Text style={styles.locationReadyText}>Ready to save</Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Place Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Home, College, Bus Stop"
                placeholderTextColor={COLORS.textSecondary}
                value={placeName}
                onChangeText={setPlaceName}
              />

              <Text style={styles.inputLabel}>Alert Radius (meters)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 1000"
                placeholderTextColor={COLORS.textSecondary}
                value={placeRadius}
                onChangeText={setPlaceRadius}
                keyboardType="number-pad"
              />

              <View style={styles.radiusExamples}>
                <TouchableOpacity
                  style={styles.radiusTag}
                  onPress={() => setPlaceRadius(String(Math.max(radiusBounds.min, 500)))}
                >
                  <Text style={styles.radiusTagText}>{Math.max(radiusBounds.min, 500)}m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusTag}
                  onPress={() => setPlaceRadius('1000')}
                >
                  <Text style={styles.radiusTagText}>1km</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radiusTag}
                  onPress={() => setPlaceRadius('2000')}
                >
                  <Text style={styles.radiusTagText}>2km</Text>
                </TouchableOpacity>
                {premium ? (
                  <TouchableOpacity
                    style={styles.radiusTag}
                    onPress={() => setPlaceRadius('5000')}
                  >
                    <Text style={styles.radiusTagText}>5km</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {!premium ? (
                <Text style={styles.emptySubtitle}>Free alert radius is 500m–2km. Upgrade for 50m–5km.</Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={savePlace}
              >
                <Icon name="checkmark" size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>SAVE PLACE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  adSlot: { marginBottom: 14, alignItems: 'center' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },

  placesContainer: { gap: 12 },
  placeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  placeLeft: { flexDirection: 'row', flex: 1, marginRight: 10 },
  placeIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(0,47,167,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  placeDetails: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  placeRadius: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  placeActions: { alignItems: 'center', gap: 8 },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  trackBtnText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 4 },

  fabButton: { position: 'absolute' as const, bottom: 20, right: 20, width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { fontSize: 10, color: '#FFF', fontWeight: '600', marginTop: 2 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { flex: 1, backgroundColor: COLORS.background, marginTop: 100, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  modalScroll: { paddingHorizontal: 16, paddingVertical: 20 },

  locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,47,167,0.06)', borderRadius: 12, padding: 14, marginBottom: 20, gap: 12 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
  locationReadyText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  textInput: { backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, marginBottom: 16 },

  radiusExamples: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  radiusTag: { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  radiusTagText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  modalButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  saveBtn: { flex: 1, height: 48, borderRadius: 10, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
