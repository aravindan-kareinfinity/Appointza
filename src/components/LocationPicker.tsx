// LocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Text, ActivityIndicator, Alert } from 'react-native';
import { BottomSheetComponent } from './bottomsheet.component';
// MapView removed - using search and current location only
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
  const bottomSheetRef = useRef<any>(null);
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
  // Map ref removed - using search and current location only

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.open();
      getCurrentLocation();
    } else {
      bottomSheetRef.current?.close();
      // Reset state when bottom sheet closes
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


  const updateLocation = (latitude: number, longitude: number) => {
    console.log('Updating location to:', latitude, longitude);
    
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

  // Map press handler removed - using search and current location only

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
    let permissionStatus;
    
    if (Platform.OS === 'android') {
      permissionStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
    } else {
      permissionStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    }

    return permissionStatus === RESULTS.GRANTED || 
           permissionStatus === PermissionsAndroid.RESULTS.GRANTED;
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
        'Location permission is needed to find your current location',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      setIsLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log('Got current position:', latitude, longitude);
        updateLocation(latitude, longitude);
        setIsLoading(false);
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
    setIsLoading(false);
  }
};
  return (
    <BottomSheetComponent
      ref={bottomSheetRef}
      onClose={onClose}
      Save={handleConfirm}
      title="Select Location"
    >
      <View style={styles.container}>

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

      

        {/* Selected Location Info */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Search for a location or use current location'}
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
          {/* <AppButton
            name="Confirm Location"
            onPress={handleConfirm}
            style={[styles.button, $.bg_tint_1]}
            textStyle={[$.text_tint_11]}
            disabled={!selectedLocation || isLoading}
          /> */}
        </View>
      </View>
    </BottomSheetComponent>
  );
};

const styles = StyleSheet.create({
  container: {
 
  },
  searchContainer: {
    flexDirection: 'row',
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
  locationSelectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 120,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: $.tint_1,
  },
  locationInfo: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: $.tint_1,
    marginTop: 10,
    marginBottom: 5,
  },
  locationSubtitle: {
    fontSize: 14,
    color: $.tint_3,
    textAlign: 'center',
  },
  addressContainer: {
    paddingVertical: 12,
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
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    height: 48,
  },
});