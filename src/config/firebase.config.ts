import { initializeApp, getApps } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  // These values should match your google-services.json file
  // For React Native Firebase, the configuration is automatically read from google-services.json
  // But we can still initialize the app explicitly
};

// Initialize Firebase only if no apps are already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export { app };
export default app; 