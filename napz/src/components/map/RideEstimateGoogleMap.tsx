import { useEffect, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../../theme';
import type { RideLatLng, RidePlace } from '../../rideEstimate/types';

type Props = {
  mapRef: RefObject<MapView | null>;
  pickup: RidePlace | null;
  destination: RidePlace | null;
  route: RideLatLng[];
  onMapReady: () => void;
};

export function RideEstimateGoogleMap({
  mapRef,
  pickup,
  destination,
  route,
  onMapReady,
}: Props) {
  useEffect(() => {
    const coords = [
      ...(pickup ? [{ latitude: pickup.lat, longitude: pickup.lng }] : []),
      ...route.map((point) => ({ latitude: point.lat, longitude: point.lng })),
      ...(destination ? [{ latitude: destination.lat, longitude: destination.lng }] : []),
    ];
    if (coords.length < 2) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [mapRef, pickup, destination, route]);

  return (
    <View style={styles.wrap} collapsable={false}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        googleRenderer="LATEST"
        style={styles.map}
        initialRegion={{
          latitude: pickup?.lat ?? 20,
          longitude: pickup?.lng ?? 78,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onMapReady={onMapReady}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        pitchEnabled={false}
        loadingEnabled
        loadingBackgroundColor="#DCE6F5"
      >
        {pickup ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup"
            description={pickup.name}
            pinColor={COLORS.primary}
          />
        ) : null}
        {destination ? (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title="Destination"
            description={destination.name}
            pinColor={COLORS.alarm}
          />
        ) : null}
        {route.length > 1 ? (
          <Polyline
            coordinates={route.map((point) => ({ latitude: point.lat, longitude: point.lng }))}
            strokeColor={COLORS.primary}
            strokeWidth={5}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%', height: '100%', backgroundColor: '#DCE6F5' },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
