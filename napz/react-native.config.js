module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        android: null,
      },
    },
    // Android uses TrackingServiceModule + LocationManager only.
    // Unlink RNFusedLocation so it cannot show Google Location Accuracy.
    'react-native-geolocation-service': {
      platforms: {
        android: null,
      },
    },
  },
};
