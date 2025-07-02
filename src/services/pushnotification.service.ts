import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PushNotificationService {
  private static instance: PushNotificationService;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async requestUserPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Authorization status:', authStatus);
        return true;
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You will not receive appointment reminders. You can enable notifications in Settings.',
          [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
        );
        return false;
      }
    } catch (error) {
      console.error('⚠️ Permission request error:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Check if we already have a token
      if (this.fcmToken) {
        return this.fcmToken;
      }

      // Get token from storage
      const storedToken = await AsyncStorage.getItem('fcmToken');
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // Request new token
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        await AsyncStorage.setItem('fcmToken', token);
        console.log('✅ New FCM Token:', token);
      }
      return token;
    } catch (error) {
      console.error('⚠️ FCM Token error:', error);
      return null;
    }
  }

  async setupNotificationListeners() {
    try {
      // Handle background messages
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('📱 Message handled in the background!', remoteMessage);
      });

      // Check for initial notification
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('📱 Notification caused app to open:', initialNotification);
        // Handle initial notification here
      }

      // Handle foreground messages
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('📱 Received foreground message:', remoteMessage);
        Alert.alert(
          remoteMessage.notification?.title || 'New Message',
          remoteMessage.notification?.body || 'You have a new message!'
        );
      });

      // Handle token refresh
      messaging().onTokenRefresh(token => {
        console.log('🔄 FCM Token refreshed:', token);
        this.fcmToken = token;
        AsyncStorage.setItem('fcmToken', token);
      });

      return unsubscribe;
    } catch (error) {
      console.error('⚠️ Notification setup error:', error);
      return null;
    }
  }

  async removeFCMToken() {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem('fcmToken');
      this.fcmToken = null;
      console.log('🗑️ FCM Token removed');
    } catch (error) {
      console.error('⚠️ Token removal error:', error);
    }
  }
}

export default PushNotificationService; 