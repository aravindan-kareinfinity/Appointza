import {SafeAreaView, StatusBar} from 'react-native';
import {AppStackNavigation} from './appstack.navigation';
import {Provider} from 'react-redux';
import {persistor, store} from './redux/store.redux';
import {PersistGate} from 'redux-persist/integration/react';
import { ThemeProvider } from './components/theme-provider';
// CSS styles are handled by NativeWind and custom styling system

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AppStackNavigation />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export {App};
