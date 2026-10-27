import { type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../theme';

function circleCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number,
  points = 72
): { latitude: number; longitude: number }[] {
  const earth = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const d = Math.max(radiusMeters, 1) / earth;
  const coords: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i <= points; i += 1) {
    const brng = (2 * Math.PI * i) / points;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(d) + Math.cos(latRad) * Math.sin(d) * Math.cos(brng)
    );
    const lng2 =
      lngRad +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
      );
    coords.push({
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lng2 * 180) / Math.PI,
    });
  }
  return coords;
}

export type SearchPin = { lat: number; lng: number; name: string };

type Props = {
  mapRef: RefObject<MapView | null>;
  userLocation: { lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  radius: number;
  searchPins: SearchPin[];
  onMapReady: () => void;
  onPress: (lat: number, lng: number) => void;
  onSearchPinPress: (name: string, lat: number, lng: number) => void;
};

export function PremiumGoogleMap({
  mapRef,
  userLocation,
  destination,
  radius,
  searchPins,
  onMapReady,
  onPress,
  onSearchPinPress,
}: Props) {
  return (
    <View style={styles.wrap} collapsable={false}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        googleRenderer="LATEST"
        style={styles.map}
        initialRegion={{
          latitude: 20,
          longitude: 78,
          latitudeDelta: 12,
          longitudeDelta: 12,
        }}
        onMapReady={onMapReady}
        onPress={(e) => {
          if (e.nativeEvent.action === 'marker-press') {
            return;
          }
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onPress(latitude, longitude);
        }}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={false}
        showsCompass={false}
        rotateEnabled
        pitchEnabled={false}
        loadingEnabled
        loadingBackgroundColor="#DCE6F5"
        moveOnMarkerPress={false}
      >
        {userLocation ? (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Your Location"
            pinColor={COLORS.primary}
          />
        ) : null}
        {destination ? (
          <>
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title="Destination"
              description={destination.name}
              pinColor={COLORS.alarm}
            />
            <Polygon
              key={`alert-radius-${destination.lat}-${destination.lng}-${radius}`}
              coordinates={circleCoordinates(destination.lat, destination.lng, radius)}
              strokeColor="rgba(0,71,167,0.85)"
              fillColor="rgba(0,71,167,0.18)"
              strokeWidth={3}
              zIndex={2}
              geodesic
            />
          </>
        ) : null}
        {searchPins.map((pin, index) => (
          <Marker
            key={`${pin.lat}-${pin.lng}-${index}`}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.name}
            pinColor={COLORS.alarm}
            onPress={() => onSearchPinPress(pin.name, pin.lat, pin.lng)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#DCE6F5',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
