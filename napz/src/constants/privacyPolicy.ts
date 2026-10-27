/** Hosted privacy policy — must match Play Console Data safety / privacy URL. */
export const PRIVACY_POLICY_URL =
  'https://www.termsfeed.com/live/b7eac0f9-fb7f-4f4f-ae5a-4da91150c63c';

export const PRIVACY_POLICY_TITLE = 'Privacy Policy';

export const PRIVACY_POLICY_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'Who we are',
    body:
      'Napz is a destination arrival alarm app. This Privacy Policy describes how Napz handles information on your device and any data sent to third-party services.',
  },
  {
    heading: 'Precise location',
    body:
      'Napz collects location data to enable showing your current position on the map, calculating distance to your selected destination, saving your current place, and triggering an arrival alarm during an active trip. We request Android’s fine location permission for these features.',
  },
  {
    heading: 'Foreground location',
    body:
      'While you use Napz, precise location may be used to show your position on the map and to calculate distance to a selected destination.',
  },
  {
    heading: 'Background location & active trips',
    body:
      'During an active trip only, Napz collects location data even when the app is minimized, the screen is off, or the app is not in use. This background location is used to detect when you enter your selected arrival-alert radius and trigger the arrival alarm. Background location stops when you stop tracking or the trip ends.',
  },
  {
    heading: 'Arrival alarm',
    body:
      'When you enter your chosen radius around a destination, Napz can play an alarm sound and show a notification. Alarm audio is played on your device for that purpose.',
  },
  {
    heading: 'On-device processing vs data that leaves the device',
    body:
      'Continuous trip GPS used for distance checks and arrival alarms is processed on your device and is not uploaded to Napz servers. When you use map, place-search, or place-name features, Napz may transmit your location, selected map coordinates, or search location to Google Maps/Places or OpenStreetMap to provide the requested feature.',
  },
  {
    heading: 'Map and place providers',
    body:
      'Standard place search and place-name lookup use OpenStreetMap Nominatim, and map tiles may load from OpenStreetMap servers. Premium map and place features use Google Maps, Google Places, or Google Geocoding. These requests may include search text, selected coordinates, or a current-location search bias. Napz does not send the continuous live GPS stream used for trip alarms to these providers.',
  },
  {
    heading: 'Account information (Firebase)',
    body:
      'If you sign in with Google, Napz may store your name, email, and profile photo via Firebase Authentication. Optional profile fields you enter (such as mobile or PIN code) may be stored with your account. Trip GPS is not stored in Firebase.',
  },
  {
    heading: 'Data retention and deletion',
    body:
      'Saved places and active-trip state are stored on your device until you delete them, stop the trip, clear app data, or uninstall Napz. You can delete your account from the Account screen. This stops tracking and permanently deletes the Firebase account, Firestore profile and login records controlled by Napz, and local app data. You can also request deletion outside the app at the hosted Privacy Policy URL or by emailing appointza@gmail.com with the subject “Napz Account Deletion”.',
  },
  {
    heading: 'Permission revocation',
    body:
      'You may deny or revoke location, notification, or other permissions in Android Settings. Without location permission, map and tracking features that need GPS will not work; the rest of Napz remains usable where possible.',
  },
  {
    heading: 'Advertising',
    body:
      'On the Free plan, Napz may show ads from Google AdMob. Ads are not shown while Napz Premium is active. Where required (for example the EEA/UK), Napz shows Google’s UMP consent form before ads. Napz does not use trip GPS for advertising. AdMob may use a device advertising ID where allowed. You can change ad choices in device settings or the consent form.',
  },
  {
    heading: 'Contact',
    body:
      'Napz is provided by Appointza Technology (OPC) Private Limited. For privacy, access, or deletion requests, email appointza@gmail.com or call 8220035980. The hosted policy is available at https://www.termsfeed.com/live/b7eac0f9-fb7f-4f4f-ae5a-4da91150c63c.',
  },
];
