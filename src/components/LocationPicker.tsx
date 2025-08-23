// LocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { $ } from '../styles';
import { AppButton } from './appbutton.component';
import { CustomIcon, CustomIcons } from './customicons.component';
import Geolocation from '@react-native-community/geolocation';
import { Geocoding } from '../services/geocoding.service';
import { PermissionsAndroid, Platform, Linking } from 'react-native';
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
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [region, setRegion] = useState({
    latitude: 12.9716,  // Default to Bangalore
    longitude: 77.5946,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied' | 'blocked'>('unknown');

  useEffect(() => {
    if (visible) {
      // Add a small delay to ensure modal is fully rendered
      setTimeout(() => {
        checkLocationPermission();
      }, 100);
    } else {
      // Reset state when modal closes
      setSelectedLocation(null);
      setAddress('');
      setSearchQuery('');
      setAddressDetails({
        city: '',
        state: '',
        country: '',
        pincode: ''
      });
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
      } else {
        setLocationPermission('denied');
      }
    } catch (err) {
      console.warn('Permission check error:', err);
      setLocationPermission('unknown');
    }
  };



  const updateLocation = (latitude: number, longitude: number) => {
    setRegion(prev => ({
      ...prev,
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }));
    setSelectedLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateLocation(latitude, longitude);
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
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress('Selected location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await Geocoding.forwardGeocode(searchQuery);
      if (result) {
        updateLocation(result.latitude, result.longitude);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Search Error', 'Could not find location. Please try another search.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address || 'Selected location',
        city: addressDetails.city,
        state: addressDetails.state,
        country: addressDetails.country,
        pincode: addressDetails.pincode
      });
    }
    onClose();
  };



 // Add this function to your LocationPicker component
const requestLocationPermission = async () => {
  try {
    const permissionConst = Platform.OS === 'android' 
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION 
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const current = await check(permissionConst);
    if (current === RESULTS.GRANTED) {
      setLocationPermission('granted');
      return true;
    }
    if (current === RESULTS.BLOCKED) {
      setLocationPermission('blocked');
      return false;
    }

    const requested = await request(permissionConst);
    const granted = requested === RESULTS.GRANTED || requested === PermissionsAndroid.RESULTS.GRANTED;
    setLocationPermission(granted ? 'granted' : (requested === RESULTS.BLOCKED || requested === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) ? 'blocked' : 'denied');
    return granted;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

// Then modify your getCurrentLocation function:
const getCurrentLocation = async () => {
  setIsLoading(true);
  
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is needed to find your current location. You can still search or tap the map.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      setIsLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        try {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        } catch (error) {
          console.error('Error processing location:', error);
          setHasError(true);
          setIsLoading(false);
        }
      },
      error => {
        console.error('Error getting location:', error);
        let errorMessage = 'Could not get your current location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission was denied';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        Alert.alert('Location Error', errorMessage);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  } catch (error) {
    console.error('Location error:', error);
    setHasError(true);
    setIsLoading(false);
  }
};

  // Animate map to the latest region once the map is ready
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
  }, [region, isMapReady]);
  // Show error state if there's an error
  if (hasError) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <CustomIcon name={CustomIcons.LeftArrow} size={24} color={$.tint_1} />
            </TouchableOpacity>
            <Text style={styles.title}>Select Location</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 16, color: $.tint_1, textAlign: 'center', marginBottom: 20 }}>
              Unable to load location picker. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: $.tint_1, padding: 12, borderRadius: 8 }}
              onPress={() => {
                setHasError(false);
                getCurrentLocation();
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={$.tint_4}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <CustomIcon name={CustomIcons.Search} size={20} color={$.tint_1} />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <View style={styles.map}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={region}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={false}
              followsUserLocation={false}
              loadingEnabled={true}
              onMapReady={() => setIsMapReady(true)}
            >
              {selectedLocation && (
                <Marker
                  coordinate={selectedLocation}
                  title="Selected Location"
                  pinColor={$.tint_primary_5}
                />
              )}
            </MapView>
          </View>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={$.tint_primary_5} />
            </View>
          )}
        </View>

        {/* Selected Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Tap on map to select location'}
          </Text>
          {addressDetails.city && (
            <Text style={styles.detailText}>
              {[addressDetails.city, addressDetails.state, addressDetails.country, addressDetails.pincode]
                .filter(Boolean).join(', ')}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <AppButton
            name="Use Current Location"
            onPress={getCurrentLocation}
            style={[styles.button, $.bg_tint_10]}
            textStyle={[$.text_tint_1]}
            disabled={isLoading}
          />
          <AppButton
            name="Confirm Location"
            onPress={handleConfirm}
            style={[styles.button, $.bg_tint_1]}
            textStyle={[$.text_tint_11]}
            disabled={!selectedLocation || isLoading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: $.tint_1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: $.tint_8,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    color: $.tint_1,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: $.tint_10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  locationInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addressText: {
    fontSize: 16,
    color: $.tint_1,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: $.tint_3,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    height: 48,
  },
});