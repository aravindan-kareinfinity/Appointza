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
import {pushnotification_utils} from '../../utils/pushnotification';

type LaunchScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Launch'>,
  BottomTabScreenProps<HomeTabParamList>
>;
export function LaunchScreen() {
  const navigation = useNavigation<LaunchScreenProp['navigation']>();
  const route = useRoute<LaunchScreenProp['route']>();
  const usercontext = useAppSelector(selectusercontext);

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        // Register push notifications
        pushnotification_utils.registerPushNotification({});
        
        // Get push notification token
        const token = await pushnotification_utils.getPushNotificationToken();
        console.log('Push notification token:', token);
        
        // You can store this token in your Redux store or send it to your backend
        // For example: dispatch(savePushToken(token));
        
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    // Initialize push notifications
    initializePushNotifications();

    // Navigate to home after a short delay
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
