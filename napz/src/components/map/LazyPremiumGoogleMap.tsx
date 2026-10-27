import React, { Suspense, lazy, type RefObject } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { SearchPin } from './PremiumGoogleMap';

const PremiumGoogleMap = lazy(() =>
  import('./PremiumGoogleMap').then((m) => ({ default: m.PremiumGoogleMap }))
);

type Props = {
  mapRef: RefObject<unknown>;
  userLocation: { lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  radius: number;
  searchPins: SearchPin[];
  onMapReady: () => void;
  onPress: (lat: number, lng: number) => void;
  onSearchPinPress: (name: string, lat: number, lng: number) => void;
};

/** Defers loading react-native-maps native code until this component mounts. */
export function LazyPremiumGoogleMap(props: Props) {
  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <PremiumGoogleMap {...props} mapRef={props.mapRef as RefObject<import('react-native-maps').default | null>} />
    </Suspense>
  );
}
