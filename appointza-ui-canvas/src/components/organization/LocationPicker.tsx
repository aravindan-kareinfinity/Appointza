import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Search, Navigation } from 'lucide-react';
import { GeocodingService } from '@/services/geocoding.service';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  open,
  onOpenChange,
  onLocationSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    city: '',
    state: '',
    country: '',
    pincode: ''
  });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const geocodingService = useRef(new GeocodingService());
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setAddress('');
      setAddressDetails({ city: '', state: '', country: '', pincode: '' });
      setSelectedLocation(null);
    }
  }, [open]);

  const updateLocation = (latitude: number, longitude: number) => {
    console.log('Updating location to:', latitude, longitude);
    setSelectedLocation({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const locationDetails = await geocodingService.current.reverseGeocode(lat, lng);
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
      toast({
        title: 'Error',
        description: 'Could not get address details for this location',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await geocodingService.current.forwardGeocode(searchQuery);
      if (result && result.latitude && result.longitude) {
        updateLocation(result.latitude, result.longitude);
      } else {
        toast({
          title: 'Search Error',
          description: 'Could not find location. Please try another search.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: 'Search Error',
        description: 'Could not find location. Please try another search.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingCurrentLocation(true);
    setIsLoading(true);

    try {
      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor Geolocation plugin for native platforms
        try {
          // Dynamically import Capacitor Geolocation plugin
          const { Geolocation } = await import('@capacitor/geolocation');
          
          // Request permissions first
          const permissionStatus = await Geolocation.requestPermissions();
          
          if (permissionStatus.location !== 'granted') {
            toast({
              title: 'Permission Required',
              description: 'Location permission is needed to find your current location. Please enable it in your device settings.',
              variant: 'destructive'
            });
            setIsGettingCurrentLocation(false);
            setIsLoading(false);
            return;
          }

          // Get current position
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          });

          const { latitude, longitude } = position.coords;
          console.log('Got current position (native):', latitude, longitude);
          updateLocation(latitude, longitude);
          setIsGettingCurrentLocation(false);
          setIsLoading(false);
        } catch (error: any) {
          console.error('Native geolocation error:', error);
          let errorMessage = 'Could not get your current location';
          
          if (error.message?.includes('permission')) {
            errorMessage = 'Location permission was denied. Please enable location access in your device settings.';
          } else if (error.message?.includes('unavailable')) {
            errorMessage = 'Location information is unavailable';
          } else if (error.message?.includes('timeout')) {
            errorMessage = 'Location request timed out';
          }

          toast({
            title: 'Location Error',
            description: errorMessage,
            variant: 'destructive'
          });
          setIsGettingCurrentLocation(false);
          setIsLoading(false);
        }
      } else {
        // Use browser geolocation API for web
        if (!navigator.geolocation) {
          toast({
            title: 'Not Supported',
            description: 'Geolocation is not supported by your browser',
            variant: 'destructive'
          });
          setIsLoading(false);
          setIsGettingCurrentLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Got current position (web):', latitude, longitude);
            updateLocation(latitude, longitude);
            setIsGettingCurrentLocation(false);
            setIsLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            let errorMessage = 'Could not get your current location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission was denied. Please enable location access in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out';
                break;
            }

            toast({
              title: 'Location Error',
              description: errorMessage,
              variant: 'destructive'
            });
            setIsGettingCurrentLocation(false);
            setIsLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      }
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get current location',
        variant: 'destructive'
      });
      setIsGettingCurrentLocation(false);
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
      onOpenChange(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose location on map</DialogTitle>
          <DialogDescription>
            Search for your business address to place a pin. Current location is optional and not required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              variant="outline"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Selected Location Info */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Loading location...</span>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-appointza-teal mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {address || 'Search for your address to place a pin'}
                    </p>
                    {(addressDetails.city || addressDetails.state || addressDetails.pincode) && (
                      <p className="text-xs text-gray-600 mt-1">
                        {[addressDetails.city, addressDetails.state, addressDetails.country, addressDetails.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                {selectedLocation && (
                  <p className="text-xs text-gray-500 mt-2">
                    Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={getCurrentLocation}
              disabled={isLoading || isGettingCurrentLocation}
              variant="outline"
              className="flex-1"
            >
              {isGettingCurrentLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Use Current Location
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation || isLoading}
            className="w-full sm:w-auto"
          >
            Confirm Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

