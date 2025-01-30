import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CommonActions,
  CompositeScreenProps,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {$} from '../../styles';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';

type LaunchScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Launch'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function LaunchScreen() {
  const navigation = useNavigation<LaunchScreenProp['navigation']>();
  const route = useRoute<LaunchScreenProp['route']>();
  const usercontext = useAppSelector(selectusercontext);

  useEffect(() => {
    setTimeout(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'HomeTab',
            },
          ],
        }),
      );
    }, 100);
  }, []);
  return (
    <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
      <AppText>Launch</AppText>
    </AppView>
  );
}
