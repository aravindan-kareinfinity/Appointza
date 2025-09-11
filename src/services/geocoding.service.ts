import { Platform } from 'react-native';
import Geocoder from 'react-native-geocoding';
import { environment } from '../utils/environment';

// Initialize with your API key (Google Maps API)
Geocoder.init(environment.googleMapsApiKey);

export const Geocoding = {
  reverseGeocode: async (lat: number, lng: number) => {
    try {
      const response = await Geocoder.from(lat, lng);
      if (response.results.length > 0) {
        const address = response.results[0].formatted_address;
        const components = response.results[0].address_components;
        
        let city = '';
        let state = '';
        let country = '';
        let pincode = '';
        
        components.forEach((component: { types: string | string[]; long_name: string; }) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });
        
        return {
          address,
          city,
          state,
          country,
          pincode
        };
      }
      return { address: 'Selected location' };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { address: 'Selected location' };
    }
  },
  
  forwardGeocode: async (address: string) => {
    try {
      const response = await Geocoder.from(address);
      if (response.results.length > 0) {
        const location = response.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          address: response.results[0].formatted_address
        };
      }
      return null;
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }

  
};