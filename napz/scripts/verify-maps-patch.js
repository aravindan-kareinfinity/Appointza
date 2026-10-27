/**
 * Fails the build if react-native-maps is missing the Play disclosure patch
 * (Fused location must not attach when showsUserLocation is false).
 */
const fs = require('fs');
const path = require('path');

const mapView = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-maps',
  'android',
  'src',
  'main',
  'java',
  'com',
  'rnmaps',
  'maps',
  'MapView.java'
);
const locationSource = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-maps',
  'android',
  'src',
  'main',
  'java',
  'com',
  'rnmaps',
  'maps',
  'FusedLocationSource.java'
);
const mapManager = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-maps',
  'android',
  'src',
  'main',
  'java',
  'com',
  'rnmaps',
  'maps',
  'MapManager.java'
);
const mapsGradle = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-maps',
  'android',
  'build.gradle'
);

if (![mapView, locationSource, mapManager, mapsGradle].every(fs.existsSync)) {
  console.error('ERROR: patched react-native-maps sources not found. Run npm install first.');
  process.exit(1);
}

const src = fs.readFileSync(mapView, 'utf8');
const locationSrc = fs.readFileSync(locationSource, 'utf8');
const managerSrc = fs.readFileSync(mapManager, 'utf8');
const gradleSrc = fs.readFileSync(mapsGradle, 'utf8');
if (
  !src.includes('detachUserLocationFromMap') ||
  !locationSrc.includes('Blocked react-native-maps location-source activation') ||
  locationSrc.includes('LocationServices.getFusedLocationProviderClient') ||
  managerSrc.includes('com.google.android.gms.location') ||
  gradleSrc.includes('play-services-location')
) {
  console.error(
    'ERROR: react-native-maps patch NOT applied. Run: npx patch-package\n' +
      'Without this patch, Google Maps can include or activate Fused Location.'
  );
  process.exit(1);
}

console.log('verify-maps-patch: OK (map-owned location disabled; Fused dependency absent)');
