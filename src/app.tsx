import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AppStackNavigation} from './appstack.navigation';
import {Provider} from 'react-redux';
import {persistor, store} from './redux/store.redux';
import {PersistGate} from 'redux-persist/integration/react';
import { ThemeProvider } from './components/theme-provider';
// CSS styles are handled by NativeWind and custom styling system

function App() {
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
