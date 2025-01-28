import {SafeAreaView, StatusBar} from 'react-native';
import {AppStackNavigation} from './appstack.navigation';
import {Provider} from 'react-redux';
import {persistor, store} from './redux/store.redux';
import {PersistGate} from 'redux-persist/integration/react';
function App() {
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
      
        <AppStackNavigation></AppStackNavigation>

      </PersistGate>
    </Provider>
  );
}

export {App};
