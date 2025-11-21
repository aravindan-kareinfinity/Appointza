import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {TouchableOpacity, SafeAreaView} from 'react-native';
import {ServiceScreen} from '../events/servicelist.screen';
import {EventScreen} from '../events/eventlist.screen';
import {Colors} from '../../constants/colors';
import {DefaultColor} from '../../styles/default-color.style';

type HomeScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

type TabType = 'services' | 'events';

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenProp['navigation']>();
  const route = useRoute<HomeScreenProp['route']>();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const colors = DefaultColor.instance;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Colors.light.background}}>
      <AppView style={[$.flex_1, $.bg_tint_11]}>
        {/* Tab Selector */}
        <AppView
          style={[
            $.flex_row,
            $.bg_tint_11,
            $.px_small,
            $.py_small,
            {
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(0,0,0,0.1)',
            },
          ]}>
          <TouchableOpacity
            style={[
              $.flex_1,
              $.align_items_center,
              $.py_small,
              $.px_small,
              {
                backgroundColor:
                  activeTab === 'services' ? colors.tint_1 : 'transparent',
                borderRadius: 8,
                marginRight: 6,
              },
            ]}
            onPress={() => setActiveTab('services')}>
            <AppText
              style={[
                $.fw_semibold,
                $.fs_regular,
                {
                  color:
                    activeTab === 'services' ? colors.tint_11 : colors.tint_3,
                },
              ]}>
              Services
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              $.flex_1,
              $.align_items_center,
              $.py_small,
              $.px_small,
              {
                backgroundColor:
                  activeTab === 'events' ? colors.tint_1 : 'transparent',
                borderRadius: 8,
                marginLeft: 6,
              },
            ]}
            onPress={() => setActiveTab('events')}>
            <AppText
              style={[
                $.fw_semibold,
                $.fs_regular,
                {
                  color: activeTab === 'events' ? colors.tint_11 : colors.tint_3,
                },
              ]}>
              Events
            </AppText>
          </TouchableOpacity>
        </AppView>

        {/* Content Area */}
        <AppView style={[$.flex_1]}>
          {activeTab === 'services' ? (
            <ServiceScreen />
          ) : (
            <EventScreen />
          )}
        </AppView>
      </AppView>
    </SafeAreaView>
  );
}
