import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { usePremiumEntitlement } from '../entitlement/usePremiumEntitlement';
import { ADMOB_BANNER_UNIT_ID } from './admobConfig';
import { logAdImpression, logAdPaid } from './analytics';
import {
  isAdMobReady,
  subscribeAdMobReady,
  wantsNonPersonalizedAdsOnly,
} from './adMobReady';

function bannerUnitId(): string {
  if (__DEV__) return TestIds.BANNER;
  return ADMOB_BANNER_UNIT_ID.trim();
}

export function FreeBannerAd() {
  const { showAds, loading } = usePremiumEntitlement();
  const [sdkReady, setSdkReady] = useState(isAdMobReady);
  const unitId = bannerUnitId();

  useEffect(() => subscribeAdMobReady(() => setSdkReady(true)), []);

  if (loading || !showAds || !sdkReady || !unitId) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: wantsNonPersonalizedAdsOnly(),
        }}
        onAdImpression={() => {
          void logAdImpression();
        }}
        onPaid={(event) => {
          void logAdPaid(event);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
  },
});
