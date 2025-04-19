import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {
  Button,
  FlatList,
  GestureResponderEvent,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {
  selectusercontext,
  usercontextactions,
} from '../../redux/usercontext.redux';
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useState,
} from 'react';
import {DefaultColor, ThemeType} from '../../styles/default-color.style';
import {themeActions} from '../../redux/theme.redux';
import {store} from '../../redux/store.redux';

type DashboardScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Dashboard'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenProp['navigation']>();
  const usercontext = useAppSelector(selectusercontext);

  return (
    <ScrollView style={[$.flex_1, $.bg_tint_11]}>
      <AppText style={[$.fs_medium,$.fw_semibold,$.p_small,$.text_primary2]}>Dashboard</AppText>
    </ScrollView>
  );
}
