// LocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, View, StyleSheet, TouchableOpacity, TextInput, 
  Text, ActivityIndicator, Alert, Platform, Linking 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { $ } from '../styles';
import { AppButton } from './appbutton.component';
import { CustomIcon, CustomIcons } from './customicons.component';
import Geolocation from 'react-native-geolocation-service';
import { Geocoding } from '../services/geocoding.service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

type LocationPickerProps = {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => void;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
}) => {
  // Safety check to prevent crashes
  if (!visible) {
    return null;
  }

  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addressDetails, setAddressDetails] = useState({ city: '', state: '', country: '', pincode: '' });
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied' | 'blocked'>('unknown');
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => checkLocationPermission(), 200);
    } else {
      setSelectedLocation(null);
      setAddress('');
      setSearchQuery('');
      setAddressDetails({ city: '', state: '', country: '', pincode: '' });
      setMapError(null);
    }
  }, [visible]);

  const checkLocationPermission = async () => {
    try {
      const permissionConst = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      const status = await check(permissionConst);

      if (status === RESULTS.GRANTED) {
        setLocationPermission('granted');
        getCurrentLocation();
      } else if (status === RESULTS.BLOCKED) {
        setLocationPermission('blocked');
        showPermissionBlockedAlert();
      } else if (status === RESULTS.DENIED) {
        setLocationPermission('denied');
        requestLocationPermission();
      }
    } catch (err) {
      console.warn('Permission check error:', err);
      setLocationPermission('unknown');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permissionConst = Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      const result = await request(permissionConst);

      if (result === RESULTS.GRANTED) {
        setLocationPermission('granted');
        getCurrentLocation();
      } else if (result === RESULTS.BLOCKED) {
        setLocationPermission('blocked');
        showPermissionBlockedAlert();
      } else {
        setLocationPermission('denied');
        showPermissionDeniedAlert();
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      setLocationPermission('denied');
    }
  };

  const showPermissionBlockedAlert = () => {
    Alert.alert(
      'Location Permission Blocked',
      'Please enable location permission in your device settings.',
      [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Location Permission Required',
      'Location permission is needed to fetch your current location.',
      [{ text: 'Try Again', onPress: () => requestLocationPermission() }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const updateLocation = (latitude: number, longitude: number) => {
    try {
      setRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      setSelectedLocation({ latitude, longitude });
      reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Error updating location:', error);
      setMapError('Failed to update location');
    }
  };

  const handleMapPress = (e: any) => {
    try {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      updateLocation(latitude, longitude);
    } catch (error) {
      console.error('Error handling map press:', error);
      setMapError('Failed to select location on map');
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const locationDetails = await Geocoding.reverseGeocode(lat, lng);
      setAddress(locationDetails.address);
      setSearchQuery(locationDetails.address);
      setAddressDetails({
        city: locationDetails.city || '',
        state: locationDetails.state || '',
        country: locationDetails.country || '',
        pincode: locationDetails.pincode || ''
      });
      setMapError(null);
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      setAddress('Selected location');
      setMapError('Failed to get address details');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (locationPermission !== 'granted') return;

    setIsLoading(true);
    try {
      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          updateLocation(latitude, longitude);
          setIsLoading(false);
        },
        error => {
          console.error('Location error:', error);
          let msg = 'Unable to fetch location.';

          if (error.code === 1) msg = 'Permission denied.';
          if (error.code === 2) msg = 'Position unavailable.';
          if (error.code === 3) msg = 'Timeout getting location.';

          Alert.alert('Location Error', msg, [
            { text: 'Retry', onPress: () => getCurrentLocation() },
            { text: 'OK', style: 'cancel' },
          ]);
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error('Error getting current location:', error);
      setIsLoading(false);
      setMapError('Failed to get current location');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await Geocoding.forwardGeocode(searchQuery);
      if (result) {
        updateLocation(result.latitude, result.longitude);
        setMapError(null);
      } else {
        Alert.alert('Search Error', 'Location not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Search Error', 'Unable to search location.');
      setMapError('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    try {
      if (selectedLocation) {
        onLocationSelect({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: address || 'Selected location',
          ...addressDetails,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error confirming location:', error);
      Alert.alert('Error', 'Failed to confirm location. Please try again.');
    }
  };

  const handleMapError = (error: any) => {
    console.error('Map error:', error);
    setMapError('Map loading failed. Please try again.');
  };

  const handleMapReady = () => {
    try {
      setIsMapReady(true);
      setMapError(null);
    } catch (error) {
      console.error('Error in handleMapReady:', error);
      setMapError('Map initialization failed');
    }
  };

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    try {
      mapRef.current.animateToRegion(region);
    } catch (error) {
      console.error('Error animating map:', error);
      setMapError('Map animation failed');
    }
  }, [region, isMapReady]);

  // Safety check to prevent rendering if there are critical errors
  if (mapError && mapError.includes('Map loading failed')) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <CustomIcon name={CustomIcons.LeftArrow} size={24} color={$.tint_1} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
          </View>
          <View style={[styles.errorContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.errorText}>{mapError}</Text>
            <TouchableOpacity 
              style={[styles.button, $.bg_tint_1, { marginTop: 16 }]} 
              onPress={() => {
                setMapError(null);
                setIsMapReady(false);
                setTimeout(() => setIsMapReady(true), 100);
              }}
            >
              <Text style={[styles.buttonText, $.text_tint_11]}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  try {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <CustomIcon name={CustomIcons.LeftArrow} size={24} color={$.tint_1} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <CustomIcon name={CustomIcons.Search} size={20} color={$.tint_1} />
            </TouchableOpacity>
            {locationPermission === 'granted' && (
              <TouchableOpacity onPress={getCurrentLocation} style={[styles.searchButton, styles.refreshButton]}>
                <CustomIcon name={CustomIcons.Refresh} size={20} color={$.tint_1} />
              </TouchableOpacity>
            )}
          </View>

          {/* Error Display */}
          {mapError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{mapError}</Text>
            </View>
          )}

          {/* Map */}
          <View style={styles.mapContainer}>
            {(() => {
              try {
                return (
                  <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={region}
                    onPress={handleMapPress}
                    showsUserLocation
                    onMapReady={handleMapReady}
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  >
                    {selectedLocation && <Marker coordinate={selectedLocation} />}
                  </MapView>
                );
              } catch (error) {
                console.error('Error rendering MapView:', error);
                setMapError('Map failed to load. Please try again.');
                return (
                  <View style={[styles.loadingContainer, { backgroundColor: '#f5f5f5' }]}>
                    <Text style={styles.errorText}>Map failed to load</Text>
                    <TouchableOpacity 
                      style={[styles.button, $.bg_tint_1, { marginTop: 16 }]} 
                      onPress={() => {
                        setMapError(null);
                        setIsMapReady(false);
                        setTimeout(() => setIsMapReady(true), 100);
                      }}
                    >
                      <Text style={[styles.buttonText, $.text_tint_11]}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
            })()}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={$.tint_primary_5} />
                <Text>Fetching location...</Text>
              </View>
            )}
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <Text style={styles.addressText}>{address || 'Tap on map to select location'}</Text>
            {addressDetails.city ? (
              <Text style={styles.detailText}>
                {[addressDetails.city, addressDetails.state, addressDetails.country, addressDetails.pincode].filter(Boolean).join(', ')}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.buttonContainer}>
            <AppButton
              name="Use Current Location"
              onPress={getCurrentLocation}
              style={[styles.button, $.bg_tint_10]}
              textStyle={[styles.buttonText, $.text_tint_1]}
              disabled={isLoading || locationPermission !== 'granted'}
            />
            <AppButton
              name="Confirm Location"
              onPress={handleConfirm}
              style={[styles.button, $.bg_tint_1]}
              textStyle={[styles.buttonText, $.text_tint_11]}
              disabled={!selectedLocation || isLoading}
            />
          </View>
        </View>
      </Modal>
    );
  } catch (error) {
    console.error('Critical error in LocationPicker:', error);
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <CustomIcon name={CustomIcons.LeftArrow} size={24} color={$.tint_1} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
          </View>
          <View style={[styles.errorContainer, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
            <TouchableOpacity 
              style={[styles.button, $.bg_tint_1, { marginTop: 16 }]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, $.text_tint_11]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { marginRight: 16 },
  title: { fontSize: 18, fontWeight: '600', color: $.tint_1 },
  searchContainer: { flexDirection: 'row', padding: 12 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10 },
  searchButton: { marginLeft: 8, padding: 10, borderRadius: 8, backgroundColor: '#eee' },
  refreshButton: { marginLeft: 8 },
  errorContainer: { padding: 12, backgroundColor: '#ffebee', marginHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  errorText: { color: '#c62828', fontSize: 14, textAlign: 'center' },
  mapContainer: { flex: 1 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  locationInfo: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  addressText: { fontSize: 16, fontWeight: '500', color: $.tint_1 },
  detailText: { fontSize: 14, color: $.tint_3 },
  buttonContainer: { flexDirection: 'row', padding: 16 },
  button: { flex: 1, marginHorizontal: 8, height: 48 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
