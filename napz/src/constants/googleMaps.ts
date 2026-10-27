export const GOOGLE_MAPS_API_KEY = 'AIzaSyBK-jeC4P0LzQgL_cWz3xrTtSpYi0waZ_M';

/** Server-capable key for Routes / Directions HTTP. Maps SDK still uses GOOGLE_MAPS_API_KEY. */
export const GOOGLE_ROUTES_API_KEY = 'AIzaSyDz3rVPMTvjWj_Hf92awzw6CJJ2n50wJfo';

/** SHA-1 without colons — required on Places/Geocoding HTTP calls when the key is Android-restricted. */
export const GOOGLE_MAPS_ANDROID_CERT_SHA1 = __DEV__
  ? '5E8F16062EA3CD2C4A0D547876BAA6F38CABF625'
  : '8D7C64BCC9409368D4195723800A19C107D45FDC';
