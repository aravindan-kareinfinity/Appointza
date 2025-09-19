import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AppStackNavigation} from './appstack.navigation';
import {Provider} from 'react-redux';
import {persistor, store} from './redux/store.redux';
import {PersistGate} from 'redux-persist/integration/react';
import { ThemeProvider } from './components/theme-provider';
import { useEffect } from 'react';
import { initializeApp, getApps } from '@react-native-firebase/app';
import { usePushNotifications } from './hooks/usePushNotifications';
// CSS styles are handled by NativeWind and custom styling system

function App() {
  const { isInitialized, pushToken } = usePushNotifications();

  useEffect(() => {
    // Initialize Firebase if not already initialized
    if (getApps().length === 0) {
      try {
        initializeApp();
        console.log('✅ Firebase initialized successfully');
      } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialized && pushToken) {
      console.log('✅ Push notifications ready with token:', pushToken);
      
      // Test push notification registration
      try {
        const { pushnotification_utils } = require('./utils/pushnotification');
        pushnotification_utils.registerPushNotification({});
        console.log('✅ Push notification registration completed');
      } catch (error) {
        console.error('❌ Error registering push notifications:', error);
      }
    }
  }, [isInitialized, pushToken]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <AppStackNavigation />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export {App};
