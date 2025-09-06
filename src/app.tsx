import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AppStackNavigation} from './appstack.navigation';
import {Provider} from 'react-redux';
import {persistor, store} from './redux/store.redux';
import {PersistGate} from 'redux-persist/integration/react';
import { ThemeProvider } from './components/theme-provider';
import { useEffect } from 'react';
import { initializeApp, getApps } from '@react-native-firebase/app';
// CSS styles are handled by NativeWind and custom styling system

function App() {
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
