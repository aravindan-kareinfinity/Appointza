import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';
import { setAdMobReady } from './adMobReady';

let started = false;

/**
 * UMP consent first, then Mobile Ads SDK. Delay measurement is set in app.json.
 * If the consent form errors, still initialize so ads can use the last known status.
 */
export function initAdMob(): void {
  if (started) return;
  started = true;
  void (async () => {
    try {
      await AdsConsent.gatherConsent();
    } catch {
      /* still start ads — UMP keeps the previous session */
    }
    try {
      await AdsConsent.getConsentInfo();
      await mobileAds().initialize();
      let npa = true;
      try {
        const choices = await AdsConsent.getUserChoices();
        npa = choices.selectPersonalisedAds !== true;
      } catch {
        npa = true;
      }
      setAdMobReady(npa);
    } catch {
      started = false;
    }
  })();
}
