/**
 * AdMob for Napz — Android package com.wakemethere
 * Publisher: pub-1673268902922736
 *
 * Console (you do this once):
 * 1. AdMob → Apps → Add app → Android → package com.wakemethere
 * 2. Copy App ID (ca-app-pub-1673268902922736~…) into app.json android_app_id
 * 3. Ad units → Add banner → copy unit ID into ADMOB_BANNER_UNIT_ID below
 * 4. Privacy & messaging → GDPR (and IDFA if you ship iOS)
 * 5. Firebase → Project settings → Integrations → AdMob → link the same app
 *
 * Development always uses Google test ads. Production ads only after live IDs + consent.
 */
export const ADMOB_PUBLISHER_ID = 'pub-1673268902922736';
export const ADMOB_ANDROID_PACKAGE = 'com.wakemethere';

/** Replace with your Napz App ID from AdMob before a Play release. */
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

/** Replace with your Napz banner unit (ca-app-pub-1673268902922736/…). */
export const ADMOB_BANNER_UNIT_ID = '';
